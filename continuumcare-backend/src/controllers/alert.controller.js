const Alert = require("../models/Alert");
const Patient = require("../models/Patient");

/*  GET ALERTS FOR A PATIENT  */
exports.getAlertsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const alerts = await Alert.find({ patientId, resolved: false })
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*  GET ALL ALERTS (resolved + unresolved) FOR A PATIENT  */
exports.getAllAlertsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const alerts = await Alert.find({ patientId })
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*  GET ALERTS FOR A DOCTOR  */
exports.getAlertsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Get patients assigned to this doctor
    const patients = await Patient.find({ doctorId }).select("_id").lean();
    const patientIds = patients.map(p => p._id);

    if (patientIds.length === 0) return res.json([]);

    const alerts = await Alert.find({
      patientId: { $in: patientIds },
      resolved: false,
    })
      .populate("patientId", "name email condition")
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
