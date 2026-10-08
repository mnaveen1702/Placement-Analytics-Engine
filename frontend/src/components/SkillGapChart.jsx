import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { scoreBenchmarks } from "../utils/formDefaults";

export default function SkillGapChart({ form, targetCareer }) {
  const bench = scoreBenchmarks[targetCareer] || scoreBenchmarks.default;
  const data = [
    { skill: "Coding", you: Number(form.coding_score) || 0, role: bench.coding },
    { skill: "DSA", you: Number(form.dsa_score) || 0, role: bench.dsa },
    { skill: "Aptitude", you: Number(form.aptitude_score) || 0, role: bench.aptitude },
    { skill: "Communication", you: Number(form.communication_score) || 0, role: bench.communication },
    { skill: "Technical", you: Number(form.technical_score) || 0, role: bench.technical },
    { skill: "CGPA×10", you: Math.round((Number(form.cgpa) || 0) * 10), role: bench.cgpa },
  ];

  return (
    <div className="glass p-5">
      <h3 className="font-display text-lg">Skill gap vs role benchmark</h3>
      <p className="mb-2 text-sm text-slate-400">
        Your scores compared with typical entry-level expectations
        {targetCareer ? ` for ${targetCareer}` : ""}.
      </p>
      <div className="h-80">
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b" }} />
            <Radar name="You" dataKey="you" stroke="#818cf8" fill="#818cf8" fillOpacity={0.35} />
            <Radar name="Role benchmark" dataKey="role" stroke="#f472b6" fill="#f472b6" fillOpacity={0.12} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
