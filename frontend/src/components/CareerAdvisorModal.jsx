import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Loader2,
  User,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { useAssessment } from "../hooks/useAssessment";

const QUICK_PROMPTS = [
  "How do I improve my ATS score for AI/ML roles?",
  "Which skills should I prioritize to boost placement chances?",
  "What CGPA cutoff do top product companies require?",
  "How can I increase my expected salary bracket?",
  "Which career path best fits my current profile?",
  "How many LeetCode problems should I target before placements?",
];

export default function CareerAdvisorModal({ open, onClose }) {
  const { advisor, refreshAdvisor, loading, form, darkMode } = useAssessment();
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState([]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, thinking, open]);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const send = async (question) => {
    const text = (question ?? draft).trim();
    if (!text || thinking) return;

    setHistory((prev) => [...prev, { role: "user", text }]);
    setDraft("");
    setThinking(true);

    try {
      const result = await refreshAdvisor(text);
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result?.guidance ?? "I could not generate a response. Please try again.",
          source: result?.source,
        },
      ]);
    } catch {
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Something went wrong connecting to the AI advisor. Please verify the backend is running on port 8000.",
          source: "error",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const clearChat = () => setHistory([]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-0 sm:pr-6 sm:pb-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer / Floating Chat Panel */}
      <div
        className={`relative z-10 flex flex-col w-full sm:w-[420px] h-[90vh] sm:h-[640px] rounded-t-3xl sm:rounded-2xl border shadow-2xl overflow-hidden transition-colors duration-300 ${
          darkMode
            ? "border-slate-700/80 bg-[#0d1424]"
            : "border-slate-200 bg-white"
        }`}
      >
        {/* Chat Header */}
        <div
          className={`flex items-center justify-between gap-3 px-5 py-4 border-b shrink-0 ${
            darkMode
              ? "border-slate-800 bg-[#0a0f1d]"
              : "border-slate-100 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3
                className={`text-sm font-extrabold leading-none ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                PlacePath AI Career Advisor
              </h3>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  Powered by Gemini LLM
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                title="Clear conversation"
                className={`p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-200 ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-200 ${
                darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Candidate context banner */}
        {form.name && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold border-b flex items-center gap-2 shrink-0 ${
              darkMode
                ? "border-slate-800/80 bg-indigo-950/40 text-indigo-300"
                : "border-slate-100 bg-indigo-50 text-indigo-700"
            }`}
          >
            <User className="h-3.5 w-3.5 shrink-0" />
            <span>
              Advising:{" "}
              <strong>{form.name}</strong> — {form.department} | CGPA {form.cgpa}
            </span>
          </div>
        )}

        {/* Quick Prompts */}
        {history.length === 0 && (
          <div
            className={`px-4 pt-4 pb-3 border-b shrink-0 ${
              darkMode ? "border-slate-800/60" : "border-slate-100"
            }`}
          >
            <p
              className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <MessageSquare className="inline h-3.5 w-3.5 mr-1.5" />
              Quick Questions
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={thinking}
                  onClick={() => send(q)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border text-left transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 ${
                    darkMode
                      ? "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-indigo-400/60 hover:bg-slate-800"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-400 hover:bg-white"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Initial greeting / advisor context */}
          {!history.length && advisor?.guidance && (
            <div
              className={`rounded-2xl p-4 text-sm leading-relaxed border ${
                darkMode
                  ? "bg-indigo-950/40 border-indigo-500/20 text-slate-200"
                  : "bg-indigo-50 border-indigo-100 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Placement Analysis
                </span>
              </div>
              {advisor.guidance}
            </div>
          )}

          {!history.length && !advisor?.guidance && (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 mb-3">
                <Sparkles className="h-7 w-7 text-indigo-400 animate-pulse" />
              </div>
              <p
                className={`text-sm font-semibold ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Ask me anything about your career path
              </p>
              <p
                className={`text-xs mt-1 ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                I'll use your profile data for personalized AI guidance
              </p>
            </div>
          )}

          {/* Conversation history */}
          {history.map((msg, idx) => (
            <div
              key={`${msg.role}-${idx}`}
              className={`flex gap-2.5 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold mt-1 ${
                  msg.role === "user"
                    ? "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white"
                    : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                }`}
              >
                {msg.role === "user" ? "NM" : <Bot className="h-4 w-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? darkMode
                      ? "bg-cyan-950/60 border border-cyan-500/20 text-slate-100"
                      : "bg-cyan-50 border border-cyan-200 text-slate-900"
                    : darkMode
                    ? "bg-indigo-950/40 border border-indigo-500/20 text-slate-200"
                    : "bg-indigo-50 border border-indigo-100 text-slate-700"
                }`}
              >
                {msg.text}
                {msg.source && msg.source !== "error" && (
                  <div className="mt-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    via {msg.source}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <div className="flex gap-2.5 flex-row">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white mt-1">
                <Bot className="h-4 w-4" />
              </div>
              <div
                className={`rounded-2xl px-4 py-3 border flex items-center gap-2 ${
                  darkMode
                    ? "bg-indigo-950/40 border-indigo-500/20"
                    : "bg-indigo-50 border-indigo-100"
                }`}
              >
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span
                  className={`text-sm font-semibold ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Analyzing your profile…
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Chat Input */}
        <div
          className={`shrink-0 px-4 py-3 border-t ${
            darkMode ? "border-slate-800 bg-[#0a0f1d]" : "border-slate-100 bg-slate-50"
          }`}
        >
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about your career, resume, skills…"
              disabled={thinking}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium border outline-none transition-colors focus:ring-2 focus:ring-indigo-500/30 ${
                darkMode
                  ? "bg-[#0d1424] border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400"
                  : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500"
              }`}
            />
            <button
              type="submit"
              disabled={thinking || !draft.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)] hover:from-indigo-400 hover:to-violet-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p
            className={`mt-2 text-[11px] text-center ${
              darkMode ? "text-slate-600" : "text-slate-400"
            }`}
          >
            Responses use your submitted profile as context
          </p>
        </div>
      </div>
    </div>
  );
}
