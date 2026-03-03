import { useEffect, useState } from "react";
import api from "../services/api";
import {
  AlertTriangle,
  CheckCircle,
  Activity,
  Heart,
  Droplet,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ClipboardList,
  Stethoscope,
} from "lucide-react";

const severityConfig = {
  critical: { border: "#7c3aed", bg: "bg-purple-50", headerBg: "bg-purple-700", badge: "bg-purple-100 text-purple-800", ruleBadge: "bg-purple-100 text-purple-700 border-purple-200", label: "CRITICAL", dot: "bg-purple-500" },
  high:     { border: "#dc2626", bg: "bg-red-50",    headerBg: "bg-red-600",    badge: "bg-red-100 text-red-800",    ruleBadge: "bg-red-100 text-red-700 border-red-200",    label: "HIGH",     dot: "bg-red-500"    },
  medium:   { border: "#d97706", bg: "bg-amber-50",  headerBg: "bg-amber-500",  badge: "bg-amber-100 text-amber-800", ruleBadge: "bg-amber-100 text-amber-700 border-amber-200", label: "MEDIUM", dot: "bg-amber-500"  },
  low:      { border: "#16a34a", bg: "bg-green-50",  headerBg: "bg-green-600",  badge: "bg-green-100 text-green-800", ruleBadge: "bg-green-100 text-green-700 border-green-200", label: "LOW",   dot: "bg-green-500"  },
};

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };

const DoctorDashboard = ({ doctorId }) => {
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [resolving, setResolving] = useState(null);
  const [filter, setFilter]       = useState("all");
  const [expanded, setExpanded]   = useState({});  // alertId → boolean

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/alerts/doctor/${doctorId}`);
      setAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    setResolving(alertId);
    try {
      await api.post(`/alerts/${alertId}/resolve`, { doctorId });
      setAlerts(prev => prev.filter(a => a._id !== alertId));
    } catch (err) {
      console.error(err);
      alert("Failed to resolve. Please try again.");
    } finally {
      setResolving(null);
    }
  };

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => { fetchAlerts(); }, [doctorId]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getPatientName      = (p) => (typeof p === "object" ? p?.name || p?.email : String(p ?? "Unknown"));
  const getPatientCondition = (p) => (typeof p === "object" ? p?.condition || "—" : "—");
  const formatTime          = (ts) => ts ? new Date(ts).toLocaleString() : "—";
  const isRecent            = (ts) => ts && (Date.now() - new Date(ts).getTime()) < 60 * 60 * 1000;

  const ruleLabel = (code) =>
    (code || "UNKNOWN").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  const symptomLabel = {
    fever: "Fever", dizziness: "Dizziness", fatigue: "Fatigue",
    breathlessness: "Breathlessness", chestPain: "Chest Pain",
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = { all: alerts.length, critical: 0, high: 0, medium: 0, low: 0 };
  alerts.forEach(a => { if (stats[a.severity] !== undefined) stats[a.severity]++; });

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = filter === "all"
    ? [...alerts].sort((a, b) => (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0))
    : alerts.filter(a => a.severity === filter);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading patient alerts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Stethoscope size={22} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-none">Clinical Alerts</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Doctor <span className="font-mono font-semibold text-gray-700">{doctorId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: "all",      label: "Total",    color: "text-gray-800",   bg: "bg-white"          },
            { key: "critical", label: "Critical",  color: "text-purple-700", bg: "bg-purple-50"      },
            { key: "high",     label: "High",      color: "text-red-700",    bg: "bg-red-50"         },
            { key: "medium",   label: "Medium",    color: "text-amber-700",  bg: "bg-amber-50"       },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`${s.bg} rounded-xl p-4 text-left border-2 transition ${
                filter === s.key ? "border-blue-500 shadow-md" : "border-transparent shadow-sm hover:shadow-md"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{stats[s.key]}</p>
            </button>
          ))}
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {["all", "critical", "high", "medium", "low"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                  filter === f
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && stats[f] > 0 && (
                  <span className="ml-1 opacity-75">({stats[f]})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
            <CheckCircle size={52} className="mx-auto mb-4 text-green-400" />
            <p className="text-xl font-bold text-gray-700">
              {filter === "all" ? "No active alerts" : `No ${filter} alerts`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {filter === "all" ? "Your patients are looking healthy!" : "Try selecting a different filter."}
            </p>
          </div>
        )}

        {/* ── Alert cards ──────────────────────────────────────────────────── */}
        {filtered.map(alert => {
          const cfg      = severityConfig[alert.severity] || severityConfig.medium;
          const vitals   = alert.vitals || {};
          const symptoms = Array.isArray(alert.symptoms) ? alert.symptoms : [];
          const rules    = Array.isArray(alert.triggeredRules) ? alert.triggeredRules : [];
          const isOpen   = !!expanded[alert._id];
          const recent   = isRecent(alert.createdAt);

          return (
            <div
              key={alert._id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}
              style={{ borderLeft: `5px solid ${cfg.border}` }}
            >
              {/* Card header strip */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 p-2 rounded-lg ${cfg.bg} shrink-0`}>
                    <User size={16} style={{ color: cfg.border }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-gray-900 truncate">
                        {getPatientName(alert.patientId)}
                      </h2>
                      {recent && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full animate-pulse">
                          NEW
                        </span>
                      )}
                      <span className="text-sm text-gray-400">·</span>
                      <span className="text-sm text-gray-500 italic">
                        {getPatientCondition(alert.patientId)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatTime(alert.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alert.riskScore != null && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg font-mono">
                      {(alert.riskScore * 100).toFixed(0)}% risk
                    </span>
                  )}
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold border"
                    style={{ backgroundColor: `${cfg.border}18`, color: cfg.border, borderColor: `${cfg.border}40` }}
                  >
                    {cfg.label}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 py-4 space-y-4">
                {/* Summary message */}
                <div className="flex items-start gap-2">
                  <ShieldAlert size={16} style={{ color: cfg.border }} className="mt-0.5 shrink-0" />
                  <p className="text-gray-700 font-medium text-sm leading-relaxed">{alert.message}</p>
                </div>

                {/* Vitals grid */}
                {(vitals.systolic || vitals.heartRate || vitals.spo2) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <VitalBadge
                      icon={<Activity size={13} />} label="Blood Pressure"
                      value={vitals.systolic && vitals.diastolic ? `${vitals.systolic}/${vitals.diastolic}` : "—"}
                      unit="mmHg" alert={vitals.systolic >= 140 || vitals.diastolic >= 90}
                    />
                    <VitalBadge
                      icon={<Heart size={13} />} label="Heart Rate"
                      value={vitals.heartRate ?? "—"} unit="bpm"
                      alert={vitals.heartRate > 100 || vitals.heartRate < 55}
                    />
                    <VitalBadge
                      icon={<Droplet size={13} />} label="SpO₂"
                      value={vitals.spo2 ?? "—"} unit="%"
                      alert={vitals.spo2 < 95}
                    />
                    <VitalBadge
                      icon={<ClipboardList size={13} />} label="Risk Level"
                      value={alert.riskLevel ?? "—"} unit=""
                      alert={alert.riskLevel === "High"}
                    />
                  </div>
                )}

                {/* Symptoms */}
                {symptoms.length > 0 && (
                  <div>
                    <p className="text-xs uppercase font-semibold text-gray-400 tracking-wide mb-1.5">
                      Reported Symptoms
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {symptoms.map(s => (
                        <span key={s} className="px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-xs rounded-full font-medium">
                          {symptomLabel[s] || s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Triggered rules (collapsible) */}
                {rules.length > 0 && (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleExpand(alert._id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle size={14} style={{ color: cfg.border }} />
                        {rules.length} Triggered Rule{rules.length !== 1 ? "s" : ""}
                      </span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-gray-100">
                        {rules.map((r, i) => {
                          const rc = severityConfig[r.severity] || severityConfig.medium;
                          return (
                            <div key={i} className="flex items-start gap-3 px-4 py-3 bg-white">
                              <span
                                className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${rc.ruleBadge}`}
                              >
                                {rc.label}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-mono text-gray-400 mb-0.5">{r.ruleCode}</p>
                                <p className="text-sm text-gray-700 leading-snug">{r.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400 font-mono">ID: {alert._id?.toString().slice(-8)}</span>
                <button
                  onClick={() => resolveAlert(alert._id)}
                  disabled={resolving === alert._id}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >
                  <CheckCircle size={15} />
                  {resolving === alert._id ? "Resolving…" : "Mark Resolved"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const VitalBadge = ({ icon, label, value, unit, alert: isAlert }) => (
  <div className={`p-3 rounded-xl border ${isAlert ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
    <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide mb-1 ${isAlert ? "text-red-500" : "text-gray-400"}`}>
      {icon} {label}
    </div>
    <p className={`font-bold text-sm leading-none ${isAlert ? "text-red-700" : "text-gray-800"}`}>
      {value} <span className="font-normal text-xs">{unit}</span>
    </p>
  </div>
);

export default DoctorDashboard;

