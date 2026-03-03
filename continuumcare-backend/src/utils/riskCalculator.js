/**
 * Calculates patient risk score based on vitals, symptoms, medication
 * Returns: { riskScore, riskLevel, reasons }
 */
function calculateRiskScore({ vitals, symptoms, medicationTaken }) {
  let score = 0;
  const reasons = [];

  const { bpSys, bpDia, heartRate, spo2 } = vitals;

  /* ---------- BLOOD PRESSURE ---------- */
  if (bpSys >= 160 || bpDia >= 100) {
    score += 0.4;
    reasons.push("Severely high blood pressure");
  } else if (bpSys >= 140 || bpDia >= 90) {
    score += 0.25;
    reasons.push("High blood pressure");
  }

  /* ---------- HEART RATE ---------- */
  if (heartRate > 120 || heartRate < 40) {
    score += 0.25;
    reasons.push("Abnormal heart rate");
  }

  /* ---------- SPO2 ---------- */
  if (spo2 < 90) {
    score += 0.4;
    reasons.push("Low oxygen saturation");
  } else if (spo2 < 94) {
    score += 0.2;
    reasons.push("Borderline oxygen saturation");
  }

  /* ---------- SYMPTOMS ---------- */
  if (symptoms.includes("breathlessness")) {
    score += 0.3;
    reasons.push("Breathlessness reported");
  }

  if (symptoms.includes("chestPain")) {
    score += 0.4;
    reasons.push("Chest pain reported");
  }

  if (symptoms.length >= 3) {
    score += 0.2;
    reasons.push("Multiple symptoms reported");
  }

  /* ---------- MEDICATION ---------- */
  if (medicationTaken === false) {
    score += 0.2;
    reasons.push("Medication missed");
  }

  /* ---------- NORMALIZE ---------- */
  score = Math.min(score, 1);

  let riskLevel = "Low";
  if (score >= 0.7) riskLevel = "High";
  else if (score >= 0.3) riskLevel = "Medium";

  return {
    riskScore: Number(score.toFixed(2)),
    riskLevel,
    reasons
  };
}

module.exports = { calculateRiskScore };
