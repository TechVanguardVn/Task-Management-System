import { useGetDashboardStatsQuery, useGetUpcomingTasksQuery, useGetWorkloadQuery } from '@/services/queries/dashboard.query'

export const useDashboard = (workspaceId: string) => {
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useGetDashboardStatsQuery(workspaceId)
  const { data: upcomingTasks, isLoading: isLoadingUpcoming, refetch: refetchUpcoming } = useGetUpcomingTasksQuery(workspaceId)
  const { data: workload, isLoading: isLoadingWorkload, refetch: refetchWorkload } = useGetWorkloadQuery(workspaceId)

  const isLoading = isLoadingStats || isLoadingUpcoming || isLoadingWorkload

  const refetchAll = () => {
    refetchStats()
    refetchUpcoming()
    refetchWorkload()
  }

  return {
    data: {
      stats,
      upcomingTasks: upcomingTasks || [],
      workload: workload || [],
    },
    isLoading,
    refetchAll
  }
}
