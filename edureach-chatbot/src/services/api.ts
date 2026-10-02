import axios from "axios";

const API = axios.create({
  // Connects directly to backend on port 5000 with environment variable override support
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 60000, // 60s timeout accommodates local CPU LLM inference
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

export default API;
