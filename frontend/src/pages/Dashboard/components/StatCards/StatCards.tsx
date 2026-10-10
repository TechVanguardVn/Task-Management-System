import { Skeleton } from 'antd'
import { TotalTasksCard } from './components/TotalTasksCard'
import { ActiveTasksCard } from './components/ActiveTasksCard'
import { CompletionCard } from './components/CompletionCard'
import { OverdueCard } from './components/OverdueCard'
import type { DashboardStats } from '../../types/dashboard.types'

interface Props {
  stats?: DashboardStats
  isLoading: boolean
}

export const StatCards = ({ stats, isLoading }: Props) => {
  if (isLoading || !stats) {
    return (
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton.Button key={i} active style={{ height: 160, borderRadius: 16 }} className="!w-full" />
        ))}
      </section>
    )
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <TotalTasksCard total={stats.total} />
      <ActiveTasksCard total={stats.total} activeCount={stats.statusCounts.IN_PROGRESS} />
      <CompletionCard total={stats.total} doneCount={stats.statusCounts.DONE} completionRate={stats.completionRate} />
      <OverdueCard overdueCount={stats.overdueCount} />
    </section>
  )
}
