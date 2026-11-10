import { AxiosError } from "axios";
import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient, setupApiInterceptors } from "./api-client";

const originalAdapter = apiClient.defaults.adapter;
let cleanupInterceptors: (() => void) | undefined;

function successResponse(
  config: InternalAxiosRequestConfig,
): AxiosResponse {
  return {
    data: { ok: true },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
}

function unauthorizedError(
  config: InternalAxiosRequestConfig,
): AxiosError {
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    {
      data: { detail: "Not authenticated" },
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config,
    },
  );
}

afterEach(() => {
  cleanupInterceptors?.();
  cleanupInterceptors = undefined;
  apiClient.defaults.adapter = originalAdapter;
});

describe("api client auth bridge", () => {
  it("attaches the current bearer token to protected requests", async () => {
    let capturedConfig: InternalAxiosRequestConfig | undefined;

    apiClient.defaults.adapter = async (config) => {
      capturedConfig = config;
      return successResponse(config);
    };

    cleanupInterceptors = setupApiInterceptors({
      getToken: () => "session-token",
      onUnauthorized: vi.fn(),
    });

    await apiClient.get("/tasks");

    expect(capturedConfig?.headers.get("Authorization")).toBe(
      "Bearer session-token",
    );
  });

  it("does not overwrite an explicit authorization header", async () => {
    let capturedConfig: InternalAxiosRequestConfig | undefined;

    apiClient.defaults.adapter = async (config) => {
      capturedConfig = config;
      return successResponse(config);
    };

    cleanupInterceptors = setupApiInterceptors({
      getToken: () => "session-token",
      onUnauthorized: vi.fn(),
    });

    await apiClient.get("/auth/logout", {
      headers: { Authorization: "Bearer explicit-token" },
    });

    expect(capturedConfig?.headers.get("Authorization")).toBe(
      "Bearer explicit-token",
    );
  });

  it("reports protected 401 responses", async () => {
    const onUnauthorized = vi.fn();

    apiClient.defaults.adapter = async (config) => {
      throw unauthorizedError(config);
    };

    cleanupInterceptors = setupApiInterceptors({
      getToken: () => "session-token",
      onUnauthorized,
    });

    await expect(apiClient.get("/tasks")).rejects.toBeInstanceOf(AxiosError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("ignores 401 responses from auth endpoints", async () => {
    const onUnauthorized = vi.fn();

    apiClient.defaults.adapter = async (config) => {
      throw unauthorizedError(config);
    };

    cleanupInterceptors = setupApiInterceptors({
      getToken: () => "session-token",
      onUnauthorized,
    });

    await expect(
      apiClient.post("/auth/login", {
        email: "an@example.com",
        password: "wrong",
      }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("replaces an existing setup instead of duplicating handlers", async () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    apiClient.defaults.adapter = async (config) => {
      throw unauthorizedError(config);
    };

    setupApiInterceptors({
      getToken: () => "session-token",
      onUnauthorized: firstHandler,
    });
    cleanupInterceptors = setupApiInterceptors({
      getToken: () => "session-token",
      onUnauthorized: secondHandler,
    });

    await expect(apiClient.get("/tasks")).rejects.toBeInstanceOf(AxiosError);

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });

  it("removes handlers when cleaned up", async () => {
    const onUnauthorized = vi.fn();

    cleanupInterceptors = setupApiInterceptors({
      getToken: () => "session-token",
      onUnauthorized,
    });
    cleanupInterceptors();
    cleanupInterceptors = undefined;

    apiClient.defaults.adapter = async (config) => {
      throw unauthorizedError(config);
    };

    await expect(apiClient.get("/tasks")).rejects.toBeInstanceOf(AxiosError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
