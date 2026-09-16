import axios, { type InternalAxiosRequestConfig, AxiosError } from "axios";
import { getStoredToken, removeStoredToken } from "./token.ts";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
// Clean trailing slash if present
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: inject Authorization: Bearer <token>
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle 401 Unauthorized for protected endpoints
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      // Don't purge token if the 401 was from an explicit login attempt with invalid credentials
      const isLoginRequest = requestUrl.includes("/auth/login");
      if (!isLoginRequest) {
        removeStoredToken();
      }
    }
    return Promise.reject(error);
  }
);
