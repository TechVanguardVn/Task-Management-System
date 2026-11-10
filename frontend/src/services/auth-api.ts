import { apiClient } from "../lib/api-client";
import { normalizeApiError } from "../lib/api-errors";
import type {
  LogoutResponse,
  TokenResponse,
  UserLogin,
  UserPublic,
  UserRegister,
} from "../types/auth";

async function request<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function loginUser(payload: UserLogin): Promise<TokenResponse> {
  return request(async () => {
    const response = await apiClient.post<TokenResponse>("/auth/login", payload);
    return response.data;
  });
}

export function registerUser(payload: UserRegister): Promise<UserPublic> {
  return request(async () => {
    const response = await apiClient.post<UserPublic>(
      "/auth/register",
      payload,
    );
    return response.data;
  });
}

export function fetchCurrentUser(): Promise<UserPublic> {
  return request(async () => {
    const response = await apiClient.get<UserPublic>("/auth/me");
    return response.data;
  });
}

export function logoutUser(accessToken: string): Promise<LogoutResponse> {
  return request(async () => {
    const response = await apiClient.post<LogoutResponse>(
      "/auth/logout",
      undefined,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.data;
  });
}
