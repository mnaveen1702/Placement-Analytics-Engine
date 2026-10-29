
import axios from "axios";

// VITE_API_BASE must be set to the backend URL in production:
//   https://placement-analytics-engine-1.onrender.com
// Without it, requests fall back to the same origin (Vercel) and 404.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "",
  timeout: 90000,
  // NOTE: Do NOT set a global Content-Type here.
  // Axios must be free to auto-set multipart/form-data (with boundary) for
  // FormData uploads.  A hardcoded application/json default would override
  // that and cause FastAPI to return HTTP 422 for /api/parse-resume.
});

// Request interceptor: when the body is FormData, remove any Content-Type
// header so the browser sets the correct multipart/form-data boundary.
client.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Health check
export async function getHealth() {
  const { data } = await client.get("/api/health");
  return data;
}

// Demo data
export async function getDemoData() {
  const { data } = await client.get("/api/demo-data");
  return data;
}

// Placement prediction
export async function predictPlacement(payload) {
  const { data } = await client.post("/api/predict", payload);
  return data;
}

// Career recommendations
export async function recommendCareers(payload) {
  const { data } = await client.post("/api/recommend-careers", payload);
  return data;
}

// AI advisor
export async function askAdvisor(payload) {
  const { data } = await client.post("/api/ai-advisor", payload);
  return data;
}

// Resume PDF upload — sends the actual File object via multipart/form-data.
// The field name "file" matches the FastAPI UploadFile parameter.
export async function parseResume(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await client.post("/api/parse-resume", formData);

  return data;
}



// Error message handler
export function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || JSON.stringify(item))
      .join("; ");
  }

  return (
    detail ||
    error?.message ||
    "Request failed. Please check your internet connection and API URL."
  );
}
