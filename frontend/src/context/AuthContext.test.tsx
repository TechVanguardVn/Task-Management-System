import { StrictMode } from "react";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../lib/api-errors";
import {
  getStoredAccessToken,
  storeAccessToken,
} from "../lib/token-storage";
import type { TokenResponse, UserPublic } from "../types/auth";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/auth-api";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../services/auth-api", () => ({
  fetchCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  registerUser: vi.fn(),
}));

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedLoginUser = vi.mocked(loginUser);
const mockedLogoutUser = vi.mocked(logoutUser);
const mockedRegisterUser = vi.mocked(registerUser);

const USER: UserPublic = {
  id: 7,
  email: "an@example.com",
  full_name: "An Nguyen",
};

const LOGIN_RESPONSE: TokenResponse = {
  access_token: "new-token",
  token_type: "bearer",
  expires_in: 3600,
  user: USER,
};

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function StrictWrapper({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <AuthProvider>{children}</AuthProvider>
    </StrictMode>
  );
}

async function waitForLoaded(
  result: { current: ReturnType<typeof useAuth> },
): Promise<void> {
  await waitFor(() => expect(result.current.isLoading).toBe(false));
}

describe("AuthProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockedFetchCurrentUser.mockReset();
    mockedLoginUser.mockReset();
    mockedLogoutUser.mockReset();
    mockedRegisterUser.mockReset();
  });

  it("finishes loading without calling the API when no token is stored", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitForLoaded(result);

    expect(mockedFetchCurrentUser).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("restores a stored session and fetches the current user", async () => {
    storeAccessToken("stored-token");
    mockedFetchCurrentUser.mockResolvedValue(USER);

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
    expect(result.current.user).toEqual(USER);
    expect(result.current.accessToken).toBe("stored-token");
    expect(getStoredAccessToken()).toBe("stored-token");
  });

  it("clears an invalid stored token without showing a session warning", async () => {
    storeAccessToken("expired-token");
    mockedFetchCurrentUser.mockRejectedValue(
      new ApiError("Not authenticated", { status: 401 }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitForLoaded(result);

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.sessionExpired).toBe(false);
    expect(getStoredAccessToken()).toBeNull();
  });

  it("keeps the token after a network failure and allows a retry", async () => {
    storeAccessToken("stored-token");
    mockedFetchCurrentUser
      .mockRejectedValueOnce(
        new ApiError("Unable to reach the server.", {
          isNetworkError: true,
        }),
      )
      .mockResolvedValueOnce(USER);

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() =>
      expect(result.current.sessionError).toBe(
        "Unable to reach the server.",
      ),
    );

    expect(getStoredAccessToken()).toBe("stored-token");
    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.restoreSession();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(USER);
    expect(result.current.sessionError).toBeNull();
  });

  it("stores the token and user after login", async () => {
    mockedLoginUser.mockResolvedValue(LOGIN_RESPONSE);

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitForLoaded(result);

    await act(async () => {
      await result.current.login({
        email: "an@example.com",
        password: "correct-horse",
      });
    });

    expect(mockedLoginUser).toHaveBeenCalledWith({
      email: "an@example.com",
      password: "correct-horse",
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(USER);
    expect(result.current.accessToken).toBe("new-token");
    expect(getStoredAccessToken()).toBe("new-token");
  });

  it("does not authenticate after registration", async () => {
    mockedRegisterUser.mockResolvedValue(USER);

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitForLoaded(result);

    await act(async () => {
      await result.current.register({
        email: "an@example.com",
        password: "correct-horse",
        full_name: "An Nguyen",
      });
    });

    expect(mockedRegisterUser).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(getStoredAccessToken()).toBeNull();
  });

  it("clears local auth before confirming logout and ignores a failed request", async () => {
    storeAccessToken("stored-token");
    mockedFetchCurrentUser.mockResolvedValue(USER);
    mockedLogoutUser.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedLogoutUser).toHaveBeenCalledWith("stored-token");
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(getStoredAccessToken()).toBeNull();
  });

  it("clears local state immediately even while logout is pending", async () => {
    storeAccessToken("stored-token");
    mockedFetchCurrentUser.mockResolvedValue(USER);

    let resolveLogout: (() => void) | undefined;
    mockedLogoutUser.mockReturnValue(
      new Promise((resolve) => {
        resolveLogout = () =>
          resolve({ message: "Successfully logged out" });
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    let logoutPromise: Promise<void> | undefined;

    act(() => {
      logoutPromise = result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(getStoredAccessToken()).toBeNull();

    await act(async () => {
      resolveLogout?.();
      await logoutPromise;
    });
  });

  it("restores the session only once under StrictMode", async () => {
    storeAccessToken("stored-token");
    mockedFetchCurrentUser.mockResolvedValue(USER);

    const { result } = renderHook(() => useAuth(), {
      wrapper: StrictWrapper,
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("lets a successful login supersede an in-flight restore", async () => {
    storeAccessToken("stored-token");

    let resolveRestore: ((user: UserPublic) => void) | undefined;
    mockedFetchCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        resolveRestore = resolve;
      }),
    );

    const replacementUser: UserPublic = {
      id: 9,
      email: "new@example.com",
      full_name: "New User",
    };
    mockedLoginUser.mockResolvedValue({
      access_token: "replacement-token",
      token_type: "bearer",
      expires_in: 3600,
      user: replacementUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() =>
      expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      await result.current.login({
        email: "new@example.com",
        password: "correct-horse",
      });
    });

    await act(async () => {
      resolveRestore?.(USER);
      await Promise.resolve();
    });

    expect(result.current.user).toEqual(replacementUser);
    expect(result.current.accessToken).toBe("replacement-token");
    expect(getStoredAccessToken()).toBe("replacement-token");
  });

  it("lets logout supersede an in-flight restore", async () => {
    storeAccessToken("stored-token");

    let resolveRestore: ((user: UserPublic) => void) | undefined;
    mockedFetchCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        resolveRestore = resolve;
      }),
    );
    mockedLogoutUser.mockResolvedValue({
      message: "Successfully logged out",
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() =>
      expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      await result.current.logout();
    });

    await act(async () => {
      resolveRestore?.(USER);
      await Promise.resolve();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(getStoredAccessToken()).toBeNull();
  });
});
