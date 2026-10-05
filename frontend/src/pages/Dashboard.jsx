import { ShieldAlert, TrendingUp } from "lucide-react";
import { useAssessment } from "../hooks/useAssessment";
import ProbabilityGauge from "../components/ProbabilityGauge";
import ShapExplanationChart from "../components/ShapExplanationChart";
import CareerCards from "../components/CareerCards";
import SkillGapChart from "../components/SkillGapChart";
import RoadmapTimeline from "../components/RoadmapTimeline";
import AiAdvisorChat from "../components/AiAdvisorChat";
import AssessmentForm from "./AssessmentForm";

export default function Dashboard() {
  const { prediction, careers, advisor, form, updateField } = useAssessment();
  const target =
    form.target_career || careers?.recommendations?.[0]?.career || "Software Developer";

  if (!prediction) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <section className="card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">Executive dashboard</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Predict placement. Rank careers. Explain every score.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Complete the assessment. The ML model estimates placement probability, the skill engine
            ranks roles, and the advisor only narrates those computed results.
          </p>
        </section>
        <AssessmentForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <ProbabilityGauge
          probability={prediction.placement_probability}
          status={prediction.placement_status}
        />
        <div className="card p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Package estimate</p>
          <p className="mt-3 font-display text-3xl">
            {prediction.predicted_package_lpa ? `${prediction.predicted_package_lpa} LPA` : "—"}
          </p>
          <p className="mt-2 text-sm text-slate-400">{prediction.package_range || "Range unavailable"}</p>
          <p className="mt-4 text-xs text-slate-500">
            Confidence {Math.round((prediction.confidence || 0) * 100)}% · model
            {prediction.model_loaded ? " loaded" : " missing"}
          </p>
        </div>
        <div className="card p-5">
          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <TrendingUp className="h-4 w-4" /> Strengths
          </p>
          <ul className="space-y-1.5 text-sm text-emerald-200">
            {(prediction.key_strengths || []).slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mb-2 mt-4 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <ShieldAlert className="h-4 w-4" /> Improve
          </p>
          <ul className="space-y-1.5 text-sm text-amber-200">
            {(prediction.areas_to_improve || []).slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <ShapExplanationChart factors={prediction.shap_factors} />

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl">Top career matches</h2>
          <p className="text-xs text-slate-500">Click a card to set it as the benchmark role.</p>
        </div>
        <CareerCards
          recommendations={careers?.recommendations || []}
          onSelect={(career) => updateField("target_career", career)}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkillGapChart form={form} targetCareer={target} />
        <RoadmapTimeline roadmap={advisor?.roadmap || []} />
      </div>

      <AiAdvisorChat />

      <details className="card p-4">
        <summary className="cursor-pointer text-sm text-slate-300">Update assessment and re-run</summary>
        <div className="mt-4">
          <AssessmentForm />
        </div>
      </details>
    </div>
  );
}
