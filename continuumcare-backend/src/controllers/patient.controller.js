const Patient = require("../models/Patient");

/*  CREATE PATIENT  */
exports.createPatient = async (req, res) => {
  try {
    const patient = await Patient.create({
      ...req.body,
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "Patient created successfully",
      patientId: patient._id,
      patient,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "A patient with this email already exists." });
    }
    res.status(500).json({ error: error.message });
  }
};

/*  GET ALL PATIENTS  */
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*  GET PATIENT BY ID  */
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
