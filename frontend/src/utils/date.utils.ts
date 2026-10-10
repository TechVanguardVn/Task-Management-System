import dayjs from 'dayjs'

export const formatDate = (date: string | undefined): string => {
  if (!date) return '—'
  return dayjs(date).format('DD/MM/YYYY')
}

export const formatDateTime = (date: string | undefined): string => {
  if (!date) return '—'
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

export const isBeforeToday = (date: string): boolean => {
  return dayjs(date).isBefore(dayjs(), 'day')
}

export const isWithinDays = (date: string, days: number): boolean => {
  const target = dayjs(date)
  return target.isAfter(dayjs()) && target.isBefore(dayjs().add(days, 'day'))
}
