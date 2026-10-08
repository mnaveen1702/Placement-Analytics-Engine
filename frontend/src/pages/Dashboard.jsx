import { FileDown, RefreshCcw, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { useAssessment } from "../hooks/useAssessment";
import ProbabilityGauge from "../components/ProbabilityGauge";
import ShapExplanationChart from "../components/ShapExplanationChart";
import CareerCards from "../components/CareerCards";
import SkillGapChart from "../components/SkillGapChart";
import RoadmapTimeline from "../components/RoadmapTimeline";
import AiAdvisorChat from "../components/AiAdvisorChat";

export default function Dashboard() {
  const { prediction, advisor, form, updateField, setPage, runAnalysis, loading } = useAssessment();

  if (!prediction) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Executive analytics</p>
        <h1 className="mt-3 font-display text-4xl">No analysis yet</h1>
        <p className="mt-3 max-w-xl text-slate-400">
          Complete the assessment wizard. The dashboard only renders live model output.
        </p>
        <button
          type="button"
          onClick={() => setPage("form")}
          className="mt-6 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950"
        >
          Open assessment
        </button>
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
    <div className="w-full space-y-6 px-4 py-8 md:px-8">
      <section className="glass flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Candidate report</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            {form.name || "Student"} · {form.department}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip bg-emerald-500/15 text-emerald-200">
              {prediction.placement_status === "High" ? "Placement Ready" : `${prediction.placement_status} readiness`}
            </span>
            <span className="chip bg-indigo-500/15 text-indigo-200">
              Expected package {prediction.package_range || "n/a"}
            </span>
            <span className="chip bg-cyan-500/15 text-cyan-200">
              ATS {prediction.ats_score}%
            </span>
            <span className="chip bg-slate-700/60 text-slate-200">
              Model {prediction.model_name || "loaded"}
            </span>
          </div>
        </div>
        <div className="no-print flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm"
          >
            <FileDown className="h-4 w-4" /> Export PDF
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => runAnalysis()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            <RefreshCcw className="h-4 w-4" /> Recalculate
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <ProbabilityGauge
          probability={prediction.placement_probability}
          status={prediction.placement_status}
        />
        <div className="glass p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Predicted CTC</p>
          <p className="mt-3 font-display text-4xl text-cyan-200">
            {prediction.predicted_package_lpa ?? "—"}
            <span className="ml-1 text-lg text-slate-400">LPA</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">{prediction.package_range}</p>
        </div>
        <div className="glass p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400">ATS resume score</p>
          <p className="mt-3 font-display text-4xl">{prediction.ats_score}%</p>
          <p className="mt-2 text-xs text-slate-400">
            Missing keywords: {(prediction.missing_keywords || []).slice(0, 4).join(", ") || "none"}
          </p>
        </div>
        <div className="glass p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Readiness index</p>
          <p className="mt-3 font-display text-4xl text-emerald-300">{prediction.readiness_index}</p>
          <p className="mt-2 text-xs text-slate-400">
            Blend of placement probability, ATS coverage, and coding score
          </p>
        </div>
      </section>

      <ShapExplanationChart factors={prediction.shap_factors} />

      <section>
        <h2 className="mb-3 font-display text-xl">Career match matrix</h2>
        <CareerCards
          recommendations={prediction.recommendations || []}
          onSelect={(career) => updateField("target_career", career)}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <SkillGapChart form={form} targetCareer={target} />
        <RoadmapTimeline roadmap={weekRoadmap} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass p-5">
          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <TrendingUp className="h-4 w-4" /> Strengths
          </p>
          <ul className="space-y-2 text-sm text-emerald-200">
            {(prediction.key_strengths || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="glass p-5">
          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <ShieldAlert className="h-4 w-4" /> Areas to improve
          </p>
          <ul className="space-y-2 text-sm text-amber-200">
            {(prediction.areas_to_improve || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass p-5">
        <p className="mb-2 flex items-center gap-2 text-sm text-cyan-200">
          <Sparkles className="h-4 w-4" /> Present ATS keywords
        </p>
        <div className="flex flex-wrap gap-2">
          {(prediction.present_keywords || []).map((k) => (
            <span key={k} className="chip bg-emerald-500/15 text-emerald-200">
              {k}
            </span>
          ))}
        </div>
      </div>

      <AiAdvisorChat />
    </div>
  );
}
