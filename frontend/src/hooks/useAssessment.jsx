import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { askAdvisor, getErrorMessage, predictPlacement } from "../services/api";
import { emptyForm, toPayload } from "../utils/formDefaults";

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem("placepath_theme");
      if (stored) return stored === "dark";
      return true; // default to dark mode
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    }
    try {
      localStorage.setItem("placepath_theme", darkMode ? "dark" : "light");
    } catch {
      /* ignore storage errors */
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  const [page, setPage] = useState("form");
  const [form, setForm] = useState(emptyForm);
  const [prediction, setPrediction] = useState(null);
  const [advisor, setAdvisor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleListValue = (key, value) => {
    setForm((prev) => {
      const current = prev[key] || [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const runAnalysis = async (question = form.question) => {
    setLoading(true);
    setError("");
    const payload = toPayload({ ...form, question });
    try {
      const pred = await predictPlacement(payload);
      setPrediction(pred);
      try {
        const advice = await askAdvisor({ ...payload, question: question || null });
        setAdvisor(advice);
      } catch {
        setAdvisor({
          guidance: pred.areas_to_improve?.[0]
            ? `Focus first on: ${pred.areas_to_improve[0]}`
            : "Review the 4-week roadmap on the dashboard.",
          roadmap: [],
          source: "template_fallback",
        });
      }
      setPage("dashboard");
      return pred;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshAdvisor = async (question) => {
    setLoading(true);
    setError("");
    try {
      const advice = await askAdvisor(toPayload({ ...form, question }));
      setAdvisor(advice);
      return advice;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      page,
      setPage,
      form,
      setForm,
      prediction,
      careers: prediction ? { recommendations: prediction.recommendations || [] } : null,
      advisor,
      loading,
      error,
      setError,
      updateField,
      toggleListValue,
      runAnalysis,
      refreshAdvisor,
      darkMode,
      setDarkMode,
      toggleTheme,
    }),
    [page, form, prediction, advisor, loading, error, darkMode]
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}
