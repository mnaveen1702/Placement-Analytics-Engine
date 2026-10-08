import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { useAssessment } from "../hooks/useAssessment";

const prompts = [
  "Why is my placement probability low?",
  "Which skills should I improve first?",
  "How can I increase my placement probability?",
  "How to increase my salary range?",
  "Which career is best suited for my profile?",
];

export default function AiAdvisorChat() {
  const { advisor, refreshAdvisor, loading, form } = useAssessment();
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState([]);

  const send = async (question) => {
    const text = (question || draft).trim();
    if (!text) return;
    setHistory((prev) => [...prev, { role: "user", text }]);
    setDraft("");
    const result = await refreshAdvisor(text);
    setHistory((prev) => [
      ...prev,
      { role: "assistant", text: result.guidance, source: result.source },
    ]);
  };

  return (
    <div className="glass flex h-full flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <Bot className="h-5 w-5 text-indigo-300" />
        <div>
          <h3 className="font-display text-lg">AI career advisor</h3>
          <p className="text-xs text-slate-400">
            Explains ML results in natural language. It cannot invent extra student facts.
            {advisor?.source ? ` Source: ${advisor.source}.` : ""}
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {prompts.map((item) => (
          <button
            key={item}
            type="button"
            disabled={loading}
            onClick={() => send(item)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-left text-xs text-slate-300 hover:border-indigo-400 disabled:opacity-50"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="min-h-[180px] flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-950/50 p-3">
        {!history.length && advisor?.guidance && (
          <div className="rounded-xl bg-indigo-500/10 p-3 text-sm text-slate-200">{advisor.guidance}</div>
        )}
        {history.map((msg, idx) => (
          <div
            key={`${msg.role}-${idx}`}
            className={`rounded-xl p-3 text-sm ${
              msg.role === "user"
                ? "ml-8 bg-slate-800 text-slate-100"
                : "mr-8 bg-indigo-500/10 text-slate-200"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {!advisor && !history.length && (
          <p className="text-sm text-slate-500">
            Run an assessment first. The advisor uses {form.name || "the submitted profile"} as context only.
          </p>
        )}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question about your results..."
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-500 px-3 text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
