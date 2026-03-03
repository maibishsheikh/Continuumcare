import { useEffect, useState } from "react";
import api from "../services/api";
import DailyCheckinForm from "../components/DailyCheckinForm";
import {
  Activity,
  Bell,
  User,
  Heart,
  Droplet,
  Clock,
  Shield,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";

const severityPalette = {
  critical: { border: "border-purple-400", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-800", icon: "text-purple-600", label: "CRITICAL" },
  high:     { border: "border-red-400",    bg: "bg-red-50",    badge: "bg-red-100 text-red-800",       icon: "text-red-600",    label: "HIGH"     },
  medium:   { border: "border-amber-400",  bg: "bg-amber-50",  badge: "bg-amber-100 text-amber-800",   icon: "text-amber-600",  label: "MEDIUM"   },
  low:      { border: "border-green-400",  bg: "bg-green-50",  badge: "bg-green-100 text-green-800",   icon: "text-green-600",  label: "LOW"      },
};

const symptomLabel = {
  fever: "Fever", dizziness: "Dizziness", fatigue: "Fatigue",
  breathlessness: "Breathlessness", chestPain: "Chest Pain",
};

const PatientDashboard = ({ patientId }) => {

  const [patient, setPatient]           = useState(null);
  const [alerts, setAlerts]             = useState([]);
  const [latestCheckin, setLatestCheckin] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [expanded, setExpanded]         = useState({});

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  /* ---------------- REFRESH AFTER CHECKIN ---------------- */
  const refreshAfterCheckin = async () => {
    try {
      const [alertsRes, checkinRes, patientRes] = await Promise.allSettled([
        api.get(`/alerts/patient/${patientId}`),
        api.get(`/checkins/latest/${patientId}`),
        api.get(`/patients/${patientId}`),
      ]);
      if (alertsRes.status === "fulfilled")  setAlerts(alertsRes.value.data || []);
      if (checkinRes.status === "fulfilled") setLatestCheckin(checkinRes.value.data);
      if (patientRes.status === "fulfilled") setPatient(patientRes.value.data);
    } catch (err) {
      console.error("Failed to refresh data", err);
    }
  };

  const fetchAlerts = refreshAfterCheckin;

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, alertsRes, checkinRes] =
          await Promise.allSettled([
            api.get(`/patients/${patientId}`),
            api.get(`/alerts/patient/${patientId}`),
            api.get(`/checkins/latest/${patientId}`)
          ]);

        if (patientRes.status === "fulfilled") {
          setPatient(patientRes.value.data);
        } else {
          throw new Error("Patient not found");
        }
        if (alertsRes.status === "fulfilled")  setAlerts(alertsRes.value.data || []);
        if (checkinRes.status === "fulfilled") setLatestCheckin(checkinRes.value.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load patient dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  const formatTime = (ts) => {
    if (!ts) return "—";
    if (ts._seconds) return new Date(ts._seconds * 1000).toLocaleString();
    return new Date(ts).toLocaleString();
  };

  const riskColors = {
    high:   { bg: "bg-red-100",    text: "text-red-700"    },
    medium: { bg: "bg-amber-100",  text: "text-amber-700"  },
    low:    { bg: "bg-green-100",  text: "text-green-700"  },
  };
  const riskColor = (level = "low") => {
    const c = riskColors[level.toLowerCase()] || riskColors.low;
    return `${c.bg} ${c.text}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Activity size={32} className="animate-pulse text-blue-500" />
          <p className="text-sm font-medium">Loading health dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return <div className="p-8 text-red-600">{error || "Patient not found"}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Patient header banner ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
              {(patient.name || "P")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">{patient.name}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {patient.condition || "No condition on file"} · {patient.age ? `${patient.age} yrs` : ""} {patient.gender || ""}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${riskColor(patient.riskLevel)}`}>
            {patient.riskLevel || "Low"} Risk
            {patient.riskScore != null && ` · ${(patient.riskScore * 100).toFixed(0)}%`}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* ── Info cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <InfoCard icon={<User size={18} className="text-blue-500" />}   title="Patient"       value={patient.name} />
          <InfoCard icon={<Shield size={18} className="text-indigo-500" />} title="Condition"   value={patient.condition || "—"} />
          <InfoCard icon={<Bell size={18} className="text-red-500" />}    title="Active Alerts" value={alerts.length} highlight={alerts.length > 0} />
        </div>

        {/* ── Latest vitals ──────────────────────────────────────────────── */}
        {latestCheckin?.vitals && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" /> Latest Vitals
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <VitalCard
                label="Blood Pressure"
                value={`${latestCheckin.vitals.systolic}/${latestCheckin.vitals.diastolic}`}
                unit="mmHg"
                icon={<Activity size={16} className="text-blue-500" />}
                alert={latestCheckin.vitals.systolic >= 140}
              />
              <VitalCard
                label="Heart Rate"
                value={latestCheckin.vitals.heartRate}
                unit="bpm"
                icon={<Heart size={16} className="text-red-500" />}
                alert={latestCheckin.vitals.heartRate > 100 || latestCheckin.vitals.heartRate < 55}
              />
              <VitalCard
                label="SpO₂"
                value={latestCheckin.vitals.spo2}
                unit="%"
                icon={<Droplet size={16} className="text-cyan-500" />}
                alert={latestCheckin.vitals.spo2 < 95}
              />
              <VitalCard
                label="Recorded"
                value={formatTime(latestCheckin.createdAt)}
                unit=""
                icon={<Clock size={16} className="text-gray-400" />}
              />
            </div>
          </div>
        )}

        {/* ── Check-in form ───────────────────────────────────────────────── */}
        <DailyCheckinForm patientId={patientId} onCheckinComplete={fetchAlerts} />

        {/* ── Alerts ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={18} className="text-red-500" />
            Health Alerts
            {alerts.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {alerts.length}
              </span>
            )}
          </h2>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <CheckCircle size={40} className="mb-2 text-green-400" />
              <p className="font-medium text-gray-600">No active alerts</p>
              <p className="text-sm">All readings look good — keep it up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const p = severityPalette[alert.severity] || severityPalette.medium;
                const rules = Array.isArray(alert.triggeredRules) ? alert.triggeredRules : [];
                const isOpen = !!expanded[alert._id];
                return (
                  <div key={alert._id} className={`rounded-xl border-l-4 overflow-hidden ${p.border} ${p.bg}`}>
                    {/* Alert summary row */}
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-2 mb-1">
                        <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${p.icon}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.badge}`}>{p.label}</span>
                            <p className="text-sm font-semibold text-gray-800 leading-snug">{alert.message}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.createdAt).toLocaleString()}
                            {alert.riskScore != null && ` · Score: ${(alert.riskScore * 100).toFixed(0)}%`}
                          </p>
                        </div>
                      </div>

                      {/* Triggered rules toggle */}
                      {rules.length > 0 && (
                        <button
                          onClick={() => toggleExpand(alert._id)}
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
                        >
                          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {rules.length} rule{rules.length !== 1 ? "s" : ""} triggered
                        </button>
                      )}
                    </div>

                    {/* Expanded rules */}
                    {isOpen && rules.length > 0 && (
                      <div className="border-t border-white/60 bg-white/50">
                        {rules.map((r, i) => {
                          const rp = severityPalette[r.severity] || severityPalette.medium;
                          return (
                            <div key={i} className="flex items-start gap-2 px-4 py-2 border-b border-white/60 last:border-0">
                              <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${rp.badge}`}>
                                {rp.label}
                              </span>
                              <p className="text-xs text-gray-700 leading-snug">{r.message}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, title, value, highlight }) => (
  <div className={`bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3 ${highlight ? "border-red-200" : "border-gray-100"}`}>
    <div className={`p-2 rounded-xl ${highlight ? "bg-red-50" : "bg-gray-50"}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      <p className="font-bold text-gray-900 text-sm leading-tight">{value}</p>
    </div>
  </div>
);

const VitalCard = ({ label, value, unit, icon, alert: isAlert }) => (
  <div className={`p-3 rounded-xl border ${isAlert ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
    <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${isAlert ? "text-red-500" : "text-gray-400"}`}>
      {icon} {label}
    </div>
    <div className={`font-bold text-sm ${isAlert ? "text-red-700" : "text-gray-800"}`}>
      {value} <span className="font-normal text-xs text-gray-500">{unit}</span>
    </div>
  </div>
);

export default PatientDashboard;
