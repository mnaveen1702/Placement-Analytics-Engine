
import { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

import { parseResume, getErrorMessage } from "../services/api";
import { useAssessment } from "../hooks/useAssessment";

export default function ResumeUploader({ onParsedMetrics }) {
  const { darkMode } = useAssessment();

  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [parsedFile, setParsedFile] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    let timer;

    if (loading) {
      setProgress(15);

      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }

          return prev + 15;
        });
      }, 150);
    } else {
      setProgress(0);
    }

    return () => clearInterval(timer);
  }, [loading]);

  const processFile = async (file) => {
    if (!file || loading) return;

    setError("");

    // Validate file type
    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      (file.type && file.type !== "application/pdf")
    ) {
      setError("Please select a valid PDF file (.pdf).");
      return;
    }

    // Reject empty files
    if (file.size === 0) {
      setError("The selected PDF is empty. Please choose another file.");
      return;
    }

    setLoading(true);

    try {
      const response = await parseResume(file);

      if (response?.status !== "success" || !response.data) {
        throw new Error("The server could not parse this resume.");
      }

      setProgress(100);

      setParsedFile({
        name: file.name,
        data: response.data,
      });

      if (typeof onParsedMetrics === "function") {
        onParsedMetrics(response.data);
      }
    } catch (err) {
      console.error("Resume upload failed:", err);

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (loading) return;

    const file = e.dataTransfer?.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      processFile(file);
    }

    // Allows selecting the same file again
    e.target.value = "";
  };

  const openFilePicker = () => {
    if (!loading) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="mb-8 w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 animate-pulse text-cyan-400" />

          <h3
            className={`text-base font-bold ${
              darkMode ? "text-slate-100" : "text-slate-800"
            }`}
          >
            Auto-fill via Resume PDF Parser
          </h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase ${
            darkMode
              ? "border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              : "border border-cyan-200 bg-cyan-50 text-cyan-700 shadow-sm"
          }`}
        >
          Add-On AI Parser
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleChange}
        className="hidden"
        disabled={loading}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
        className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
          loading ? "cursor-wait" : "cursor-pointer"
        } ${
          dragActive
            ? darkMode
              ? "scale-[1.01] animate-pulse border-cyan-400 bg-cyan-950/40 shadow-[0_0_35px_rgba(6,182,212,0.3)]"
              : "scale-[1.01] border-cyan-500 bg-cyan-50/70"
            : parsedFile
            ? darkMode
              ? "border-emerald-500/60 bg-[#0c1626]/90 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
              : "border-emerald-400 bg-emerald-50/70 shadow-sm"
            : darkMode
            ? "border-slate-700/80 bg-[#0d1322]/80 hover:border-cyan-500/60 hover:bg-slate-900/90 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]"
            : "border-slate-300 bg-white hover:border-cyan-500 hover:bg-slate-50/90 hover:shadow-md"
        }`}
      >
        {loading ? (
          <div className="flex w-full flex-col items-center justify-center px-6 py-4">
            <div className="mb-3 flex items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />

              <span
                className={`text-base font-bold ${
                  darkMode ? "text-cyan-200" : "text-cyan-800"
                }`}
              >
                Parsing PDF Resume in memory…
              </span>
            </div>

            <div
              className={`my-2 h-2.5 w-full max-w-md overflow-hidden rounded-full border ${
                darkMode
                  ? "border-slate-700/60 bg-slate-800"
                  : "border-slate-300 bg-slate-200"
              }`}
            >
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.6)] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p
              className={`mt-1 text-xs font-semibold ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Extracting Projects, Internships, Coding & ATS scores (
              {progress}%)
            </p>
          </div>
        ) : parsedFile ? (
          <div className="flex w-full items-center justify-between gap-4 px-2 py-1">
            <div className="flex min-w-0 items-center gap-4 text-left">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                  darkMode
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "border-emerald-300 bg-emerald-100 text-emerald-700 shadow-sm"
                }`}
              >
                <FileText className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`break-all text-base font-bold ${
                      darkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    {parsedFile.name}
                  </p>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                      darkMode
                        ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                        : "border-emerald-200 bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Metrics Pre-filled
                  </span>
                </div>

                <p
                  className={`mt-1 text-xs font-semibold ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Projects:{" "}
                  <span className="metric-gradient font-bold">
                    {parsedFile.data.projects_count}
                  </span>
                  {" • "}Internships:{" "}
                  <span className="metric-gradient font-bold">
                    {parsedFile.data.internships_count}
                  </span>
                  {" • "}Coding Est:{" "}
                  <span className="metric-gradient font-bold">
                    {parsedFile.data.coding_score_est}/100
                  </span>
                  {" • "}ATS Score:{" "}
                  <span className="metric-gradient font-bold">
                    {parsedFile.data.resume_ats_score}%
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setParsedFile(null);
                setError("");

                if (inputRef.current) {
                  inputRef.current.value = "";
                  inputRef.current.click();
                }
              }}
              className="btn-glowing-secondary flex shrink-0 items-center gap-2 px-4 py-2 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-cyan-500" />
              Re-upload
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div
              className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors ${
                darkMode
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "border-cyan-200 bg-cyan-50 text-cyan-600 shadow-sm"
              }`}
            >
              <UploadCloud className="h-7 w-7" />
            </div>

            <p
              className={`text-base font-bold ${
                darkMode ? "text-slate-200" : "text-slate-800"
              }`}
            >
              Drag & Drop your Resume PDF here, or
            </p>

            <div className="mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePicker();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-cyan-400 hover:to-blue-500"
              >
                <FolderOpen className="h-4 w-4" />
                Browse Files
              </button>
            </div>

            <p
              className={`mt-3 text-xs font-medium ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Parses text to pre-fill Projects, Internships, Coding & ATS
              scores automatically (PDF only)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 shadow-md">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span className="break-words">{error}</span>
        </div>
      )}
    </div>
  );
}
