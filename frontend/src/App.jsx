import Navbar from "./components/Navbar";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import { AssessmentProvider, useAssessment } from "./hooks/useAssessment";

function Shell() {
  const { page, darkMode } = useAssessment();
  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      darkMode ? "bg-[#0a0f1d] text-slate-100" : "bg-slate-100 text-slate-900"
    }`}>
      <Navbar />
      <main className="w-full">{page === "dashboard" ? <Dashboard /> : <Assessment />}</main>
    </div>
  );
}

export default function App() {
  return (
    <AssessmentProvider>
      <Shell />
    </AssessmentProvider>
  );
}
