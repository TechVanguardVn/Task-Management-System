import { useCallback, useEffect, useState } from 'react'
import { getTasks, type TaskQuery } from '../api/tasks'
import type { TaskPage } from '../types'

export function useTasks(query: TaskQuery) {
  const [data, setData] = useState<TaskPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = useCallback(async () => { setLoading(true); setError(''); try { setData(await getTasks(query)) } catch { setError('Không thể tải danh sách công việc.') } finally { setLoading(false) } }, [query])
  useEffect(() => { void reload() }, [reload])
  return { data, loading, error, reload, setData }
}
