const DailyCheckin = require("../models/DailyCheckin");
const Patient = require("../models/Patient");
const Alert = require("../models/Alert");
const { evaluateRules } = require("../services/ruleEngine");

/* ─── Vitals-based risk score ─────────────────────────────────────────────
   Produces a 0–1 score purely from the current check-in vitals + symptoms.
   Thresholds are based on standard clinical guidelines.
─────────────────────────────────────────────────────────────────────────── */
function computeVitalsRisk({ systolic, diastolic, heartRate, spo2 }, symptoms = []) {
  let score = 0;

  // Blood pressure contribution
  if (systolic >= 180 || diastolic >= 120)      score += 0.40;  // hypertensive crisis
  else if (systolic >= 160 || diastolic >= 100) score += 0.25;  // stage 2 hypertension
  else if (systolic >= 140 || diastolic >= 90)  score += 0.15;  // stage 1 hypertension
  else if (systolic < 90  || diastolic < 60)    score += 0.20;  // hypotension

  // SpO2 contribution
  if (spo2 < 90)       score += 0.35;  // critical hypoxia
  else if (spo2 < 92)  score += 0.20;
  else if (spo2 < 95)  score += 0.10;

  // Heart rate contribution
  if (heartRate > 130)      score += 0.20;
  else if (heartRate > 110) score += 0.10;
  else if (heartRate < 50)  score += 0.15;   // bradycardia

  // Symptoms
  if (symptoms.includes("chestPain"))      score += 0.25;
  if (symptoms.includes("breathlessness")) score += 0.15;
  if (symptoms.includes("fever"))          score += 0.08;
  if (symptoms.includes("dizziness"))      score += 0.08;
  if (symptoms.includes("fatigue"))        score += 0.05;

  const riskScore = Math.min(parseFloat(score.toFixed(2)), 1.0);
  let riskLevel = "Low";
  if (riskScore >= 0.7)      riskLevel = "High";
  else if (riskScore >= 0.35) riskLevel = "Medium";

  return { riskScore, riskLevel };
}

/*  CREATE DAILY CHECK-IN  */
exports.createCheckin = async (req, res) => {
  try {
    const {
      patientId,
      systolic,
      diastolic,
      heartRate,
      spo2,
      medicationTaken,
      symptoms = [],
    } = req.body;

    if (!patientId) return res.status(400).json({ message: "patientId required" });

    // ── Validate vitals ranges ──────────────────────────────────────────────
    const errs = [];
    if (systolic  < 60  || systolic  > 250) errs.push("Systolic must be 60–250 mmHg");
    if (diastolic < 40  || diastolic > 150) errs.push("Diastolic must be 40–150 mmHg");
    if (heartRate < 30  || heartRate > 220) errs.push("Heart rate must be 30–220 bpm");
    if (spo2      < 50  || spo2      > 100) errs.push("SpO₂ must be 50–100%");
    if (errs.length) return res.status(400).json({ errors: errs });

    const vitals = { systolic, diastolic, heartRate, spo2 };

    // ── Compute risk from vitals ────────────────────────────────────────────
    const { riskScore, riskLevel } = computeVitalsRisk(vitals, symptoms);

    // ── 1. Save check-in ────────────────────────────────────────────────────
    const checkin = await DailyCheckin.create({
      patientId,
      vitals,
      medicationTaken,
      symptoms,
      riskScore,
      riskLevel,
    });

    // ── 2. Fetch recent check-ins for trend rules ───────────────────────────
    const recentCheckins = await DailyCheckin.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    // evaluateRules expects oldest-first
    const recentAsc = recentCheckins.reverse();

    // ── 3. Evaluate rule engine ─────────────────────────────────────────────
    const ruleAlerts = evaluateRules(recentAsc);

    // ── 4. Add risk-score-based alert if High or Medium ────────────────────
    const allAlertDefs = [...ruleAlerts];
    if (riskLevel === "High" && !allAlertDefs.some(a => a.ruleCode === "RISK_SCORE_HIGH")) {
      allAlertDefs.push({
        ruleCode: "RISK_SCORE_HIGH",
        severity: "high",
        message: `High overall risk score detected (${(riskScore * 100).toFixed(0)}%). Immediate clinician review recommended.`,
      });
    } else if (riskLevel === "Medium" && !allAlertDefs.some(a => a.ruleCode === "RISK_SCORE_MEDIUM")) {
      allAlertDefs.push({
        ruleCode: "RISK_SCORE_MEDIUM",
        severity: "medium",
        message: `Moderate risk score (${(riskScore * 100).toFixed(0)}%). Monitor closely.`,
      });
    }

    // ── 5. Fetch patient to get doctorId ────────────────────────────────────
    const patient = await Patient.findById(patientId).lean();
    const doctorId = patient?.doctorId || null;

    // ── 6. Save ONE consolidated summary alert (if any rules fired) ──────────
    if (allAlertDefs.length > 0) {
      // Compute the highest severity among all triggered rules
      const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      const topSeverity = allAlertDefs.reduce((best, a) =>
        (severityOrder[a.severity] || 0) > (severityOrder[best.severity] || 0) ? a : best
      , allAlertDefs[0]).severity;

      const n = allAlertDefs.length;
      const summaryMessage =
        `${n} clinical indicator${n !== 1 ? "s" : ""} flagged — ` +
        `overall risk ${riskLevel} (${(riskScore * 100).toFixed(0)}%). Review details below.`;

      await Alert.create({
        patientId,
        doctorId,
        ruleCode: "SUMMARY",
        severity: topSeverity,
        message: summaryMessage,
        riskScore,
        riskLevel,
        vitals,
        symptoms,
        triggeredRules: allAlertDefs.map(a => ({
          ruleCode: a.ruleCode,
          severity: a.severity,
          message:  a.message,
        })),
        resolved: false,
      });
    }

    // ── 7. Update patient's latest risk level ───────────────────────────────
    await Patient.findByIdAndUpdate(patientId, { riskLevel, riskScore });

    res.status(201).json({
      message: "Check-in submitted successfully",
      checkinId: checkin._id,
      riskScore,
      riskLevel,
      alertsGenerated: allAlertDefs.length,
    });
  } catch (error) {
    console.error("createCheckin error:", error);
    res.status(500).json({ error: error.message });
  }
};

/*  GET ALL CHECK-INS FOR A PATIENT  */
exports.getCheckinsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const checkins = await DailyCheckin.find({ patientId }).sort({ createdAt: 1 });
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*  GET LATEST CHECK-IN FOR A PATIENT  */
exports.getLatestCheckin = async (req, res) => {
  try {
    const { patientId } = req.params;
    const checkin = await DailyCheckin.findOne({ patientId }).sort({ createdAt: -1 });
    if (!checkin) return res.status(404).json({ message: "No check-ins found" });
    res.json(checkin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

