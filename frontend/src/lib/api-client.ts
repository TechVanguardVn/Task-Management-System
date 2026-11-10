import axios from "axios";
import type { AxiosError } from "axios";

const DEFAULT_BASE_URL = "/api/v1";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = configuredBaseUrl || DEFAULT_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/me",
  "/auth/logout",
] as const;

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return AUTH_ENDPOINTS.some((path) => url === path || url.includes(path));
}

export interface ApiInterceptorHandlers {
  getToken: () => string | null;
  onUnauthorized: (error: AxiosError) => void;
}

let requestInterceptorId: number | null = null;
let responseInterceptorId: number | null = null;

function ejectInterceptors(): void {
  if (requestInterceptorId !== null) {
    apiClient.interceptors.request.eject(requestInterceptorId);
    requestInterceptorId = null;
  }

  if (responseInterceptorId !== null) {
    apiClient.interceptors.response.eject(responseInterceptorId);
    responseInterceptorId = null;
  }
}

export function setupApiInterceptors({
  getToken,
  onUnauthorized,
}: ApiInterceptorHandlers): () => void {
  ejectInterceptors();

  requestInterceptorId = apiClient.interceptors.request.use((config) => {
    const token = getToken();

    if (token && !config.headers.has("Authorization")) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  });

  responseInterceptorId = apiClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (!isAuthEndpoint(error.config?.url)) {
          try {
            onUnauthorized(error);
          } catch {
            // A handler failure must not replace the original API error.
          }
        }
      }

      return Promise.reject(error);
    },
  );

  let active = true;

  return () => {
    if (!active) {
      return;
    }

    active = false;
    ejectInterceptors();
  };
}
