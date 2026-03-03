import { useState, useEffect } from "react";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import api from "./services/api";
import { Activity, ArrowLeft, Plus, X, Stethoscope, Users } from "lucide-react";

const DOCTOR_ID = "doctor_001"; // default doctor ID for MVP

function App() {
  const [view, setView] = useState("patient");

  // ── Patient selection state ──────────────────────────────────────────────
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "", email: "", phone: "", age: "", gender: "Male",
    condition: "", doctorId: DOCTOR_ID,
  });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (view === "patient" && !selectedPatientId) fetchPatients();
  }, [view, selectedPatientId]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await api.get("/patients");
      setPatients(res.data || []);
    } catch {
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await api.post("/patients", {
        ...newPatient,
        age: Number(newPatient.age),
      });
      const created = res.data.patient;
      setPatients(prev => [created, ...prev]);
      setSelectedPatientId(created._id);
      setCreateMode(false);
    } catch (err) {
      setCreateError(err.response?.data?.error || "Failed to create patient.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">ContinuumCare</span>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => { setView("patient"); setSelectedPatientId(null); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
              view === "patient"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users size={14} /> Patients
          </button>
          <button
            onClick={() => setView("doctor")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
              view === "doctor"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Stethoscope size={14} /> Doctor View
          </button>
        </div>
      </nav>

      {/* ── PATIENT VIEW ─────────────────────────────────────────────────── */}
      {view === "patient" && !selectedPatientId && (
        <div className="max-w-2xl mx-auto mt-8 px-4 pb-10">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
              <p className="text-sm text-gray-500 mt-0.5">Select a patient to view their health dashboard</p>
            </div>
            <button
              onClick={() => setCreateMode(!createMode)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
                createMode
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {createMode ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Patient</>}
            </button>
          </div>

          {/* Create Patient Form */}
          {createMode && (
            <form onSubmit={handleCreatePatient} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5 space-y-3">
              <h3 className="font-bold text-gray-800 text-base mb-3">Register New Patient</h3>
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {createError}
                </div>
              )}
              {[
                { label: "Full Name *",               key: "name",      type: "text",  required: true  },
                { label: "Email *",                   key: "email",     type: "email", required: true  },
                { label: "Phone",                     key: "phone",     type: "tel",   required: false },
                { label: "Age",                       key: "age",       type: "number",required: false },
                { label: "Condition (e.g. Hypertension)", key: "condition", type: "text", required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={newPatient[f.key]}
                    onChange={e => setNewPatient(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                <select
                  value={newPatient.gender}
                  onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
              >
                {creating ? "Creating patient…" : "Create Patient"}
              </button>
            </form>
          )}

          {/* Patient List */}
          {loadingPatients ? (
            <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
              <Activity size={18} className="animate-pulse text-blue-400" />
              <span className="text-sm">Loading patients…</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
              <Users size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-600">No patients yet</p>
              <p className="text-sm mt-1">Click <strong>+ New Patient</strong> to get started.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {patients.map(p => {
                const riskColors = {
                  High:   "bg-red-100 text-red-700",
                  Medium: "bg-amber-100 text-amber-700",
                  Low:    "bg-green-100 text-green-700",
                };
                const dotColors = {
                  High: "bg-red-500", Medium: "bg-amber-500", Low: "bg-green-500",
                };
                return (
                  <button
                    key={p._id}
                    onClick={() => setSelectedPatientId(p._id)}
                    className="w-full bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-400 hover:shadow-md p-4 text-left transition"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base shrink-0">
                          {(p.name || "P")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {p.condition || "No condition on file"} · {p.email}
                            {p.age ? ` · ${p.age} yrs` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className={`w-2 h-2 rounded-full ${dotColors[p.riskLevel] || dotColors.Low}`} />
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${riskColors[p.riskLevel] || riskColors.Low}`}>
                          {p.riskLevel || "Low"} Risk
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === "patient" && selectedPatientId && (
        <div>
          <button
            onClick={() => setSelectedPatientId(null)}
            className="flex items-center gap-1.5 m-4 text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            <ArrowLeft size={15} /> Back to patients
          </button>
          <PatientDashboard patientId={selectedPatientId} />
        </div>
      )}

      {/* ── DOCTOR VIEW ──────────────────────────────────────────────────── */}
      {view === "doctor" && (
        <DoctorDashboard doctorId={DOCTOR_ID} />
      )}
    </div>
  );
}

export default App;

