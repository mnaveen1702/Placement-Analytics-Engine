import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "",
  timeout: 45000,
  headers: { "Content-Type": "application/json" },
});

export async function getHealth() {
  const { data } = await client.get("/api/health");
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

export function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    "Request failed. Confirm the FastAPI server is running on port 8000."
  );
}
