import { useEffect, useState } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  ClipboardList,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { getHealth } from "../services/api";
import { useAssessment } from "../hooks/useAssessment";

const links = [
  { id: "form", label: "Assessment", icon: ClipboardList },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function Navbar() {
  const { page, setPage, prediction, darkMode, toggleTheme } = useAssessment();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline" }));
  }, []);

  const online = health?.status === "ok" || health?.placement_model_loaded;

  return (
    <header
      className={`no-print sticky top-0 z-50 transition-colors duration-300 border-b backdrop-blur-md w-full ${
        darkMode
          ? "border-slate-800/80 bg-[#0a0f1d]/90 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          : "border-slate-200/90 bg-white/90 shadow-sm"
      }`}
    >
      <div className="w-full flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
        {/* Logo and Tagline */}
        <button
          type="button"
          onClick={() => setPage("form")}
          className="group flex items-center gap-3 text-left transition"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-transform duration-300 group-hover:scale-105">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-display text-base font-extrabold tracking-tight ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                PlacePath AI
              </span>
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-2 py-0.5 text-[10px] font-extrabold text-cyan-400 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <span
              className={`block text-[11px] font-medium leading-none mt-0.5 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Placement prediction & career guidance
            </span>
          </div>
        </button>

        {/* Quick Navigation Tabs (Desktop) */}
        <nav
          className={`hidden items-center gap-1.5 rounded-full p-1 md:flex border transition-colors ${
            darkMode
              ? "border-slate-800 bg-[#0d1424]/90"
              : "border-slate-200 bg-slate-100/90"
          }`}
        >
          {links.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPage(id)}
                className={`flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-bold transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.45)] scale-100"
                    : darkMode
                    ? "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "animate-pulse" : ""}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Quick Navigation Tabs (Mobile) */}
        <nav
          className={`flex items-center gap-1 rounded-full p-1 md:hidden border transition-colors ${
            darkMode
              ? "border-slate-800 bg-[#0d1424]"
              : "border-slate-200 bg-slate-100"
          }`}
        >
          {links.map(({ id, label }) => {
            const active = page === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPage(id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? "bg-cyan-500 text-slate-950 shadow-md"
                    : darkMode
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Right Side Header Items */}
        <div className="flex items-center gap-3">
          {/* Readiness pill if prediction exists */}
          {prediction && (
            <span
              className={`hidden rounded-full px-3 py-1 text-xs font-bold lg:inline-flex items-center gap-1.5 ${
                darkMode
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              {prediction.placement_status} Readiness
            </span>
          )}

          {/* Status Badge: API online (green pulse indicator) */}
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              online
                ? darkMode
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                : darkMode
                ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {online ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                </>
              )}
            </span>
            <span>{online ? "API Online" : "API Offline"}</span>
          </div>

          {/* Theme Switcher Toggle (Sun / Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
              darkMode
                ? "border-slate-700 bg-slate-800/80 text-amber-300 hover:border-amber-400/50 hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                : "border-slate-200 bg-slate-100 text-indigo-600 hover:border-indigo-400/50 hover:bg-slate-200 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]"
            }`}
          >
            {darkMode ? (
              <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* User Avatar Badge: "NM" */}
          <div
            title="User Profile (NM)"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-xs font-extrabold text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] ring-2 ring-cyan-400/50 transition-all duration-300 hover:scale-105 hover:ring-cyan-300"
          >
            NM
          </div>
        </div>
      </div>
    </header>
  );
}
