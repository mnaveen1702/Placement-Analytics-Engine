import { motion } from "framer-motion";
import { CalendarRange } from "lucide-react";

export default function RoadmapTimeline({ roadmap = [] }) {
  if (!roadmap.length) {
    return (
      <div className="card p-5">
        <h3 className="font-display text-lg">5-month roadmap</h3>
        <p className="mt-2 text-sm text-slate-400">The advisor will generate a month-by-month plan after analysis.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-5 flex items-center gap-2">
        <CalendarRange className="h-5 w-5 text-violet-300" />
        <h3 className="font-display text-lg">Personalized 5-month roadmap</h3>
      </div>
      <ol className="relative space-y-5 border-l border-indigo-500/30 pl-6">
        {roadmap.map((month, index) => (
          <motion.li
            key={`${month.month}-${month.title}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold">
              {month.month}
            </span>
            <h4 className="font-medium text-white">{month.title}</h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(month.focus || []).map((item) => (
                <span key={item} className="chip bg-violet-500/15 text-violet-200">
                  {item}
                </span>
              ))}
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-300">
              {(month.tasks || []).map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
