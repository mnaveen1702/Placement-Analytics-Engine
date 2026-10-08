import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ShapExplanationChart({ factors = [] }) {
  const data = [...factors]
    .slice(0, 8)
    .map((item) => ({
      name: item.feature,
      value: item.contribution,
      fill: item.direction === "positive" ? "#34d399" : "#fb7185",
      explanation: item.explanation,
    }))
    .sort((a, b) => a.value - b.value);

  if (!data.length) {
    return (
      <div className="glass p-5">
        <h3 className="font-display text-lg">Explainable AI</h3>
        <p className="mt-2 text-sm text-slate-400">Impact factors appear after a live prediction.</p>
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg">Explainable AI impact</h3>
          <p className="text-sm text-slate-400">Hover a bar for a plain-English driver explanation.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="chip bg-emerald-500/15 text-emerald-300">Positive</span>
          <span className="chip bg-rose-500/15 text-rose-300">Negative</span>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 16, right: 12 }}>
            <CartesianGrid stroke="#1e293b" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={128} stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#090d16", border: "1px solid #334155", borderRadius: 12 }}
              formatter={(value, _n, props) => [
                `${value}% · ${props.payload.explanation || ""}`,
                "Impact",
              ]}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
