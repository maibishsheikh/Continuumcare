/*
  Logistic Regression–style Risk Scorer
  - Deterministic
  - Explainable
  - Used ONLY for prioritization
*/

exports.computeRiskScore = (patient = {}) => {
  // Safe defaults (so missing fields don't crash)
  const age = Number(patient.age || 45);
  const bmi = Number(patient.bmi || 24);
  const sleep = Number(patient.sleep || 7);
  const exercise = patient.exercise || "medium";
  const smoking = Boolean(patient.smoking || false);
  const alcohol = Boolean(patient.alcohol || false);

  // Representative coefficients (from pre-trained LR; demo-safe)
  const coef = {
    intercept: -4.2,
    age: 0.04,
    bmi: 0.08,
    sleep: -0.35,
    exerciseLow: 0.6,
    smoking: 0.7,
    alcohol: 0.4
  };

  let z = coef.intercept;
  z += coef.age * age;
  z += coef.bmi * bmi;
  z += coef.sleep * sleep;
  if (exercise === "low") z += coef.exerciseLow;
  if (smoking) z += coef.smoking;
  if (alcohol) z += coef.alcohol;

  // Logistic function
  const p = 1 / (1 + Math.exp(-z));

  let riskLevel = "Low";
  if (p >= 0.7) riskLevel = "High";
  else if (p >= 0.4) riskLevel = "Medium";

  return {
    riskScore: Number(p.toFixed(2)),
    riskLevel
  };
};
