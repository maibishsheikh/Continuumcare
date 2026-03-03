import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

# Load SAME dataset used originally
df = pd.read_csv("data.csv")  # ⚠️ use your actual dataset file

FEATURES = [
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

X = df[FEATURES]
y = df["risk"]  # or target column used earlier

# Convert boolean to int
X = X.astype(int)

# SCALE
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train model again (same params)
model = LogisticRegression(max_iter=1000)
model.fit(X_scaled, y)

# Save artifacts
joblib.dump(model, "models/logistic_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")

print("✅ Model and scaler saved successfully")
