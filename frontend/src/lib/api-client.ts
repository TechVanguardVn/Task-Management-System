import type { ApiErrorPayload, ApiFieldError } from "../types/auth.types";

const CSRF_COOKIE_NAME = "tms_csrf";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let currentCsrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  currentCsrfToken = token;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }

  for (const part of document.cookie.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = part.slice(0, separatorIndex).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }
  }

  return null;
}

export function getCsrfToken(): string | null {
  return currentCsrfToken ?? readCookie(CSRF_COOKIE_NAME);
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiFieldError[];

  constructor(status: number, code: string, message: string, details?: ApiFieldError[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "INVALID_CREDENTIALS":
        return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
      case "EMAIL_ALREADY_EXISTS":
        return "Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.";
      case "CSRF_INVALID":
      case "CSRF_ORIGIN_MISMATCH":
        return "Phiên bảo mật đã thay đổi. Vui lòng tải lại trang và thử lại.";
      case "UNAUTHORIZED":
        return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      default:
        return error.message || "Không thể xử lý yêu cầu lúc này.";
    }
  }

  if (error instanceof Error) {
    return "Không thể kết nối tới máy chủ. Vui lòng thử lại sau.";
  }

  return "Đã xảy ra lỗi không xác định.";
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (MUTATING_METHODS.has(method)) {
    let csrfToken = getCsrfToken();
    if (!csrfToken && !path.endsWith("/auth/login") && !path.endsWith("/auth/register")) {
      const csrfRes = await fetch("/api/v1/auth/csrf", {
        method: "GET",
        credentials: "include",
      });
      if (csrfRes.ok) {
        const csrfData = (await csrfRes.json()) as { csrfToken?: string };
        if (csrfData.csrfToken) {
          setCsrfToken(csrfData.csrfToken);
          csrfToken = csrfData.csrfToken;
        }
      }
    }

    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const response = await fetch(`/api/v1${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? ((await response.json()) as unknown) : null;

  if (!response.ok) {
    const errPayload = (payload ?? {}) as ApiErrorPayload;
    throw new ApiError(
      response.status,
      errPayload.error?.code ?? "REQUEST_FAILED",
      errPayload.error?.message ?? "Request failed.",
      errPayload.error?.details,
    );
  }

  if (
    payload &&
    typeof payload === "object" &&
    "csrfToken" in payload &&
    typeof (payload as { csrfToken?: unknown }).csrfToken === "string"
  ) {
    setCsrfToken((payload as { csrfToken: string }).csrfToken);
  }

  return payload as T;
}
