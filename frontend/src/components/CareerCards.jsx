import { motion } from "framer-motion";
import { Briefcase, Check, Minus } from "lucide-react";

export default function CareerCards({ recommendations = [], onSelect }) {
  if (!recommendations.length) {
    return (
      <div className="card p-5">
        <h3 className="font-display text-lg">Career matches</h3>
        <p className="mt-2 text-sm text-slate-400">Submit an assessment to rank career tracks.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {recommendations.map((role, index) => (
        <motion.button
          type="button"
          key={role.career}
          onClick={() => onSelect?.(role.career)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="card p-5 text-left transition hover:border-indigo-400/50"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
              <Briefcase className="h-4 w-4" />
            </span>
            <span className="font-display text-2xl text-violet-200">{role.match_percentage}%</span>
          </div>
          <h4 className="font-display text-lg">{role.career}</h4>
          <p className="mt-2 line-clamp-3 text-sm text-slate-400">{role.reason}</p>
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Matched</p>
            <div className="flex flex-wrap gap-1.5">
              {(role.matching_skills || []).slice(0, 6).map((skill) => (
                <span key={skill} className="chip bg-emerald-500/15 text-emerald-300">
                  <Check className="mr-1 h-3 w-3" />
                  {skill}
                </span>
              ))}
              {!role.matching_skills?.length && (
                <span className="text-xs text-slate-500">No overlapping skills yet</span>
              )}
            </div>
          </div>
          <div className="mt-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {(role.missing_skills || []).slice(0, 6).map((skill) => (
                <span key={skill} className="chip bg-amber-500/15 text-amber-200">
                  <Minus className="mr-1 h-3 w-3" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
