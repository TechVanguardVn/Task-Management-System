import { AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../context/AuthContext";
import { apiClient } from "../lib/api-client";
import { storeAccessToken } from "../lib/token-storage";
import { appRoutes } from "../router";
import { fetchCurrentUser } from "../services/auth-api";
import type { UserPublic } from "../types/auth";

vi.mock("../services/auth-api", () => ({
  fetchCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  registerUser: vi.fn(),
}));

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const originalAdapter = apiClient.defaults.adapter;

const USER: UserPublic = {
  id: 7,
  email: "an@example.com",
  full_name: "An Nguyen",
};

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
    } as AxiosResponse,
  );
}

describe("DashboardPage authentication integration", () => {
  beforeEach(() => {
    mockedFetchCurrentUser.mockResolvedValue(USER);
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("leaves 401 responses to the existing session-expiry flow", async () => {
    storeAccessToken("stored-token");

    apiClient.defaults.adapter = async (config) => {
      if (config.url === "/dashboard/stats") {
        throw unauthorizedError(config);
      }

      return {
        data: {},
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/dashboard"],
    });

    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Return to your workspace",
      }),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/login"),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your session expired",
    );
    expect(window.localStorage.getItem("tms_access_token")).toBeNull();
  });
});
