/*
  Rule Engine — evaluates recent check-ins, returns alert objects.
  All vitals field names MUST match the DailyCheckin model:
    c.vitals.systolic, c.vitals.diastolic, c.vitals.heartRate, c.vitals.spo2
  Symptoms is an array of strings: ["fever", "breathlessness", ...]
*/

exports.evaluateRules = (checkins) => {
  const alerts = [];
  if (!checkins || checkins.length === 0) return alerts;

  const latest = checkins[checkins.length - 1];
  const v = latest?.vitals || {};
  const symptoms = Array.isArray(latest?.symptoms) ? latest.symptoms : [];

  // ─── IMMEDIATE CRITICAL VITALS (single check-in) ───────────────────────────

  // RULE 0: Hypertensive crisis (systolic ≥ 180 or diastolic ≥ 120)
  if (v.systolic >= 180 || v.diastolic >= 120) {
    alerts.push({
      ruleCode: "HYPERTENSIVE_CRISIS",
      severity: "high",
      message: `Hypertensive crisis detected — BP ${v.systolic}/${v.diastolic} mmHg. Seek immediate medical attention.`,
    });
  }
  // RULE 1a: High systolic BP (single reading ≥ 140)
  else if (v.systolic >= 140) {
    alerts.push({
      ruleCode: "BP_HIGH_SINGLE",
      severity: "medium",
      message: `Elevated systolic blood pressure: ${v.systolic} mmHg`,
    });
  }

  // RULE 2a: Dangerously low SpO2 (< 90%)
  if (v.spo2 < 90) {
    alerts.push({
      ruleCode: "CRITICAL_LOW_SPO2",
      severity: "high",
      message: `Critical oxygen saturation: ${v.spo2}%. Immediate attention required.`,
    });
  }
  // RULE 2b: Low SpO2 (90-92%)
  else if (v.spo2 < 92) {
    alerts.push({
      ruleCode: "LOW_SPO2",
      severity: "medium",
      message: `Low oxygen saturation: ${v.spo2}%. Monitor closely.`,
    });
  }

  // RULE 3: High heart rate (single > 110 bpm)
  if (v.heartRate > 110) {
    alerts.push({
      ruleCode: "HIGH_HEART_RATE",
      severity: "medium",
      message: `Elevated heart rate: ${v.heartRate} bpm`,
    });
  }

  // RULE 4: Chest pain or breathlessness reported
  if (symptoms.includes("chestPain")) {
    alerts.push({
      ruleCode: "CHEST_PAIN_REPORTED",
      severity: "high",
      message: "Patient reported chest pain. Urgent evaluation needed.",
    });
  }
  if (symptoms.includes("breathlessness")) {
    alerts.push({
      ruleCode: "BREATHLESSNESS_REPORTED",
      severity: "medium",
      message: "Patient reported breathlessness.",
    });
  }

  // RULE 5: Missed medication with symptoms
  if (
    latest?.medicationTaken === false &&
    (symptoms.includes("fever") || symptoms.includes("breathlessness") || symptoms.includes("chestPain"))
  ) {
    alerts.push({
      ruleCode: "MISSED_MEDS_WITH_SYMPTOMS",
      severity: "medium",
      message: "Missed medication combined with worsening symptoms.",
    });
  }

  // ─── TREND RULES (multiple check-ins) ──────────────────────────────────────

  // RULE 6: High BP for 3 consecutive check-ins
  if (checkins.length >= 3) {
    const last3 = checkins.slice(-3);
    const persistentHighBP = last3.every(
      c => c.vitals && c.vitals.systolic > 140
    );
    if (persistentHighBP) {
      // Avoid duplicate with RULE 0/1a
      const alreadyFlagged = alerts.some(a =>
        a.ruleCode === "HYPERTENSIVE_CRISIS" || a.ruleCode === "BP_HIGH_SINGLE"
      );
      if (!alreadyFlagged) {
        alerts.push({
          ruleCode: "BP_HIGH_3_DAYS",
          severity: "high",
          message: "Persistently high blood pressure over 3 consecutive check-ins.",
        });
      }
    }
  }

  // RULE 7: Low SpO2 for 2 consecutive check-ins
  if (checkins.length >= 2) {
    const last2 = checkins.slice(-2);
    const persistentLowSpo2 = last2.every(
      c => c.vitals && c.vitals.spo2 < 92
    );
    if (persistentLowSpo2 && !alerts.some(a => a.ruleCode === "CRITICAL_LOW_SPO2")) {
      alerts.push({
        ruleCode: "LOW_SPO2_2_DAYS",
        severity: "high",
        message: "Low oxygen saturation over 2 consecutive check-ins.",
      });
    }
  }

  // RULE 8: High heart rate for 2 consecutive check-ins
  if (checkins.length >= 2) {
    const last2 = checkins.slice(-2);
    const persistentHighHR = last2.every(
      c => c.vitals && c.vitals.heartRate > 100
    );
    if (persistentHighHR && !alerts.some(a => a.ruleCode === "HIGH_HEART_RATE")) {
      alerts.push({
        ruleCode: "HIGH_HEART_RATE_2_DAYS",
        severity: "medium",
        message: "Elevated heart rate over 2 consecutive check-ins.",
      });
    }
  }

  return alerts;
};
