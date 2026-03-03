from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import joblib
import os

app = FastAPI(title="ContinuumCare ML Risk API")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

logistic_model = joblib.load(os.path.join(BASE_DIR, "models/logistic_model.pkl"))
decision_tree_model = joblib.load(os.path.join(BASE_DIR, "models/decision_tree_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "models/scaler.pkl"))

FEATURE_ORDER = [
    "systolic",
    "diastolic",
    "heartRate",
    "spo2",
    "medicationTaken",
    "fever",
    "dizziness",
    "fatigue",
    "breathlessness",
    "chestPain"
]

class RiskInput(BaseModel):
    systolic: int
    diastolic: int
    heartRate: int
    spo2: int
    medicationTaken: bool
    fever: bool
    dizziness: bool
    fatigue: bool
    breathlessness: bool
    chestPain: bool

@app.get("/")
def root():
    return {"status": "ML API Running"}

@app.post("/predict-risk")
def predict_risk(data: RiskInput):

    raw_features = np.array([[
        data.systolic,
        data.diastolic,
        data.heartRate,
        data.spo2,
        int(data.medicationTaken),
        int(data.fever),
        int(data.dizziness),
        int(data.fatigue),
        int(data.breathlessness),
        int(data.chestPain)
    ]])

    scaled = scaler.transform(raw_features)

    ml_risk = float(logistic_model.predict_proba(scaled)[0][1])
    tree_prediction = int(decision_tree_model.predict(scaled)[0])

    # -------- MEDICAL RULE OVERRIDE --------
    rule_risk = 0.0

    if data.spo2 < 90:
        rule_risk += 0.35
    if data.systolic >= 180 or data.diastolic >= 120:
        rule_risk += 0.30
    if data.heartRate >= 120:
        rule_risk += 0.20
    if data.chestPain or data.breathlessness:
        rule_risk += 0.25
    if not data.medicationTaken:
        rule_risk += 0.10

    final_risk = min(1.0, max(ml_risk, rule_risk))

    if final_risk >= 0.7:
        risk_level = "High"
    elif final_risk >= 0.4:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "riskScore": round(final_risk, 4),
        "riskLevel": risk_level,
        "mlRisk": round(ml_risk, 4),
        "ruleRisk": round(rule_risk, 4),
        "treePrediction": tree_prediction
    }
