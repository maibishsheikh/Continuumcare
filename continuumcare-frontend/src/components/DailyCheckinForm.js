import { useState } from "react";
import api from "../services/api";

/* ─── Clinical validation ranges ────────────────────────────────────────── */
const VITAL_FIELDS = [
  {
    key: "systolic",
    label: "Systolic BP",
    unit: "mmHg",
    min: 60,
    max: 250,
    hint: "Normal: 90–120 mmHg",
    placeholder: "e.g. 120",
  },
  {
    key: "diastolic",
    label: "Diastolic BP",
    unit: "mmHg",
    min: 40,
    max: 150,
    hint: "Normal: 60–80 mmHg",
    placeholder: "e.g. 80",
  },
  {
    key: "heartRate",
    label: "Heart Rate",
    unit: "bpm",
    min: 30,
    max: 220,
    hint: "Normal: 60–100 bpm",
    placeholder: "e.g. 72",
  },
  {
    key: "spo2",
    label: "Oxygen Saturation (SpO₂)",
    unit: "%",
    min: 50,
    max: 100,
    hint: "Normal: ≥ 95%",
    placeholder: "e.g. 98",
  },
];

const SYMPTOMS = [
  { key: "fever",          label: "🌡️ Fever" },
  { key: "dizziness",      label: "💫 Dizziness" },
  { key: "fatigue",        label: "😴 Fatigue" },
  { key: "breathlessness", label: "😮‍💨 Breathlessness" },
  { key: "chestPain",      label: "💔 Chest Pain" },
];

/* ─── Helper: get inline warning label for a value ──────────────────────── */
function vitalWarning(key, val) {
  const v = Number(val);
  if (!val || isNaN(v)) return null;
  if (key === "systolic") {
    if (v >= 180 || v <= 70) return { color: "red",    text: "Critical" };
    if (v >= 140 || v < 90)  return { color: "yellow", text: "Abnormal" };
  }
  if (key === "diastolic") {
    if (v >= 120 || v < 50)  return { color: "red",    text: "Critical" };
    if (v >= 90  || v < 60)  return { color: "yellow", text: "Abnormal" };
  }
  if (key === "heartRate") {
    if (v >= 130 || v < 40)  return { color: "red",    text: "Critical" };
    if (v > 100  || v < 60)  return { color: "yellow", text: "Abnormal" };
  }
  if (key === "spo2") {
    if (v < 90)  return { color: "red",    text: "Critical — Seek help!" };
    if (v < 95)  return { color: "yellow", text: "Low — Monitor closely" };
  }
  return { color: "green", text: "Normal" };
}

const DailyCheckinForm = ({ patientId, onCheckinComplete }) => {
  const [form, setForm] = useState({
    systolic: "",
    diastolic: "",
    heartRate: "",
    spo2: "",
    symptoms: [],
    medicationTaken: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success"|"error", text, risk }

  // ── Validation errors ──────────────────────────────────────────────────────
  const validationErrors = {};
  for (const f of VITAL_FIELDS) {
    const v = Number(form[f.key]);
    if (form[f.key] !== "" && (isNaN(v) || v < f.min || v > f.max)) {
      validationErrors[f.key] = `Must be between ${f.min} and ${f.max} ${f.unit}`;
    }
  }

  const isValid =
    VITAL_FIELDS.every(f => form[f.key] !== "") &&
    form.medicationTaken !== null &&
    Object.keys(validationErrors).length === 0;

  const toggleSymptom = (key) =>
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(key)
        ? prev.symptoms.filter(s => s !== key)
        : [...prev.symptoms, key],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post("/checkins", {
        patientId,
        systolic:        Number(form.systolic),
        diastolic:       Number(form.diastolic),
        heartRate:       Number(form.heartRate),
        spo2:            Number(form.spo2),
        medicationTaken: form.medicationTaken,
        symptoms:        form.symptoms,
      });

      const { riskLevel, riskScore, alertsGenerated } = res.data;

      setMessage({
        type: riskLevel === "High" ? "error" : riskLevel === "Medium" ? "warning" : "success",
        text: `Check-in submitted! Risk: ${riskLevel} (${(riskScore * 100).toFixed(0)}%) · ${alertsGenerated} alert(s) generated.`,
      });

      onCheckinComplete?.();

      setForm({
        systolic: "", diastolic: "", heartRate: "", spo2: "",
        symptoms: [], medicationTaken: null,
      });
    } catch (err) {
      const errs = err.response?.data?.errors;
      setMessage({
        type: "error",
        text: errs ? errs.join(" | ") : (err.response?.data?.error || "Failed to submit check-in."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const warningColors = { red: "text-red-600", yellow: "text-yellow-600", green: "text-green-600" };
  const warningBg     = { red: "bg-red-50 border-red-300", yellow: "bg-yellow-50 border-yellow-300", green: "bg-gray-50 border-gray-300" };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Daily Check-in</h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Vital Signs ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VITAL_FIELDS.map(f => {
            const warn = vitalWarning(f.key, form[f.key]);
            const hasError = validationErrors[f.key];
            return (
              <div key={f.key} className={`border rounded-lg p-4 ${hasError ? "border-red-400 bg-red-50" : warn ? `${warningBg[warn.color]}` : "border-gray-200"}`}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {f.label} <span className="font-normal text-gray-400">({f.unit})</span>
                </label>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">{f.hint}</span>
                  {warn && !hasError && (
                    <span className={`text-xs font-bold ${warningColors[warn.color]}`}>
                      {warn.text}
                    </span>
                  )}
                  {hasError && (
                    <span className="text-xs font-bold text-red-600">{hasError}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Medication ───────────────────────────────────────────────────── */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Medication Status *</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, medicationTaken: true }))}
              className={`flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition ${
                form.medicationTaken === true
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-600 hover:border-green-300"
              }`}
            >
              ✅ Taken
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, medicationTaken: false }))}
              className={`flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition ${
                form.medicationTaken === false
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 text-gray-600 hover:border-red-300"
              }`}
            >
              ❌ Missed
            </button>
          </div>
        </div>

        {/* ── Symptoms ─────────────────────────────────────────────────────── */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Symptoms today <span className="font-normal text-gray-400">(select all that apply)</span></p>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map(s => (
              <button
                type="button"
                key={s.key}
                onClick={() => toggleSymptom(s.key)}
                className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition ${
                  form.symptoms.includes(s.key)
                    ? "border-red-400 bg-red-100 text-red-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── High-risk warning before submit ──────────────────────────────── */}
        {form.symptoms.includes("chestPain") && (
          <div className="bg-red-100 border border-red-400 rounded-lg p-3 flex items-start gap-2">
            <span className="text-red-600 font-bold text-sm">⚠️ URGENT:</span>
            <span className="text-red-700 text-sm font-medium">
              Chest pain reported. If severe, call emergency services immediately before submitting.
            </span>
          </div>
        )}

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={!isValid || submitting}
          className={`w-full py-3 rounded-lg font-semibold text-white transition ${
            isValid && !submitting
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting…" : "Submit Check-in"}
        </button>

        {!isValid && !submitting && (
          <p className="text-center text-xs text-gray-400">
            Fill in all vitals, select medication status, and fix any errors above.
          </p>
        )}

        {/* ── Result message ───────────────────────────────────────────────── */}
        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium text-center ${
            message.type === "success" ? "bg-green-100 text-green-800" :
            message.type === "warning" ? "bg-yellow-100 text-yellow-800" :
                                          "bg-red-100 text-red-800"
          }`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
};

export default DailyCheckinForm;

