import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { GetTasksQuery } from '@/pages/Tasks/types/task.types'
import { useDebounce } from '@/hooks/useDebounce'

const DEFAULT_FILTER: Omit<GetTasksQuery, 'workspaceId'> = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

export function useTaskFilter(defaultWorkspaceId: string) {
  const [searchParams, setSearchParams] = useSearchParams()
  const workspaceId = searchParams.get('workspaceId') || defaultWorkspaceId

  const initialSearch = searchParams.get('search') || ''
  const [rawSearch, setRawSearch] = useState(initialSearch)
  const debouncedSearch = useDebounce(rawSearch, 500)

  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (currentSearch !== debouncedSearch) {
      const newParams = new URLSearchParams(searchParams)
      if (debouncedSearch) {
        newParams.set('search', debouncedSearch)
      } else {
        newParams.delete('search')
      }
      newParams.set('page', '1') // Reset page on search change
      setSearchParams(newParams, { replace: true })
    }
  }, [debouncedSearch]) // Only depend on debouncedSearch to avoid loop

  const page = Number(searchParams.get('page')) || DEFAULT_FILTER.page!
  const limit = Number(searchParams.get('limit')) || DEFAULT_FILTER.limit!
  const sortBy = (searchParams.get('sortBy') || DEFAULT_FILTER.sortBy) as GetTasksQuery['sortBy']
  const sortOrder = (searchParams.get('sortOrder') || DEFAULT_FILTER.sortOrder) as GetTasksQuery['sortOrder']
  const status = searchParams.get('status') as GetTasksQuery['status'] | undefined
  const priority = searchParams.get('priority') as GetTasksQuery['priority'] | undefined
  const tags = searchParams.get('tags') || undefined

  const queryParams: GetTasksQuery = useMemo(() => {
    return {
      workspaceId,
      page,
      limit,
      sortBy,
      sortOrder,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(tags && { tags }),
      ...(debouncedSearch && { search: debouncedSearch }),
    }
  }, [workspaceId, page, limit, sortBy, sortOrder, status, priority, tags, debouncedSearch])

  const setSearch = useCallback((value: string) => {
    setRawSearch(value)
  }, [])

  const setFilter = useCallback(
    (key: keyof GetTasksQuery, value: GetTasksQuery[typeof key]) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value) {
          next.set(key, String(value))
        } else {
          next.delete(key)
        }
        if (key !== 'page') next.set('page', '1') // Reset page on filter change
        return next
      })
    },
    [setSearchParams]
  )

  const resetFilters = useCallback(() => {
    setRawSearch('')
    setSearchParams({})
  }, [setSearchParams])

  return { rawSearch, queryParams, setSearch, setFilter, resetFilters }
}
