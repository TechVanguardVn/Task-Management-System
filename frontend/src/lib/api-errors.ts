import axios from "axios";

export type AuthFieldName = "email" | "password" | "full_name";
export type TaskFieldName =
  | "title"
  | "description"
  | "status"
  | "priority"
  | "due_date";
export type ApiFieldName = AuthFieldName | TaskFieldName;
export type ApiFieldErrors = Partial<Record<ApiFieldName, string>>;
export type AuthFieldErrors = ApiFieldErrors;

interface ApiErrorInit {
  status?: number | null;
  fieldErrors?: ApiFieldErrors;
  isNetworkError?: boolean;
}

export class ApiError extends Error {
  readonly status: number | null;
  readonly fieldErrors: ApiFieldErrors;
  readonly isNetworkError: boolean;

  constructor(message: string, init: ApiErrorInit = {}) {
    super(message);
    this.name = "ApiError";
    this.status = init.status ?? null;
    this.fieldErrors = init.fieldErrors ?? {};
    this.isNetworkError = init.isNetworkError ?? false;
  }
}

const API_FIELDS = new Set<ApiFieldName>([
  "email",
  "password",
  "full_name",
  "title",
  "description",
  "status",
  "priority",
  "due_date",
]);

function isApiFieldName(value: unknown): value is ApiFieldName {
  return typeof value === "string" && API_FIELDS.has(value as ApiFieldName);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractValidationErrors(detail: unknown): ApiFieldErrors {
  if (!Array.isArray(detail)) {
    return {};
  }

  const fieldErrors: ApiFieldErrors = {};

  for (const item of detail) {
    if (!isRecord(item)) {
      continue;
    }

    const location = Array.isArray(item.loc) ? item.loc : [];
    const field = location.at(-1);
    const message = typeof item.msg === "string" ? item.msg : null;

    if (isApiFieldName(field) && message) {
      fieldErrors[field] = message;
    }
  }

  return fieldErrors;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new ApiError("Something went wrong. Please try again.");
  }

  if (!error.response) {
    return new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      { isNetworkError: true },
    );
  }

  const status = error.response.status;

  if (status === 401) {
    return new ApiError("Incorrect email or password.", { status });
  }

  if (status === 404) {
    return new ApiError("The requested task was not found.", { status });
  }

  if (status === 409) {
    return new ApiError("This email is already registered.", { status });
  }

  if (status === 422) {
    const detail = isRecord(error.response.data)
      ? error.response.data.detail
      : undefined;
    const fieldErrors = extractValidationErrors(detail);

    return new ApiError("Please check the highlighted fields and try again.", {
      status,
      fieldErrors,
    });
  }

  return new ApiError("Something went wrong. Please try again.", { status });
}
