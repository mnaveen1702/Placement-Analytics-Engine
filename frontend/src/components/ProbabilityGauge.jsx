import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { statusColor } from "../utils/formDefaults";

export default function ProbabilityGauge({ probability = 0, status = "Low" }) {
  const clamped = Math.max(0, Math.min(100, Number(probability) || 0));
  const palette = statusColor(status);
  const data = [
    { name: "score", value: clamped },
    { name: "rest", value: 100 - clamped },
  ];

  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-widest text-slate-400">Placement probability</p>
      <div className="relative mx-auto h-52 w-full max-w-xs">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={210}
              endAngle={-30}
              innerRadius="72%"
              outerRadius="92%"
              stroke="none"
            >
              <Cell fill={palette.bar} />
              <Cell fill="#1e293b" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-semibold">{clamped.toFixed(1)}%</span>
          <span className={`mt-1 text-sm ${palette.text}`}>{status} readiness</span>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400">
        Color encodes readiness: green high, amber medium, rose low.
      </p>
    </div>
  );
}
