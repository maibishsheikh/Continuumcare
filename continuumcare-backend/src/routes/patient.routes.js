const express = require("express");
const router = express.Router();
const {
  createPatient,
  getAllPatients,
  getPatientById,
} = require("../controllers/patient.controller");

// List all patients
router.get("/", getAllPatients);

// Create patient
router.post("/", createPatient);

// Get patient by ID
router.get("/:patientId", getPatientById);

module.exports = router;
