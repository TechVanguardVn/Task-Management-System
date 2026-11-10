import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AxiosError } from "axios";

import { setupApiInterceptors } from "../lib/api-client";
import { normalizeApiError } from "../lib/api-errors";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  storeAccessToken,
} from "../lib/token-storage";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/auth-api";
import type {
  AuthContextValue,
  UserLogin,
  UserPublic,
  UserRegister,
} from "../types/auth";

const AuthContext = createContext<AuthContextValue | null>(null);

function getRequestAccessToken(error: AxiosError): string | null {
  const authorization = error.config?.headers?.get("Authorization");

  if (typeof authorization !== "string") {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getStoredAccessToken(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const tokenRef = useRef<string | null>(accessToken);
  const restorePromiseRef = useRef<Promise<void> | null>(null);
  const authEpochRef = useRef(0);

  const clearLocalSession = useCallback(() => {
    tokenRef.current = null;
    clearStoredAccessToken();
    setUser(null);
    setAccessToken(null);
    setIsLoading(false);
    setSessionError(null);
  }, []);

  const handleUnauthorized = useCallback(
    (error: AxiosError) => {
      const failedToken = getRequestAccessToken(error);

      if (!failedToken || failedToken !== tokenRef.current) {
        return;
      }

      authEpochRef.current += 1;
      restorePromiseRef.current = null;
      clearLocalSession();
      setSessionExpired(true);
    },
    [clearLocalSession],
  );

  const restoreSession = useCallback((): Promise<void> => {
    if (restorePromiseRef.current) {
      return restorePromiseRef.current;
    }

    const storedToken = getStoredAccessToken();

    if (!storedToken) {
      authEpochRef.current += 1;
      clearLocalSession();
      setSessionExpired(false);
      return Promise.resolve();
    }

    const epoch = authEpochRef.current + 1;
    authEpochRef.current = epoch;
    tokenRef.current = storedToken;
    setAccessToken(storedToken);
    setIsLoading(true);
    setSessionError(null);

    const promise = (async () => {
      try {
        const currentUser = await fetchCurrentUser();

        if (
          authEpochRef.current !== epoch ||
          getStoredAccessToken() !== storedToken
        ) {
          return;
        }

        setUser(currentUser);
        setAccessToken(storedToken);
        setSessionError(null);
        setIsLoading(false);
      } catch (error) {
        if (authEpochRef.current !== epoch) {
          return;
        }

        const apiError = normalizeApiError(error);

        if (apiError.status === 401) {
          clearStoredAccessToken();
          tokenRef.current = null;
          setUser(null);
          setAccessToken(null);
          setIsLoading(false);
          setSessionError(null);
          setSessionExpired(false);
          return;
        }

        setUser(null);
        setAccessToken(storedToken);
        setIsLoading(false);
        setSessionError(
          apiError.isNetworkError
            ? apiError.message
            : "We could not restore your session. Try again.",
        );
      }
    })();

    restorePromiseRef.current = promise;
    void promise
      .finally(() => {
        if (restorePromiseRef.current === promise) {
          restorePromiseRef.current = null;
        }
      })
      .catch(() => {
        // The restore path handles and reports its own errors.
      });

    return promise;
  }, [clearLocalSession]);

  const login = useCallback(async (credentials: UserLogin): Promise<UserPublic> => {
    authEpochRef.current += 1;
    restorePromiseRef.current = null;

    try {
      const response = await loginUser(credentials);

      tokenRef.current = response.access_token;
      storeAccessToken(response.access_token);
      setAccessToken(response.access_token);
      setUser(response.user);
      setIsLoading(false);
      setSessionError(null);
      setSessionExpired(false);

      return response.user;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(
    async (payload: UserRegister): Promise<UserPublic> =>
      registerUser(payload),
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    authEpochRef.current += 1;
    restorePromiseRef.current = null;

    const token = tokenRef.current ?? getStoredAccessToken();
    clearLocalSession();
    setSessionExpired(false);

    if (!token) {
      return;
    }

    try {
      await logoutUser(token);
    } catch {
      // Local sign-out is complete even if the confirmation request fails.
    }
  }, [clearLocalSession]);

  useEffect(() => {
    return setupApiInterceptors({
      getToken: () => tokenRef.current,
      onUnauthorized: handleUnauthorized,
    });
  }, [handleUnauthorized]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void restoreSession();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: accessToken !== null && user !== null,
      isLoading,
      sessionError,
      sessionExpired,
      login,
      register,
      logout,
      restoreSession,
    }),
    [
      accessToken,
      isLoading,
      login,
      logout,
      register,
      restoreSession,
      sessionError,
      sessionExpired,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
