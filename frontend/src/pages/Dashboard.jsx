import { FileDown, RefreshCcw, ShieldAlert, Sparkles, TrendingUp, Award, CheckCircle2, ArrowUpRight } from "lucide-react";
import { useAssessment } from "../hooks/useAssessment";
import ProbabilityGauge from "../components/ProbabilityGauge";
import ShapExplanationChart from "../components/ShapExplanationChart";
import CareerCards from "../components/CareerCards";
import SkillGapChart from "../components/SkillGapChart";
import RoadmapTimeline from "../components/RoadmapTimeline";
import AiAdvisorChat from "../components/AiAdvisorChat";

export default function Dashboard() {
  const { prediction, form, updateField, setPage, runAnalysis, loading } = useAssessment();

  if (!prediction) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-7xl flex-col items-center justify-center px-6 text-center">
        <div className="glass flex flex-col items-center p-12 max-w-xl border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Sparkles className="h-8 w-8 animate-pulse text-cyan-400" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Executive Placement Analytics</p>
          <h1 className="mt-3 text-4xl font-extrabold text-slate-100">No Assessment Data Yet</h1>
          <p className="mt-3 text-base font-medium text-slate-300">
            Complete the candidate wizard or parse a PDF resume to generate real ML model predictions, salary range estimations, SHAP explainability charts, and career roadmaps.
          </p>
          <button
            type="button"
            onClick={() => setPage("form")}
            className="btn-glowing mt-8"
          >
            Start Assessment Wizard <ArrowUpRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  const target = form.target_career || prediction.recommendations?.[0]?.career;
  const weekRoadmap = (prediction.week_roadmap || []).map((week) => ({
    month: week.week,
    title: week.title,
    focus: week.focus,
    tasks: week.tasks,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      {/* Top Banner / Candidate Summary Card */}
      <section className="glass flex flex-wrap items-center justify-between gap-6 p-8 border-slate-700/80 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Award className="h-4 w-4 text-cyan-400" /> Live Executive Candidate Report
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-100">
            {form.name || "Student"} <span className="text-slate-500 font-normal">•</span> {form.department}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <span className="chip border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-400" />
              {prediction.placement_status === "High" ? "Placement Ready" : `${prediction.placement_status} Readiness`}
            </span>
            <span className="chip border border-indigo-500/40 bg-indigo-500/20 text-indigo-200">
              Expected Package: {prediction.package_range || "N/A"}
            </span>
            <span className="chip border border-cyan-500/40 bg-cyan-500/20 text-cyan-200">
              ATS Score: {prediction.ats_score}%
            </span>
            <span className="chip border border-slate-700 bg-slate-800/80 text-slate-300">
              Model: {prediction.model_name || "Active ML"}
            </span>
          </div>
        </div>

        <div className="no-print flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-glowing-secondary"
          >
            <FileDown className="h-5 w-5 text-cyan-400" /> Export PDF Report
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => runAnalysis()}
            className="btn-glowing"
          >
            <RefreshCcw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} /> Recalculate
          </button>
        </div>
      </section>

      {/* Key Metric Grid */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <ProbabilityGauge
          probability={prediction.placement_probability}
          status={prediction.placement_status}
        />

        <div className="glass-card p-6 flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Predicted CTC Package</p>
          <div className="my-3">
            <p className="text-5xl font-extrabold metric-gradient tracking-tight">
              {prediction.predicted_package_lpa ?? "—"}
              <span className="ml-2 text-2xl font-bold text-slate-400">LPA</span>
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-300 border-t border-slate-800/80 pt-3">
            {prediction.package_range}
          </p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">ATS Resume Score</p>
          <div className="my-3">
            <p className="text-5xl font-extrabold metric-gradient tracking-tight">
              {prediction.ats_score}%
            </p>
          </div>
          <p className="text-xs font-medium text-slate-400 border-t border-slate-800/80 pt-3">
            Missing Keywords: {(prediction.missing_keywords || []).slice(0, 3).join(", ") || "None"}
          </p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Readiness Index</p>
          <div className="my-3">
            <p className="text-5xl font-extrabold metric-gradient tracking-tight">
              {prediction.readiness_index}
            </p>
          </div>
          <p className="text-xs font-medium text-slate-400 border-t border-slate-800/80 pt-3">
            Blend of placement probability, ATS coverage & coding score
          </p>
        </div>
      </section>

      {/* SHAP Explanation */}
      <ShapExplanationChart factors={prediction.shap_factors} />

      {/* Career Match Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-100">Career Match Matrix</h2>
          <span className="text-xs font-semibold text-cyan-400">Select role to compare skill gaps</span>
        </div>
        <CareerCards
          recommendations={prediction.recommendations || []}
          onSelect={(career) => updateField("target_career", career)}
        />
      </section>

      {/* Skill Gap & Roadmap */}
      <div className="grid gap-6 xl:grid-cols-2">
        <SkillGapChart form={form} targetCareer={target} />
        <RoadmapTimeline roadmap={weekRoadmap} />
      </div>

      {/* Strengths & Improvements Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card p-6 space-y-4">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-400">
            <TrendingUp className="h-5 w-5" /> Key Strengths
          </p>
          <ul className="space-y-2.5 text-base font-medium text-slate-200">
            {(prediction.key_strengths || []).map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-6 space-y-4">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-400">
            <ShieldAlert className="h-5 w-5" /> Recommended Priority Areas
          </p>
          <ul className="space-y-2.5 text-base font-medium text-slate-200">
            {(prediction.areas_to_improve || []).map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Present Keywords */}
      <div className="glass-card p-6">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-300">
          <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" /> Detected ATS Keywords in Profile
        </p>
        <div className="flex flex-wrap gap-2.5">
          {(prediction.present_keywords || []).map((k) => (
            <span key={k} className="chip border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 shadow-sm">
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* AI Advisor Chat */}
      <AiAdvisorChat />
    </div>
  );
}
