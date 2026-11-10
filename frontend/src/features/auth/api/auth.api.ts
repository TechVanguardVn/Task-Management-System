import { ApiError, apiFetch, setCsrfToken } from "../../../lib/api-client";
import type { AuthResponse, User } from "../../../types/auth.types";
import type { LoginFormValues, RegisterFormValues } from "../schemas/auth.schema";

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const data = await apiFetch<AuthResponse>("/auth/me");
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setCsrfToken(null);
      return null;
    }
    throw error;
  }
}

export async function loginWithEmail(values: LoginFormValues): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function registerWithEmail(values: RegisterFormValues): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function logoutCurrentSession(): Promise<void> {
  await apiFetch<{ status: string }>("/auth/logout", {
    method: "POST",
  });
  setCsrfToken(null);
}
