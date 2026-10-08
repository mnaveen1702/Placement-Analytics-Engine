import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserRound,
  GraduationCap,
  Cpu,
  FolderGit2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAssessment } from "../hooks/useAssessment";
import {
  cloudOptions,
  databaseOptions,
  languageOptions,
  presets,
  toolOptions,
} from "../utils/formDefaults";

const STEPS = [
  { id: 0, title: "Candidate Profile", icon: UserRound },
  { id: 1, title: "Academic Performance", icon: GraduationCap },
  { id: 2, title: "Technical Proficiency", icon: Cpu },
  { id: 3, title: "Practical Experience", icon: FolderGit2 },
];

function SliderField({ label, min, max, step = 1, value, onChange, suffix = "" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="mb-0">{label}</label>
        <input
          className="w-24"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mt-1 text-right text-xs text-cyan-200/80">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function ChipSelect({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            type="button"
            key={option}
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? "border-cyan-400 bg-cyan-500/20 text-white"
                : "border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function Assessment() {
  const [step, setStep] = useState(0);
  const { form, setForm, updateField, toggleListValue, runAnalysis, loading, error } =
    useAssessment();

  const fieldErrors = useMemo(() => {
    const next = {};
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email or leave it blank.";
    }
    if (Number(form.cgpa) < 0 || Number(form.cgpa) > 10) next.cgpa = "CGPA must be 0–10.";
    if (Number(form.backlogs) < 0) next.backlogs = "Backlogs cannot be negative.";
    return next;
  }, [form]);

  const canSubmit = Object.keys(fieldErrors).length === 0;

  const submit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    if (!canSubmit) return;
    try {
      await runAnalysis();
    } catch {
      /* error banner is set in context */
    }
  };

  return (
    <div className="w-full px-4 py-8 md:px-8">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">PlacePath AI</p>
        <h1 className="mt-2 font-display text-3xl md:text-5xl">Student Assessment Wizard</h1>
        <p className="mt-3 max-w-3xl text-slate-400">
          Four steps. Real scores. The classifier, salary regressor, and career matcher run only
          after you submit — nothing is hardcoded.
        </p>
      </section>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["top_candidate", "Top Candidate"],
          ["average_candidate", "Average Candidate"],
          ["high_risk", "High Risk Profile"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setForm(presets[key]);
              setStep(0);
            }}
            className="chip border border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {STEPS.map((item) => {
          const Icon = item.icon;
          const active = item.id === step;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(item.id)}
              className={`glass flex items-center gap-3 px-4 py-3 text-left ${
                active ? "border-cyan-400/50" : ""
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-cyan-300" : "text-slate-400"}`} />
              <span className="text-sm">{item.title}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="glass relative p-6 md:p-8">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[#0b0f19]/80 backdrop-blur-sm">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-cyan-300" />
            <p className="text-sm text-slate-200">Scoring with the trained placement model…</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label>Full name</label>
                  <input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                </div>
                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label>Gender</label>
                  <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label>Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => updateField("department", e.target.value)}
                  >
                    {["CSE", "IT", "AIML", "ECE", "EEE", "MECH", "CIVIL"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5 md:grid-cols-2">
                <SliderField
                  label="CGPA"
                  min={0}
                  max={10}
                  step={0.1}
                  value={form.cgpa}
                  onChange={(v) => updateField("cgpa", v)}
                />
                <SliderField
                  label="Backlogs"
                  min={0}
                  max={12}
                  value={form.backlogs}
                  onChange={(v) => updateField("backlogs", v)}
                />
                <SliderField
                  label="10th %"
                  min={0}
                  max={100}
                  value={form.tenth_percentage}
                  onChange={(v) => updateField("tenth_percentage", v)}
                  suffix="%"
                />
                <SliderField
                  label="12th %"
                  min={0}
                  max={100}
                  value={form.twelfth_percentage}
                  onChange={(v) => updateField("twelfth_percentage", v)}
                  suffix="%"
                />
                <SliderField
                  label="Attendance"
                  min={0}
                  max={100}
                  value={form.attendance_percentage}
                  onChange={(v) => updateField("attendance_percentage", v)}
                  suffix="%"
                />
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5 md:grid-cols-2">
                {[
                  ["aptitude_score", "Aptitude"],
                  ["coding_score", "Coding"],
                  ["communication_score", "Communication"],
                  ["technical_score", "Core technical"],
                  ["dsa_score", "DSA"],
                ].map(([key, label]) => (
                  <SliderField
                    key={key}
                    label={label}
                    min={0}
                    max={100}
                    value={form[key]}
                    onChange={(v) => updateField(key, v)}
                  />
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <SliderField
                    label="Projects"
                    min={0}
                    max={12}
                    value={form.number_of_projects}
                    onChange={(v) => updateField("number_of_projects", v)}
                  />
                  <SliderField
                    label="Internships"
                    min={0}
                    max={6}
                    value={form.number_of_internships}
                    onChange={(v) => updateField("number_of_internships", v)}
                  />
                  <SliderField
                    label="Certifications"
                    min={0}
                    max={12}
                    value={form.number_of_certifications}
                    onChange={(v) => updateField("number_of_certifications", v)}
                  />
                  <SliderField
                    label="LeetCode problems"
                    min={0}
                    max={800}
                    value={form.leetcode_problems}
                    onChange={(v) => updateField("leetcode_problems", v)}
                  />
                </div>
                <div>
                  <label>Languages</label>
                  <ChipSelect
                    options={languageOptions}
                    selected={form.programming_languages}
                    onToggle={(v) => toggleListValue("programming_languages", v)}
                  />
                </div>
                <div>
                  <label>Cloud</label>
                  <ChipSelect
                    options={cloudOptions}
                    selected={form.cloud_skills}
                    onToggle={(v) => toggleListValue("cloud_skills", v)}
                  />
                </div>
                <div>
                  <label>Databases</label>
                  <ChipSelect
                    options={databaseOptions}
                    selected={form.database_skills}
                    onToggle={(v) => toggleListValue("database_skills", v)}
                  />
                </div>
                <div>
                  <label>Tools</label>
                  <ChipSelect
                    options={toolOptions}
                    selected={form.tools}
                    onToggle={(v) => toggleListValue("tools", v)}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="submit"
            disabled={loading || (step === STEPS.length - 1 && !canSubmit)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2.5 text-sm font-medium text-slate-950"
          >
            {step === STEPS.length - 1 ? "Run prediction" : "Continue"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
