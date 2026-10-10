import type { DashboardStats } from '../types/dashboard.types'

export const calculateChartPercentages = (total: number, counts: number[]) => {
  return counts.map(count => total === 0 ? 0 : count / total)
}

export const getPriorityPeak = (priorityCounts: DashboardStats['priorityCounts'], total: number) => {
  const peakVal = Math.max(priorityCounts.LOW, priorityCounts.MEDIUM, priorityCounts.HIGH, priorityCounts.URGENT)
  let peakLabel = ''
  let peakPct = 0
  
  if (total > 0) {
    if (peakVal === priorityCounts.URGENT) {
      peakLabel = 'Urgent Complexity'
      peakPct = (priorityCounts.URGENT / total) * 100
    } else if (peakVal === priorityCounts.HIGH) {
      peakLabel = 'High Complexity'
      peakPct = (priorityCounts.HIGH / total) * 100
    } else if (peakVal === priorityCounts.MEDIUM) {
      peakLabel = 'Medium Complexity'
      peakPct = (priorityCounts.MEDIUM / total) * 100
    } else {
      peakLabel = 'Low Complexity'
      peakPct = (priorityCounts.LOW / total) * 100
    }
  }

  return { peakLabel, peakPct }
}
