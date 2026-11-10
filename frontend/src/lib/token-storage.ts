export const ACCESS_TOKEN_STORAGE_KEY = "tms_access_token";

export function getStoredAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeAccessToken(token: string): void {
  try {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } catch {
    // The session still works in memory when storage is unavailable.
  }
}

export function clearStoredAccessToken(): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    // Nothing else to clear when storage is unavailable.
  }
}
