const express = require("express");
const router = express.Router();
const {
  createCheckin,
  getCheckinsByPatient,
  getLatestCheckin,
} = require("../controllers/checkin.controller");

// Create check-in
router.post("/", createCheckin);

// Get all check-ins for a patient
router.get("/patient/:patientId", getCheckinsByPatient);

// Get latest check-in for a patient
router.get("/latest/:patientId", getLatestCheckin);

module.exports = router;
