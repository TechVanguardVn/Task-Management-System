import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import { normalizeApiError } from "../lib/api-errors";
import type { ApiError } from "../lib/api-errors";
import { getDashboardStats } from "../services/dashboard-api";
import type { DashboardStatsResponse } from "../types/dashboard";

export interface UseDashboardStatsResult {
  data: DashboardStatsResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useDashboardStats(): UseDashboardStatsResult {
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const executeRequest = useCallback(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    getDashboardStats(controller.signal)
      .then((result) => {
        if (requestIdRef.current !== requestId || controller.signal.aborted) {
          return;
        }

        setData(result);
        setIsLoading(false);
      })
      .catch((requestError: unknown) => {
        if (
          requestIdRef.current !== requestId ||
          controller.signal.aborted ||
          axios.isCancel(requestError)
        ) {
          return;
        }

        setError(normalizeApiError(requestError));
        setIsLoading(false);
      });
  }, []);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    executeRequest();
  }, [executeRequest]);

  useEffect(() => {
    executeRequest();

    return () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, [executeRequest]);

  return { data, isLoading, error, refetch };
}
