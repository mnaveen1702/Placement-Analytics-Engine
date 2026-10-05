import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useAssessment } from "../hooks/useAssessment";
import {
  careerOptions,
  cloudOptions,
  databaseOptions,
  demoForm,
  languageOptions,
  toolOptions,
} from "../utils/formDefaults";

const steps = ["Profile", "Scores", "Experience", "Skills"];

function Field({ label, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
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
                ? "border-indigo-400 bg-indigo-500/20 text-white"
                : "border-white/10 text-slate-300 hover:border-white/30"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function AssessmentForm() {
  const [step, setStep] = useState(0);
  const { form, setForm, updateField, toggleListValue, runAnalysis, loading, error } =
    useAssessment();

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async (e) => {
    e.preventDefault();
    if (step < steps.length - 1) {
      next();
      return;
    }
    await runAnalysis();
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Student assessment</p>
          <h2 className="font-display text-2xl">Tell us about your profile</h2>
        </div>
        <button
          type="button"
          onClick={() => setForm(demoForm)}
          className="chip bg-violet-500/15 text-violet-200"
        >
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Load demo profile
        </button>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-2">
        {steps.map((label, index) => (
          <button
            type="button"
            key={label}
            onClick={() => setStep(index)}
            className={`rounded-xl px-2 py-2 text-xs font-medium md:text-sm ${
              index === step
                ? "bg-indigo-500 text-white"
                : index < step
                  ? "bg-indigo-500/20 text-indigo-200"
                  : "bg-slate-800 text-slate-400"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Department">
            <select
              value={form.department}
              onChange={(e) => updateField("department", e.target.value)}
            >
              {["CSE", "IT", "AIML", "ECE", "EEE", "MECH", "CIVIL"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="CGPA (0-10)">
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={form.cgpa}
              onChange={(e) => updateField("cgpa", e.target.value)}
            />
          </Field>
          <Field label="Backlogs">
            <input
              type="number"
              min="0"
              value={form.backlogs}
              onChange={(e) => updateField("backlogs", e.target.value)}
            />
          </Field>
          <Field label="10th %">
            <input
              type="number"
              value={form.tenth_percentage}
              onChange={(e) => updateField("tenth_percentage", e.target.value)}
            />
          </Field>
          <Field label="12th %">
            <input
              type="number"
              value={form.twelfth_percentage}
              onChange={(e) => updateField("twelfth_percentage", e.target.value)}
            />
          </Field>
          <Field label="Attendance %">
            <input
              type="number"
              value={form.attendance_percentage}
              onChange={(e) => updateField("attendance_percentage", e.target.value)}
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["aptitude_score", "Aptitude score"],
            ["coding_score", "Coding score"],
            ["dsa_score", "DSA score"],
            ["technical_score", "Technical score"],
            ["communication_score", "Communication score"],
          ].map(([key, label]) => (
            <Field key={key} label={`${label} (0-100)`}>
              <input
                type="number"
                min="0"
                max="100"
                value={form[key]}
                onChange={(e) => updateField(key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Projects">
            <input
              type="number"
              min="0"
              value={form.number_of_projects}
              onChange={(e) => updateField("number_of_projects", e.target.value)}
            />
          </Field>
          <Field label="Internships">
            <input
              type="number"
              min="0"
              value={form.number_of_internships}
              onChange={(e) => updateField("number_of_internships", e.target.value)}
            />
          </Field>
          <Field label="Certifications">
            <input
              type="number"
              min="0"
              value={form.number_of_certifications}
              onChange={(e) => updateField("number_of_certifications", e.target.value)}
            />
          </Field>
          <Field label="LeetCode problems">
            <input
              type="number"
              min="0"
              value={form.leetcode_problems}
              onChange={(e) => updateField("leetcode_problems", e.target.value)}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label>Programming languages</label>
            <ChipSelect
              options={languageOptions}
              selected={form.programming_languages}
              onToggle={(v) => toggleListValue("programming_languages", v)}
            />
          </div>
          <div>
            <label>Cloud skills</label>
            <ChipSelect
              options={cloudOptions}
              selected={form.cloud_skills}
              onToggle={(v) => toggleListValue("cloud_skills", v)}
            />
          </div>
          <div>
            <label>Database skills</label>
            <ChipSelect
              options={databaseOptions}
              selected={form.database_skills}
              onToggle={(v) => toggleListValue("database_skills", v)}
            />
          </div>
          <div>
            <label>Tools & topics</label>
            <ChipSelect
              options={toolOptions}
              selected={form.tools}
              onToggle={(v) => toggleListValue("tools", v)}
            />
          </div>
          <Field label="Target career (optional)">
            <select
              value={form.target_career}
              onChange={(e) => updateField("target_career", e.target.value)}
            >
              <option value="">Let the engine recommend</option>
              {careerOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 0}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-medium text-white"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {step === steps.length - 1 ? "Run prediction" : "Continue"}
        </button>
      </div>
    </form>
  );
}
