export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No due date'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

export const checkIsOverdue = (dateString?: string): boolean => {
  if (!dateString) return false
  const date = new Date(dateString)
  return date.getTime() < new Date().getTime()
}
