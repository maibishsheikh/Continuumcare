const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const {
  getAlertsByPatient,
  getAllAlertsByPatient,
  getAlertsByDoctor,
} = require("../controllers/alert.controller");

console.log("Alert routes loaded");

// Active (unresolved) alerts for patient
router.get("/patient/:patientId", getAlertsByPatient);

// All alerts (resolved + unresolved) for patient
router.get("/patient/:patientId/all", getAllAlertsByPatient);

// Active alerts for doctor
router.get("/doctor/:doctorId", getAlertsByDoctor);

// Resolve alert (doctor action)
router.post("/:alertId/resolve", async (req, res) => {
  try {
    const { alertId } = req.params;
    const { doctorId } = req.body;

    if (!doctorId) return res.status(400).json({ message: "doctorId required" });

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { resolved: true, resolvedAt: new Date(), resolvedBy: doctorId },
      { new: true }
    );

    if (!alert) return res.status(404).json({ message: "Alert not found" });

    res.json({ message: "Alert resolved successfully", alert });
  } catch (err) {
    console.error("Error resolving alert:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
