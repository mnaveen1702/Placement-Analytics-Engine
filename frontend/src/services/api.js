import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "",
  timeout: 90000,
  headers: { "Content-Type": "application/json" },
});

export async function getHealth() {
  const { data } = await client.get("/api/health");
  return data;
}

export async function getDemoData() {
  const { data } = await client.get("/api/demo-data");
  return data;
}

export async function predictPlacement(payload) {
  const { data } = await client.post("/api/predict", payload);
  return data;
}

export async function recommendCareers(payload) {
  const { data } = await client.post("/api/recommend-careers", payload);
  return data;
}

export async function askAdvisor(payload) {
  const { data } = await client.post("/api/ai-advisor", payload);
  return data;
}

export async function parseResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await client.post("/api/parse-resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join("; ");
  }
  return detail || error?.message || "Request failed. Is the API running on port 8000?";
}
