import { AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../lib/api-client";
import type { TokenResponse, UserPublic } from "../types/auth";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "./auth-api";

vi.mock("../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);

const USER: UserPublic = {
  id: 7,
  email: "an@example.com",
  full_name: "An Nguyen",
};

const TOKEN_RESPONSE: TokenResponse = {
  access_token: "access-token",
  token_type: "bearer",
  expires_in: 3600,
  user: USER,
};

function createAxiosError(status: number, data: unknown): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response = {
    data,
    status,
    statusText: "",
    headers: {},
    config,
  } as AxiosResponse;

  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_RESPONSE,
    config,
    undefined,
    response,
  );
}

describe("auth API", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it("logs in with the expected payload", async () => {
    mockedPost.mockResolvedValue({
      data: TOKEN_RESPONSE,
    } as AxiosResponse<TokenResponse>);

    const credentials = {
      email: "an@example.com",
      password: "correct-horse",
    };

    await expect(loginUser(credentials)).resolves.toEqual(TOKEN_RESPONSE);
    expect(mockedPost).toHaveBeenCalledWith("/auth/login", credentials);
  });

  it("registers a user without returning a token", async () => {
    mockedPost.mockResolvedValue({
      data: USER,
    } as AxiosResponse<UserPublic>);

    await expect(
      registerUser({
        email: "an@example.com",
        password: "correct-horse",
        full_name: "An Nguyen",
      }),
    ).resolves.toEqual(USER);

    expect(mockedPost).toHaveBeenCalledWith("/auth/register", {
      email: "an@example.com",
      password: "correct-horse",
      full_name: "An Nguyen",
    });
  });

  it("fetches the current user", async () => {
    mockedGet.mockResolvedValue({
      data: USER,
    } as AxiosResponse<UserPublic>);

    await expect(fetchCurrentUser()).resolves.toEqual(USER);
    expect(mockedGet).toHaveBeenCalledWith("/auth/me");
  });

  it("logs out with the captured token explicitly", async () => {
    mockedPost.mockResolvedValue({
      data: { message: "Successfully logged out" },
    } as AxiosResponse<{ message: string }>);

    await expect(logoutUser("captured-token")).resolves.toEqual({
      message: "Successfully logged out",
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/auth/logout",
      undefined,
      {
        headers: {
          Authorization: "Bearer captured-token",
        },
      },
    );
  });

  it("normalizes an invalid login", async () => {
    mockedPost.mockRejectedValue(
      createAxiosError(401, { detail: "Incorrect email or password" }),
    );

    await expect(
      loginUser({ email: "an@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Incorrect email or password.",
    });
  });

  it("normalizes a duplicate registration", async () => {
    mockedPost.mockRejectedValue(
      createAxiosError(409, { detail: "Email already registered" }),
    );

    await expect(
      registerUser({
        email: "an@example.com",
        password: "correct-horse",
        full_name: "An Nguyen",
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      message: "This email is already registered.",
    });
  });

  it("maps validation errors to form fields", async () => {
    mockedPost.mockRejectedValue(
      createAxiosError(422, {
        detail: [
          {
            loc: ["body", "email"],
            msg: "value is not a valid email address",
            type: "value_error",
          },
          {
            loc: ["body", "password"],
            msg: "String should have at least 8 characters",
            type: "string_too_short",
          },
        ],
      }),
    );

    await expect(
      registerUser({
        email: "not-an-email",
        password: "short",
        full_name: "An Nguyen",
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      fieldErrors: {
        email: "value is not a valid email address",
        password: "String should have at least 8 characters",
      },
    });
  });

  it("marks network failures without exposing the raw error", async () => {
    mockedGet.mockRejectedValue(
      new AxiosError("Network Error", AxiosError.ERR_NETWORK),
    );

    await expect(fetchCurrentUser()).rejects.toMatchObject({
      name: "ApiError",
      status: null,
      isNetworkError: true,
      message:
        "Unable to reach the server. Check your connection and try again.",
    });
  });
});
