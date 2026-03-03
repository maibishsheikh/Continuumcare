const mongoose = require("mongoose");

const TriggeredRuleSchema = new mongoose.Schema({
  ruleCode: { type: String },
  severity: { type: String, enum: ["low", "medium", "high", "critical"] },
  message:  { type: String },
}, { _id: false });

const AlertSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctorId: {
    type: String,
    default: null,
  },
  // "SUMMARY" for the consolidated single-alert-per-checkin pattern
  ruleCode: { type: String, default: "SUMMARY" },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  message: { type: String },
  riskScore: { type: Number, default: null },
  riskLevel: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low",
  },
  vitals: {
    systolic: Number,
    diastolic: Number,
    heartRate: Number,
    spo2: Number,
  },
  symptoms: { type: [String], default: [] },
  // All individual rules that fired during this check-in
  triggeredRules: { type: [TriggeredRuleSchema], default: [] },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: String, default: null },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Alert", AlertSchema);
