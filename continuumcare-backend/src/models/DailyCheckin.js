const mongoose = require("mongoose");

const DailyCheckinSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  vitals: {
    systolic: { type: Number, required: true },    // mmHg
    diastolic: { type: Number, required: true },   // mmHg
    heartRate: { type: Number, required: true },   // bpm
    spo2: { type: Number, required: true },        // %
  },
  medicationTaken: {
    type: Boolean,
    default: null,
  },
  symptoms: {
    type: [String],   // e.g. ["fever", "dizziness"]
    default: [],
  },
  riskScore: { type: Number, default: null },
  riskLevel: { type: String, enum: ["Low", "Medium", "High", null], default: null },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DailyCheckin", DailyCheckinSchema);
