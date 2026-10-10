import { useState, useEffect } from 'react'
import { DashboardHeader } from './components/DashboardHeader/DashboardHeader'
import { StatCards } from './components/StatCards/StatCards'
import { StatusChart } from './components/Charts/StatusChart/StatusChart'
import { PriorityChart } from './components/Charts/PriorityChart/PriorityChart'
import { UpcomingTasks } from './components/UpcomingTasks/UpcomingTasks'
import { ResourceWorkload } from './components/ResourceWorkload/ResourceWorkload'
import { useDashboard } from './hooks/useDashboard'
import { useGetWorkspacesQuery } from '@/services/queries/workspace.query'

export default function DashboardPage() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('')
  
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useGetWorkspacesQuery({ limit: 50 })
  const workspaces = workspacesData?.data?.items || []

  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(workspaces[0]._id)
    }
  }, [workspaces, selectedWorkspace])

  const { data, isLoading, refetchAll } = useDashboard(selectedWorkspace)
  const mappedWorkspaces = workspaces.map((ws: any) => ({ id: ws._id, name: ws.name }))
  const isGlobalLoading = isLoading || isLoadingWorkspaces || !selectedWorkspace || !data.stats

  return (
    <div className="relative w-full min-h-screen bg-slate-50/50">
      <div className="absolute -top-32 -left-20 w-[520px] h-[520px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute top-80 right-[-100px] w-[620px] h-[620px] bg-gradient-to-bl from-blue-500/10 via-indigo-400/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
        <DashboardHeader 
          isLoading={isLoadingWorkspaces}
          workspaceId={selectedWorkspace}
          workspaces={mappedWorkspaces}
          onWorkspaceChange={setSelectedWorkspace}
          onRefresh={refetchAll}
        />

        <StatCards stats={data.stats as any} isLoading={isGlobalLoading} />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isGlobalLoading ? (
            <>
              <div className="h-[420px] bg-white/50 animate-pulse rounded-3xl" />
              <div className="h-[420px] bg-white/50 animate-pulse rounded-3xl" />
            </>
          ) : (
            <>
              <StatusChart stats={data.stats as any} />
              <PriorityChart stats={data.stats as any} />
            </>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isGlobalLoading ? (
            <>
              <div className="h-[400px] bg-white/50 animate-pulse rounded-3xl" />
              <div className="h-[400px] bg-white/50 animate-pulse rounded-3xl" />
            </>
          ) : (
            <>
              <UpcomingTasks tasks={data.upcomingTasks} isLoading={false} />
              <ResourceWorkload workload={data.workload} isLoading={false} workspaceId={selectedWorkspace} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
