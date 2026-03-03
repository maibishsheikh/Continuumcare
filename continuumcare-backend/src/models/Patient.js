const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  phone:         { type: String },
  age:           { type: Number, min: 0, max: 120 },
  gender:        { type: String, enum: ["Male", "Female", "Other"] },
  condition:     { type: String },           // e.g. "Hypertension", "Diabetes"
  medicalHistory:{ type: String },
  doctorId:      { type: String },           // assigned doctor

  // Lifestyle factors used by risk scorer
  bmi:           { type: Number, min: 10, max: 60, default: 24 },
  sleep:         { type: Number, min: 0, max: 24, default: 7 },  // hrs/night
  exercise:      { type: String, enum: ["low", "medium", "high"], default: "medium" },
  smoking:       { type: Boolean, default: false },
  alcohol:       { type: Boolean, default: false },

  // Last computed risk (updated on each checkin)
  riskScore:     { type: Number, default: null },
  riskLevel:     { type: String, enum: ["Low", "Medium", "High"], default: "Low" },

  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
});

module.exports = mongoose.model("Patient", PatientSchema);
