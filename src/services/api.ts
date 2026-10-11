import axios from "axios";

/**
 * Dynamically resolves the backend API URL:
 * - When running in the browser and accessed via a LAN IP (e.g., http://172.18.113.77:5173),
 *   if VITE_API_BASE_URL points to localhost/127.0.0.1, replace the loopback host with
 *   window.location.hostname so requests route to that host's backend port (5000).
 * - For production deployments (e.g., https://edureach-chatbot-007.vercel.app/api),
 *   the hostname is non-localhost so the configured production URL is preserved unchanged.
 */
export const resolveApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  if (typeof window !== "undefined" && window.location) {
    const currentHost = window.location.hostname;
    if (currentHost && currentHost !== "localhost" && currentHost !== "127.0.0.1") {
      try {
        const parsed = new URL(envUrl);
        if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
          parsed.hostname = currentHost;
          return parsed.toString().replace(/\/$/, "");
        }
      } catch {
        // Fallback to configured envUrl if URL parsing fails
      }
    }
  }

  return envUrl;
};

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 60000, // 60s timeout accommodates local CPU LLM inference
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.warn("[API Error]", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
    }
    return Promise.reject(error);
  }
);

export default API;