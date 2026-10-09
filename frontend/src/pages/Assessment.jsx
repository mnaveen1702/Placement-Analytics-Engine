import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserRound, GraduationCap, Cpu, FolderGit2,
  ChevronRight, ChevronLeft, Loader2, Sparkles,
  Home, ClipboardList, TrendingUp, BookOpen,
  Coins, FileCheck2, Compass, Quote, Lightbulb,
  Bot, Check, ChevronDown, X, Rocket, Briefcase,
  MessageSquare, IndianRupee, Target, BarChart3,
  Zap, Star, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { useAssessment } from "../hooks/useAssessment";
import ResumeUploader from "../components/ResumeUploader";
import CareerAdvisorModal from "../components/CareerAdvisorModal";
import {
  cloudOptions, databaseOptions, languageOptions, presets, toolOptions,
} from "../utils/formDefaults";

const STEPS = [
  { id: 0, title: "Candidate Profile",    icon: UserRound },
  { id: 1, title: "Academic Performance", icon: GraduationCap },
  { id: 2, title: "Technical Proficiency",icon: Cpu },
  { id: 3, title: "Practical Experience", icon: FolderGit2 },
];

/* ─────────────────── helpers ─────────────────── */

/** Returns consistent card class string based on darkMode. */
function cardCls(dark, extra = "") {
  return `rounded-2xl border transition-all duration-300 ${
    dark
      ? "border-slate-800/80 bg-[#0d1424] shadow-lg"
      : "border-slate-200 bg-white shadow-sm shadow-slate-200/50"
  } ${extra}`;
}

/** Heading text class */
function h(dark) { return dark ? "text-white" : "text-slate-900"; }
/** Body text */
function body(dark) { return dark ? "text-slate-300" : "text-slate-700"; }
/** Subtext */
function sub(dark) { return dark ? "text-slate-400" : "text-slate-600"; }
/** Muted */
function muted(dark) { return dark ? "text-slate-500" : "text-slate-400"; }
/** Divider */
function divider(dark) { return dark ? "border-slate-800" : "border-slate-200"; }

/* ─────────────────── SliderField ─────────────────── */
function SliderField({ label, min, max, step = 1, value, onChange, suffix = "", dark }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={`${cardCls(dark)} p-5 hover:-translate-y-0.5 hover:border-cyan-500/40`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <label className={`mb-0 text-sm font-bold uppercase tracking-wide ${dark ? "text-slate-300" : "text-slate-700"}`}>
          {label}
        </label>
        <input
          type="number"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`!w-24 rounded-xl px-2 py-1.5 text-right text-base font-extrabold font-mono border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
            dark
              ? "bg-[#0a0f1d] border-slate-700 text-cyan-300 focus:border-cyan-400"
              : "bg-slate-50 border-slate-300 text-cyan-700 focus:border-cyan-600"
          }`}
        />
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(e.target.value)} className="w-full" />
      <div className={`flex justify-between text-xs font-semibold mt-2 ${muted(dark)}`}>
        <span>{min}{suffix}</span>
        <span className="metric-gradient text-sm font-extrabold">{value}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
      {/* mini fill bar */}
      <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${dark ? "bg-slate-800" : "bg-slate-200"}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────── ChipSelect ─────────────────── */
function ChipSelect({ options, selected, onToggle, dark }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button type="button" key={opt} onClick={() => onToggle(opt)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${
              active
                ? dark
                  ? "border-cyan-400 bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 text-white shadow-[0_0_14px_rgba(6,182,212,0.3)]"
                  : "border-cyan-600 bg-cyan-100 text-cyan-900 shadow-sm"
                : dark
                ? "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800"
                : "border-slate-300 bg-slate-50 text-slate-700 hover:border-cyan-500 hover:bg-cyan-50"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────── Salary Estimator Widget ─────────────────── */
function SalaryWidget({ form, dark }) {
  const cgpa   = Number(form.cgpa) || 0;
  const coding = Number(form.coding_score) || 0;
  const dsa    = Number(form.dsa_score) || 0;
  const intern = Number(form.number_of_internships) || 0;
  const proj   = Number(form.number_of_projects) || 0;
  const tech   = Number(form.technical_score) || 0;

  // simple heuristic estimator
  const base = Math.round(
    3 + (cgpa / 10) * 4 + (coding / 100) * 4 + (dsa / 100) * 3 +
    intern * 1.5 + proj * 0.4 + (tech / 100) * 2
  );
  const bonus = Math.round(base * 0.15 + intern * 0.5);
  const maxPkg = base + bonus;
  const minPkg = Math.max(3, base - 2);

  const barPct = Math.min(100, (maxPkg / 30) * 100);

  return (
    <div className={`${cardCls(dark, "p-5")} mt-5`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${dark ? "bg-amber-500/15" : "bg-amber-50 border border-amber-200"}`}>
          <IndianRupee className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <h4 className={`text-sm font-extrabold ${h(dark)}`}>Live Salary & CTC Estimator</h4>
          <p className={`text-xs ${muted(dark)}`}>Updates dynamically with your profile inputs</p>
        </div>
      </div>

      {/* CTC range display */}
      <div className="flex items-end gap-3 mb-3">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${muted(dark)}`}>Estimated Range</p>
          <p className={`text-3xl font-extrabold metric-gradient`}>
            ₹{minPkg}–{maxPkg}
            <span className={`ml-1 text-lg font-bold ${sub(dark)}`}>LPA</span>
          </p>
        </div>
        <div className="flex gap-4 ml-auto text-right">
          <div>
            <p className={`text-xs font-semibold ${muted(dark)}`}>Base</p>
            <p className={`text-base font-extrabold text-emerald-400`}>₹{base}L</p>
          </div>
          <div>
            <p className={`text-xs font-semibold ${muted(dark)}`}>Bonus</p>
            <p className={`text-base font-extrabold text-amber-400`}>+₹{bonus}L</p>
          </div>
        </div>
      </div>

      {/* Visual fill bar */}
      <div className={`h-3 rounded-full overflow-hidden ${dark ? "bg-slate-800" : "bg-slate-200"}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className={`flex justify-between text-xs font-semibold mt-1.5 ${muted(dark)}`}>
        <span>₹3L (Entry)</span>
        <span>₹30L+ (Top)</span>
      </div>
      <p className={`text-xs mt-3 ${muted(dark)}`}>
        * Heuristic estimate — run the full prediction for precise ML-calibrated values.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN ASSESSMENT PAGE
   ═══════════════════════════════════════════════════ */
export default function Assessment() {
  const [step, setStep] = useState(0);
  const [activeNav, setActiveNav] = useState("assessment");
  const [activePreset, setActivePreset] = useState(null);
  const [expandedTip, setExpandedTip] = useState(0);
  const [infoModal, setInfoModal] = useState(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  const {
    form, setForm, updateField, toggleListValue,
    runAnalysis, loading, error, prediction, setPage, darkMode,
  } = useAssessment();

  const dark = darkMode;

  /* ── Validation ── */
  const fieldErrors = useMemo(() => {
    const e = {};
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address or leave blank.";
    if (Number(form.cgpa) < 0 || Number(form.cgpa) > 10)
      e.cgpa = "CGPA must be between 0 and 10.";
    if (Number(form.backlogs) < 0)
      e.backlogs = "Backlogs cannot be negative.";
    return e;
  }, [form]);

  const canSubmit = !Object.keys(fieldErrors).length;

  /* ── Resume parser — prefills ALL editable fields ── */
  const handleParsedMetrics = (parsed) => {
    setForm((prev) => {
      const next = { ...prev };
      if (parsed.extracted_name && !prev.name)       next.name = parsed.extracted_name;
      if (parsed.extracted_email && !prev.email)     next.email = parsed.extracted_email;
      if (parsed.extracted_department)               next.department = parsed.extracted_department;
      if (parsed.cgpa !== undefined)                 next.cgpa = parsed.cgpa;
      if (parsed.projects_count !== undefined)       next.number_of_projects = parsed.projects_count;
      if (parsed.internships_count !== undefined)    next.number_of_internships = parsed.internships_count;
      if (parsed.certifications_count !== undefined) next.number_of_certifications = parsed.certifications_count;
      if (parsed.leetcode_problems !== undefined)    next.leetcode_problems = parsed.leetcode_problems;
      if (parsed.coding_score_est !== undefined)     next.coding_score = parsed.coding_score_est;
      if (parsed.detected_languages?.length)
        next.programming_languages = [...new Set([...(prev.programming_languages||[]), ...parsed.detected_languages])];
      if (parsed.detected_cloud?.length)
        next.cloud_skills = [...new Set([...(prev.cloud_skills||[]), ...parsed.detected_cloud])];
      if (parsed.detected_databases?.length)
        next.database_skills = [...new Set([...(prev.database_skills||[]), ...parsed.detected_databases])];
      if (parsed.detected_tools?.length)
        next.tools = [...new Set([...(prev.tools||[]), ...parsed.detected_tools])];
      return next;
    });
  };

  /* ── Preset ── */
  const applyPreset = (key) => { setActivePreset(key); setForm(presets[key]); setStep(0); };

  /* ── Submit ── */
  const submit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) { setStep((s) => s + 1); return; }
    if (!canSubmit) return;
    try { await runAnalysis(); } catch { /* error via context */ }
  };

  /* ── Sidebar nav ── */
  const navClick = (id) => {
    setActiveNav(id);
    if (id === "home" || id === "assessment") { setStep(0); return; }
    if (id === "prediction") {
      if (prediction) { setPage("dashboard"); return; }
      setInfoModal({ title: "Prediction Analytics", body: "Complete the 4-step Assessment Wizard to generate live ML predictions.", cta: "Got it", onCta: () => setInfoModal(null) });
      return;
    }
    if (id === "profile") {
      setInfoModal({ title: "Candidate Profile", body: `Name: ${form.name || "—"} | Dept: ${form.department} | CGPA: ${form.cgpa} | Backlogs: ${form.backlogs} | Target: ${form.target_career || "—"}`, cta: "Close", onCta: () => setInfoModal(null) });
      return;
    }
    if (id === "resources") {
      setInfoModal({ title: "Placement Resources", body: "Access: Blind 75 LeetCode patterns, STAR interview matrix, and ATS resume templates.", cta: "Acknowledge", onCta: () => setInfoModal(null) });
    }
  };

  /* ═══ RENDER ═══ */
  return (
    <div className="w-full min-h-screen px-3 sm:px-5 py-5">
      <div className="grid grid-cols-12 gap-5 w-full items-start">

        {/* ╔══════════════════════════════╗
            ║  LEFT SIDEBAR  (col-span-2)  ║
            ╚══════════════════════════════╝ */}
        <aside className="col-span-12 lg:col-span-3 xl:col-span-2 space-y-4">

          {/* Navigation panel */}
          <div className={cardCls(dark, "p-3 space-y-1")}>
            <p className={`px-3 py-2 text-xs font-extrabold uppercase tracking-widest ${muted(dark)}`}>Workspace</p>

            {[
              { id: "home",       label: "Home",       icon: Home },
              { id: "assessment", label: "Assessment",  icon: ClipboardList },
              { id: "prediction", label: "Prediction",  icon: TrendingUp },
              { id: "profile",    label: "My Profile",  icon: UserRound },
              { id: "resources",  label: "Resources",   icon: BookOpen },
            ].map(({ id, label, icon: Icon }) => {
              const active = activeNav === id;
              return (
                <button key={id} type="button" onClick={() => navClick(id)}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                    active
                      ? dark
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border-l-[3px] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : "bg-cyan-50 text-cyan-800 border-l-[3px] border-cyan-600 shadow-sm"
                      : dark
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${active ? "text-cyan-400" : dark ? "text-slate-500" : "text-slate-500"}`} />
                    {label}
                  </span>
                  {active && <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Promo / Guidance CTA Card */}
          <div className={`rounded-2xl border p-5 relative overflow-hidden transition-all duration-300 ${
            dark
              ? "border-blue-500/30 bg-gradient-to-b from-[#11192d] via-[#0d1424] to-[#0a0f1d] shadow-xl"
              : "border-indigo-200 bg-gradient-to-b from-indigo-50 via-white to-slate-50 shadow-sm shadow-indigo-100"
          }`}>
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] ${
                dark ? "bg-gradient-to-br from-blue-600 to-indigo-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"
              }`}>
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h4 className={`text-base font-extrabold ${h(dark)}`}>Your goals Our guidance</h4>
                <p className={`mt-1.5 text-sm leading-relaxed ${sub(dark)}`}>
                  Build your profile, explore your future with calibrated ML placement algorithms.
                </p>
              </div>
              <button type="button" onClick={() => setAdvisorOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-4 py-3 text-sm font-extrabold text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_28px_rgba(59,130,246,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4" />
                Explore Guidance
              </button>
              <p className={`text-xs text-center ${muted(dark)}`}>Powered by Gemini LLM</p>
            </div>
          </div>

          {/* Mini stats if prediction exists */}
          {prediction && (
            <div className={cardCls(dark, "p-4 space-y-2.5")}>
              <p className={`text-xs font-extrabold uppercase tracking-widest ${muted(dark)}`}>Last Result</p>
              {[
                { label: "Placement", value: `${Math.round((prediction.placement_probability || 0) * 100)}%`, color: "emerald" },
                { label: "Package",   value: prediction.predicted_package_lpa ? `₹${prediction.predicted_package_lpa}L` : "—", color: "amber" },
                { label: "ATS Score", value: `${prediction.ats_score || 0}%`, color: "cyan" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`flex items-center justify-between rounded-xl px-3 py-2 ${dark ? "bg-slate-900/60" : "bg-slate-50 border border-slate-100"}`}>
                  <span className={`text-sm font-semibold ${sub(dark)}`}>{label}</span>
                  <span className={`text-sm font-extrabold ${
                    color === "emerald" ? "text-emerald-400" : color === "amber" ? "text-amber-400" : "text-cyan-400"
                  }`}>{value}</span>
                </div>
              ))}
              <button type="button" onClick={() => setPage("dashboard")}
                className="btn-glowing w-full py-2.5 text-xs mt-1">
                View Full Dashboard <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </aside>

        {/* ╔══════════════════════════════════════╗
            ║  CENTER MAIN PANEL  (col-span-7)     ║
            ╚══════════════════════════════════════╝ */}
        <section className="col-span-12 lg:col-span-9 xl:col-span-7 space-y-5">

          {/* Header Banner */}
          <div className={cardCls(dark, "p-6")}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="space-y-2.5">
                <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest ${
                  dark
                    ? "border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "border border-cyan-300 bg-cyan-50 text-cyan-700"
                }`}>
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                  PLACEMENT AI EVALUATION SYSTEM
                </div>
                <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${h(dark)}`}>
                  Student <span className="heading-gradient">Assessment Wizard</span>
                </h1>
                <p className={`text-sm leading-relaxed max-w-xl ${sub(dark)}`}>
                  Complete candidate metrics or parse a PDF resume to execute real-time ML predictions
                  for placement probability, salary ranges, ATS scoring, and career analytics.
                </p>
              </div>

              {/* AI feature card */}
              <div className={`shrink-0 lg:max-w-[260px] rounded-2xl border p-4 ${
                dark
                  ? "border-slate-700/60 bg-gradient-to-br from-[#121a2f] to-[#0a0f1d]"
                  : "border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm"
              }`}>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-extrabold ${h(dark)}`}>Smarter Decisions</h3>
                    <span className="text-xs font-semibold text-cyan-500">Brighter Careers</span>
                  </div>
                </div>
                <p className={`text-sm leading-relaxed ${sub(dark)}`}>
                  AI-driven algorithms evaluate your profile vectors to forecast placement
                  probability and match optimal career paths.
                </p>
              </div>
            </div>

            {/* Quick preset chips */}
            <div className={`mt-5 pt-4 border-t flex flex-wrap items-center gap-2.5 ${divider(dark)}`}>
              <span className={`text-sm font-bold uppercase tracking-wider ${muted(dark)}`}>Quick Presets:</span>
              {[
                { key: "top_candidate",    label: "⭐ Top Candidate",     color: "emerald" },
                { key: "average_candidate",label: "📊 Average Candidate",  color: "amber" },
                { key: "high_risk",        label: "⚠️ High Risk Profile",  color: "rose" },
              ].map(({ key, label, color }) => {
                const sel = activePreset === key;
                return (
                  <button key={key} type="button" onClick={() => applyPreset(key)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border transition-all duration-200 hover:-translate-y-0.5 ${
                      sel
                        ? dark
                          ? `border-${color}-400 bg-${color}-500/20 text-${color}-200 shadow-[0_0_15px_rgba(6,182,212,0.25)] scale-[1.03]`
                          : `border-${color}-400 bg-${color}-50 text-${color}-800 shadow-sm scale-[1.03]`
                        : dark
                        ? "border-slate-700 bg-[#0a0f1d] text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4-Step Progress Stepper */}
          <div className={cardCls(dark, "p-5")}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {STEPS.map((item) => {
                const active    = item.id === step;
                const completed = item.id < step;
                return (
                  <button key={item.id} type="button" onClick={() => setStep(item.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      active
                        ? dark
                          ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                          : "border-cyan-500 bg-cyan-50 shadow-sm"
                        : completed
                        ? dark
                          ? "border-emerald-500/40 bg-emerald-950/20"
                          : "border-emerald-200 bg-emerald-50 shadow-sm"
                        : dark
                        ? "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-extrabold text-sm transition-colors ${
                      completed
                        ? dark
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                        : active
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md"
                        : dark
                        ? "bg-slate-800 text-slate-400 border border-slate-700"
                        : "bg-white text-slate-500 border border-slate-300"
                    }`}>
                      {completed ? <Check className="h-4 w-4 stroke-[2.5]" /> : <span>{item.id + 1}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-extrabold uppercase tracking-wider ${muted(dark)}`}>
                        Step {item.id + 1}{completed ? " ✓" : ""}
                      </p>
                      <p className={`text-sm font-bold truncate ${
                        active ? (dark ? "text-cyan-200" : "text-cyan-800") : (dark ? "text-slate-200" : "text-slate-800")
                      }`}>{item.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Animated progress track */}
            <div className={`h-2.5 rounded-full overflow-hidden border ${dark ? "bg-[#0a0f1d] border-slate-800" : "bg-slate-200 border-slate-300"}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-600 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Wizard Form Card */}
          <form onSubmit={submit} className={`relative ${cardCls(dark, "p-6 sm:p-8")}`}>

            {/* Loading overlay */}
            {loading && (
              <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl backdrop-blur-md ${
                dark ? "bg-[#0a0f1d]/95" : "bg-white/95"
              }`}>
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-cyan-500" />
                <p className={`text-lg font-extrabold ${h(dark)}`}>Evaluating Profile with Trained ML Models…</p>
                <p className={`mt-2 text-sm font-medium ${sub(dark)}`}>
                  Executing XGBoost classifier, salary regressor, ATS scoring & career matcher
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
              >
                {/* ─── STEP 1: CANDIDATE PROFILE ─── */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div className={`pb-4 border-b ${divider(dark)}`}>
                      <h2 className={`text-xl font-extrabold ${h(dark)}`}>Step 1: Candidate Profile & Resume</h2>
                      <p className={`mt-1 text-sm ${sub(dark)}`}>
                        Upload your PDF resume to auto-populate metrics. All pre-filled fields remain fully editable.
                      </p>
                    </div>

                    {/* PDF Resume Uploader — animated progress, skills extraction */}
                    <ResumeUploader onParsedMetrics={handleParsedMetrics} />

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label>Full Name</label>
                        <input placeholder="e.g. Aarav Sharma" value={form.name}
                          onChange={(e) => updateField("name", e.target.value)} />
                      </div>
                      <div>
                        <label>Email Address</label>
                        <input type="email" placeholder="e.g. candidate@university.edu" value={form.email}
                          onChange={(e) => updateField("email", e.target.value)} />
                        {fieldErrors.email && (
                          <p className="mt-1.5 text-sm font-semibold text-rose-500">{fieldErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <label>Gender</label>
                        <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label>Department / Branch</label>
                        <select value={form.department} onChange={(e) => updateField("department", e.target.value)}>
                          {["CSE","IT","AIML","ECE","EEE","MECH","CIVIL"].map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── STEP 2: ACADEMIC PERFORMANCE ─── */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className={`pb-4 border-b ${divider(dark)}`}>
                      <h2 className={`text-xl font-extrabold ${h(dark)}`}>Step 2: Academic Performance</h2>
                      <p className={`mt-1 text-sm ${sub(dark)}`}>
                        Configure grades and attendance. All values pre-filled from resume remain fully editable.
                      </p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <SliderField label="CGPA (Out of 10)"          min={0} max={10}  step={0.1} value={form.cgpa}                  onChange={(v) => updateField("cgpa", v)}                  dark={dark} />
                      <SliderField label="Active Backlogs"           min={0} max={12}             value={form.backlogs}               onChange={(v) => updateField("backlogs", v)}               dark={dark} />
                      <SliderField label="10th Marks Percentage"     min={0} max={100}            value={form.tenth_percentage}       onChange={(v) => updateField("tenth_percentage", v)}       suffix="%" dark={dark} />
                      <SliderField label="12th / Diploma Percentage" min={0} max={100}            value={form.twelfth_percentage}     onChange={(v) => updateField("twelfth_percentage", v)}     suffix="%" dark={dark} />
                      <SliderField label="College Attendance"        min={0} max={100}            value={form.attendance_percentage}  onChange={(v) => updateField("attendance_percentage", v)}  suffix="%" dark={dark} />
                    </div>
                    {/* Live CTC Estimator Widget */}
                    <SalaryWidget form={form} dark={dark} />
                  </div>
                )}

                {/* ─── STEP 3: TECHNICAL PROFICIENCY ─── */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className={`pb-4 border-b ${divider(dark)}`}>
                      <h2 className={`text-xl font-extrabold ${h(dark)}`}>Step 3: Technical Proficiency</h2>
                      <p className={`mt-1 text-sm ${sub(dark)}`}>
                        Assess core foundational scores in coding, aptitude, DSA, and communication skills.
                      </p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      {[
                        ["aptitude_score",     "Aptitude Score"],
                        ["coding_score",       "Coding Proficiency"],
                        ["communication_score","Communication Skills"],
                        ["technical_score",    "Core Technical Score"],
                        ["dsa_score",          "Data Structures & Algo (DSA)"],
                      ].map(([key, lbl]) => (
                        <SliderField key={key} label={lbl} min={0} max={100}
                          value={form[key]} onChange={(v) => updateField(key, v)} dark={dark} />
                      ))}
                    </div>
                    {/* Show estimator here too — updates dynamically */}
                    <SalaryWidget form={form} dark={dark} />
                  </div>
                )}

                {/* ─── STEP 4: PRACTICAL EXPERIENCE ─── */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className={`pb-4 border-b ${divider(dark)}`}>
                      <h2 className={`text-xl font-extrabold ${h(dark)}`}>Step 4: Practical Experience & Tech Stack</h2>
                      <p className={`mt-1 text-sm ${sub(dark)}`}>
                        Declare projects, internships, and tech toolsets. Resume-detected skills are pre-selected below.
                      </p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <SliderField label="Projects Completed"              min={0} max={12}  value={form.number_of_projects}       onChange={(v) => updateField("number_of_projects", v)}       dark={dark} />
                      <SliderField label="Internships Completed"           min={0} max={6}   value={form.number_of_internships}    onChange={(v) => updateField("number_of_internships", v)}    dark={dark} />
                      <SliderField label="Certifications Earned"           min={0} max={12}  value={form.number_of_certifications} onChange={(v) => updateField("number_of_certifications", v)} dark={dark} />
                      <SliderField label="LeetCode / Coding Problems"      min={0} max={800} value={form.leetcode_problems}        onChange={(v) => updateField("leetcode_problems", v)}        dark={dark} />
                    </div>

                    <div className="space-y-5 pt-1">
                      {[
                        ["Programming Languages", languageOptions, "programming_languages"],
                        ["Cloud & DevOps Skills", cloudOptions,    "cloud_skills"],
                        ["Database Technologies", databaseOptions, "database_skills"],
                        ["Frameworks & Tools",    toolOptions,     "tools"],
                      ].map(([lbl, opts, key]) => (
                        <div key={key}>
                          <label>{lbl}</label>
                          <p className={`text-xs -mt-1 mb-3 ${muted(dark)}`}>
                            Resume-detected skills are pre-selected — click to toggle
                          </p>
                          <ChipSelect options={opts} selected={form[key]}
                            onToggle={(v) => toggleListValue(key, v)} dark={dark} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {error && (
              <div className="mt-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm font-semibold text-rose-400">
                {error}
              </div>
            )}

            {/* Bottom nav */}
            <div className={`mt-7 flex items-center pt-5 border-t ${step === 0 ? "justify-end" : "justify-between"} ${divider(dark)}`}>
              {step > 0 && (
                <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="btn-glowing-secondary px-5 py-3 text-sm">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
              )}
              <button type="submit"
                disabled={loading || (step === STEPS.length - 1 && !canSubmit)}
                className="btn-glowing px-6 py-3 text-sm">
                {step === STEPS.length - 1
                  ? <><Zap className="h-4 w-4" /> Run Live Prediction</>
                  : <>Next Step <ChevronRight className="h-4 w-4" /></>
                }
              </button>
            </div>
          </form>
        </section>

        {/* ╔══════════════════════════════════════╗
            ║  RIGHT SIDEBAR  (col-span-3)         ║
            ╚══════════════════════════════════════╝ */}
        <aside className="col-span-12 xl:col-span-3 space-y-5">

          {/* Card 1: What You'll Get */}
          <div className={cardCls(dark, "p-5")}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                dark ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-cyan-50 border-cyan-200 text-cyan-600"
              }`}>
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className={`text-base font-extrabold ${h(dark)}`}>What You'll Get</h3>
            </div>

            <div className="space-y-3">
              {[
                { title: "Placement Eligibility",    desc: "Ensemble ML calibrated to campus hiring cutoffs.", icon: Briefcase, color: "emerald" },
                { title: "Salary Bracket Prediction",desc: "Projected annual CTC package range (LPA).",        icon: Coins,    color: "amber" },
                { title: "ATS Compliance Score",     desc: "Resume keyword density for Tier-1 ATS systems.",  icon: FileCheck2,color: "cyan" },
                { title: "Career Match Analytics",   desc: "Top role recommendations with roadmaps.",          icon: Compass,  color: "indigo" },
              ].map(({ title, desc, icon: Icon, color }) => (
                <div key={title} className={`rounded-xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  dark
                    ? "border-slate-800/80 bg-slate-900/50 hover:border-slate-700"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:shadow-sm"
                }`}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      color === "emerald" ? dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                        : color === "amber" ? dark ? "bg-amber-500/15 text-amber-400"   : "bg-amber-100 text-amber-700"
                        : color === "cyan"  ? dark ? "bg-cyan-500/15 text-cyan-400"     : "bg-cyan-100 text-cyan-700"
                        :                    dark ? "bg-indigo-500/15 text-indigo-400"  : "bg-indigo-100 text-indigo-700"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className={`text-sm font-bold ${h(dark)}`}>{title}</span>
                  </div>
                  <p className={`text-xs leading-relaxed pl-9 ${sub(dark)}`}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Philosophy Quote */}
          <div className={`rounded-2xl border p-5 relative overflow-hidden transition-all duration-300 ${
            dark
              ? "border-cyan-500/30 bg-gradient-to-br from-[#0e172a] via-[#0a0f1d] to-[#0a1426] shadow-xl"
              : "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50 shadow-sm shadow-cyan-100/60"
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Quote className={`h-5 w-5 ${dark ? "text-cyan-400" : "text-cyan-600"}`} />
              <span className={`text-xs font-extrabold uppercase tracking-widest ${dark ? "text-cyan-500" : "text-cyan-700"}`}>Philosophy</span>
            </div>
            <p className={`text-sm font-medium italic leading-relaxed ${dark ? "text-slate-200" : "text-slate-800"}`}>
              "The best way to predict your future is to create it."
            </p>
            <div className={`mt-3 flex items-center justify-between border-t pt-3 ${dark ? "border-cyan-500/20" : "border-cyan-200/60"}`}>
              <span className="text-sm font-extrabold metric-gradient">— PlacePath AI</span>
              <span className={`text-xs ${muted(dark)}`}>Campus Career Engine</span>
            </div>
          </div>

          {/* Card 3: Pro Tips Accordion */}
          <div className={cardCls(dark, "p-5")}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                dark ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"
              }`}>
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <h3 className={`text-base font-extrabold ${h(dark)}`}>Pro Tips</h3>
                <p className={`text-xs ${muted(dark)}`}>Actionable recruiter guidelines</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { title: "Resume ATS Optimization", bullets: [
                    "Quantify impact metrics (e.g. 35% speed improvement).",
                    "Use standard headings: Experience, Projects, Skills.",
                    "Embed verified keywords from target job descriptions.",
                  ]},
                { title: "DSA & Coding Readiness", bullets: [
                    "Target 200+ solved problems on LeetCode / CodeChef.",
                    "Master Arrays, Trees, DP, and Graph patterns first.",
                    "Practice timed 45-minute rounds to simulate interviews.",
                  ]},
                { title: "High-Impact Project Depth", bullets: [
                    "Showcase apps with live cloud / Vercel deployments.",
                    "Integrate CI/CD pipelines, Docker, or AWS services.",
                    "Highlight architectural trade-offs in your README.",
                  ]},
                { title: "Academic Benchmarks", bullets: [
                    "Maintain CGPA ≥ 7.5 for 95% of corporate cutoffs.",
                    "Zero active backlogs before placement drives begin.",
                    "Keep attendance ≥ 75% for institutional eligibility.",
                  ]},
              ].map((tip, idx) => {
                const open = expandedTip === idx;
                return (
                  <div key={tip.title} className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                    dark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"
                  }`}>
                    <button type="button" onClick={() => setExpandedTip(open ? -1 : idx)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:${dark ? "bg-slate-800/50" : "bg-white"}`}>
                      <span className={`text-sm font-bold ${open ? "text-cyan-400" : h(dark)}`}>{tip.title}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-cyan-400" : muted(dark)}`} />
                    </button>
                    {open && (
                      <div className={`px-4 pb-4 pt-1 border-t space-y-2 ${dark ? "border-slate-800" : "border-slate-200"}`}>
                        {tip.bullets.map((b, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                            <span className={`text-sm leading-relaxed ${body(dark)}`}>{b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Info Modal ── */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md rounded-2xl border p-7 shadow-2xl relative ${
              dark ? "border-slate-700 bg-[#0d1424] text-slate-100" : "border-slate-200 bg-white text-slate-900"
            }`}>
            <button type="button" onClick={() => setInfoModal(null)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${dark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}>
              <X className="h-5 w-5" />
            </button>
            <h3 className={`text-lg font-extrabold pr-8 ${h(dark)}`}>{infoModal.title}</h3>
            <p className={`mt-3 text-sm leading-relaxed ${sub(dark)}`}>{infoModal.body}</p>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={infoModal.onCta} className="btn-glowing px-5 py-2.5 text-sm">
                {infoModal.cta}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── AI Career Advisor Chat Modal ── */}
      <CareerAdvisorModal open={advisorOpen} onClose={() => setAdvisorOpen(false)} />
    </div>
  );
}
