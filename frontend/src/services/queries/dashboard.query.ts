import { useQuery } from '@tanstack/react-query'
import { getDashboardStatsAPI, getUpcomingTasksAPI, getWorkloadAPI } from '@/services/apis/dashboard.api'
import { QUERY_KEYS } from '@/constants/queryKeys'

export const useGetDashboardStatsQuery = (workspaceId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_STATS(workspaceId),
    queryFn: () => getDashboardStatsAPI(workspaceId),
    staleTime: 60 * 1000,
    enabled: !!workspaceId,
  })

export const useGetUpcomingTasksQuery = (workspaceId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_UPCOMING(workspaceId),
    queryFn: () => getUpcomingTasksAPI(workspaceId),
    staleTime: 60 * 1000,
    enabled: !!workspaceId,
  })

export const useGetWorkloadQuery = (workspaceId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_WORKLOAD(workspaceId),
    queryFn: () => getWorkloadAPI(workspaceId),
    staleTime: 60 * 1000,
    enabled: !!workspaceId,
    retry: false, // Don't retry on 403 Access Denied
  })
