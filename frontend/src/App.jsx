import Navbar from "./components/Navbar";
import AssessmentForm from "./pages/AssessmentForm";
import Dashboard from "./pages/Dashboard";
import { AssessmentProvider, useAssessment } from "./hooks/useAssessment";

function Shell() {
  const { page } = useAssessment();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{page === "dashboard" ? <Dashboard /> : <FormPage />}</main>
    </div>
  );
}

function FormPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">Final-year project</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Intelligent Placement Prediction and Career Recommendation
        </h1>
        <p className="mt-3 max-w-3xl text-slate-400">
          Academic, skill, and experience signals go into a trained classifier. Careers are ranked
          by skill-vector similarity. The LLM only explains those outputs.
        </p>
      </section>
      <AssessmentForm />
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
