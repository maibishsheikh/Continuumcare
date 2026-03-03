const express = require("express");
const cors = require("cors");

console.log("App.js loaded");

// Import routes
const patientRoutes = require("./routes/patient.routes");
const checkinRoutes = require("./routes/checkin.routes");
const alertRoutes = require("./routes/alert.routes");

const app = express();

/* ----------- MIDDLEWARE (ORDER MATTERS) ----------- */
app.use(cors());
app.use(express.json()); // THIS FIXES req.body

/* ----------- ROUTES ----------- */
app.use("/api/patients", patientRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/alerts", alertRoutes);

/* ----------- HEALTH CHECK ----------- */
app.get("/", (req, res) => {
  res.send("ContinuumCare Backend Running");
});

module.exports = app;
