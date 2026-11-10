import { useEffect } from "react";
import { AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router";
import type { RouteObject } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { apiClient } from "./lib/api-client";
import { ApiError } from "./lib/api-errors";
import { storeAccessToken } from "./lib/token-storage";
import { LoginPage } from "./pages/LoginPage";
import { appRoutes } from "./router";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "./services/auth-api";
import type { TokenResponse, UserPublic } from "./types/auth";

vi.mock("./services/auth-api", () => ({
  fetchCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  registerUser: vi.fn(),
}));

vi.mock("./services/dashboard-api", () => ({
  getDashboardStats: vi.fn().mockResolvedValue({
    total_tasks: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
    todo_tasks: 0,
    upcoming_deadlines: [],
  }),
}));

vi.mock("./services/tasks-api", () => ({
  listTasks: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0,
  }),
}));

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedLoginUser = vi.mocked(loginUser);
const mockedLogoutUser = vi.mocked(logoutUser);
const mockedRegisterUser = vi.mocked(registerUser);

const originalAdapter = apiClient.defaults.adapter;

const USER: UserPublic = {
  id: 7,
  email: "an@example.com",
  full_name: "An Nguyen",
};

const LOGIN_RESPONSE: TokenResponse = {
  access_token: "access-token",
  token_type: "bearer",
  expires_in: 3600,
  user: USER,
};

function renderApp(initialEntry: string) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  });

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );

  return router;
}

function unauthorizedError(config: InternalAxiosRequestConfig): AxiosError {
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

function ProtectedProbe() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void Promise.allSettled([
      apiClient.get("/tasks"),
      apiClient.get("/dashboard/stats"),
    ]);
  }, [isAuthenticated]);

  return <h1>Protected probe</h1>;
}

beforeEach(() => {
  mockedFetchCurrentUser.mockResolvedValue(USER);
  mockedLoginUser.mockResolvedValue(LOGIN_RESPONSE);
  mockedRegisterUser.mockResolvedValue(USER);
  mockedLogoutUser.mockResolvedValue({
    message: "Successfully logged out",
  });
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe("application routes", () => {
  it("redirects an unauthenticated protected route and returns after login", async () => {
    const user = userEvent.setup();
    const router = renderApp("/tasks");

    expect(
      await screen.findByRole("heading", {
        name: "Return to your workspace",
      }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toMatchObject({ from: "/tasks" });

    await user.type(screen.getByLabelText("Email"), "an@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("heading", { name: "Quản lý công việc" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/tasks");
  });

  it("redirects an unauthenticated kanban route and returns after login", async () => {
    const user = userEvent.setup();
    const router = renderApp("/kanban");

    expect(
      await screen.findByRole("heading", {
        name: "Return to your workspace",
      }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toMatchObject({ from: "/kanban" });

    await user.type(screen.getByLabelText("Email"), "an@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("heading", { name: "Bảng Kanban" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/kanban");
  });

  it("renders the kanban page for authenticated users at /kanban", async () => {
    storeAccessToken("stored-token");
    const router = renderApp("/kanban");

    expect(
      await screen.findByRole("heading", { name: "Bảng Kanban" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/kanban");
  });

  it("toggles login password visibility without submitting or losing the value", async () => {
    const user = userEvent.setup();
    renderApp("/login");

    await screen.findByRole("heading", {
      name: "Return to your workspace",
    });

    const passwordInput = screen.getByLabelText("Password");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute(
      "autocomplete",
      "current-password",
    );

    await user.type(passwordInput, "correct-horse");

    const showButton = screen.getByRole("button", {
      name: "Show password",
    });

    expect(showButton).toHaveAttribute("type", "button");
    expect(showButton).toHaveAttribute("aria-pressed", "false");

    await user.click(showButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(passwordInput).toHaveValue("correct-horse");

    const hideButton = screen.getByRole("button", {
      name: "Hide password",
    });

    expect(hideButton).toHaveAttribute("aria-pressed", "true");
    expect(mockedLoginUser).not.toHaveBeenCalled();

    await user.click(hideButton);

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveValue("correct-horse");
    expect(mockedLoginUser).not.toHaveBeenCalled();
  });

  it("shows an inline invalid-credentials error without redirecting", async () => {
    const user = userEvent.setup();
    mockedLoginUser.mockRejectedValue(
      new ApiError("Incorrect email or password.", { status: 401 }),
    );

    const router = renderApp("/login");

    await screen.findByRole("heading", {
      name: "Return to your workspace",
    });

    await user.type(screen.getByLabelText("Email"), "an@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password.",
    );
    expect(router.state.location.pathname).toBe("/login");
    expect(window.localStorage.getItem("tms_access_token")).toBeNull();
  });

  it("redirects an authenticated user away from the login page", async () => {
    storeAccessToken("stored-token");
    const router = renderApp("/login");

    expect(
      await screen.findByRole("heading", { name: "Bảng điều khiển" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/dashboard");
  });

  it("renders a recoverable screen when session restoration fails offline", async () => {
    storeAccessToken("stored-token");
    mockedFetchCurrentUser
      .mockRejectedValueOnce(
        new ApiError(
          "Unable to reach the server. Check your connection and try again.",
          { isNetworkError: true },
        ),
      )
      .mockResolvedValueOnce(USER);

    const user = userEvent.setup();
    renderApp("/tasks");

    expect(
      await screen.findByRole("heading", {
        name: "We could not restore your session",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to reach the server/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "Quản lý công việc" }),
    ).toBeInTheDocument();
  });

  it("registers without auto-login and shows a login success notice", async () => {
    const user = userEvent.setup();
    const router = renderApp("/register");

    expect(
      await screen.findByRole("heading", {
        name: "Create your workspace",
      }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Full name"), "An Nguyen");
    await user.type(screen.getByLabelText("Email"), "an@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(
      screen.getByRole("button", { name: "Create account" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Return to your workspace",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Account created",
    );
    expect(router.state.location.pathname).toBe("/login");
    expect(window.localStorage.getItem("tms_access_token")).toBeNull();
  });

  it("toggles registration password visibility without submitting or losing the value", async () => {
    const user = userEvent.setup();
    renderApp("/register");

    await screen.findByRole("heading", {
      name: "Create your workspace",
    });

    const passwordInput = screen.getByLabelText("Password");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("autocomplete", "new-password");

    await user.type(passwordInput, "correct-horse");

    await user.click(
      screen.getByRole("button", { name: "Show password" }),
    );

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(passwordInput).toHaveValue("correct-horse");
    expect(mockedRegisterUser).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Hide password" }),
    );

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveValue("correct-horse");
    expect(mockedRegisterUser).not.toHaveBeenCalled();
  });

  it("shows a duplicate-email error on the registration form", async () => {
    const user = userEvent.setup();
    mockedRegisterUser.mockRejectedValue(
      new ApiError("This email is already registered.", { status: 409 }),
    );

    const router = renderApp("/register");

    await screen.findByRole("heading", {
      name: "Create your workspace",
    });

    await user.type(screen.getByLabelText("Full name"), "An Nguyen");
    await user.type(screen.getByLabelText("Email"), "an@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(
      screen.getByRole("button", { name: "Create account" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This email is already registered.",
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(router.state.location.pathname).toBe("/register");
    expect(window.localStorage.getItem("tms_access_token")).toBeNull();
  });

  it("shows the not-found page for unknown routes", async () => {
    renderApp("/missing");

    expect(
      await screen.findByRole("heading", {
        name: "This page is not on the map.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to sign in" }),
    ).toHaveAttribute("href", "/login");
  });

  it("clears a session once on protected 401 responses and preserves the return path", async () => {
    storeAccessToken("stored-token");

    apiClient.defaults.adapter = async (config) => {
      throw unauthorizedError(config);
    };

    const routes: RouteObject[] = [
      {
        element: <PublicRoute />,
        children: [{ path: "login", element: <LoginPage /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [{ path: "protected", element: <ProtectedProbe /> }],
      },
    ];

    const router = createMemoryRouter(routes, {
      initialEntries: ["/protected"],
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

    expect(router.state.location.state).toMatchObject({
      from: "/protected",
    });
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your session expired",
    );
    expect(window.localStorage.getItem("tms_access_token")).toBeNull();
  });
});
