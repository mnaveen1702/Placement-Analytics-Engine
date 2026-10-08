import Navbar from "./components/Navbar";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import { AssessmentProvider, useAssessment } from "./hooks/useAssessment";

function Shell() {
  const { page } = useAssessment();
  return (
    <div className="min-h-screen w-full">
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
