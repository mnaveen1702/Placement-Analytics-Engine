
import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "",
  timeout: 90000,
  headers: { "Content-Type": "application/json" },
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

// Resume PDF upload
export async function parseResume(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await client.post(
    "/api/parse-resume",
    formData
  );

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
