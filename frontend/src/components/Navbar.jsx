import { useEffect, useState } from "react";
import { GraduationCap, LayoutDashboard, ClipboardList, Activity } from "lucide-react";
import { getHealth } from "../services/api";
import { useAssessment } from "../hooks/useAssessment";

const links = [
  { id: "form", label: "Assessment", icon: ClipboardList },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function Navbar() {
  const { page, setPage, prediction } = useAssessment();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline" }));
  }, []);

  const online = health?.status === "ok";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <button
          type="button"
          onClick={() => setPage("form")}
          className="flex items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-glow">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-sm font-semibold tracking-wide text-white">
              PlacePath AI
            </span>
            <span className="text-xs text-slate-400">Placement prediction & career guidance</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-slate-900/70 p-1 md:flex">
          {links.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                page === id
                  ? "bg-indigo-500 text-white"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <nav className="flex items-center gap-1 md:hidden">
          {links.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                page === id ? "bg-indigo-500 text-white" : "text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {prediction && (
            <span className="hidden rounded-full bg-indigo-500/15 px-3 py-1 text-xs text-indigo-200 sm:inline">
              {prediction.placement_status} readiness
            </span>
          )}
          <span
            className={`chip ${
              online ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
            }`}
          >
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            {online ? "API online" : "API offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
