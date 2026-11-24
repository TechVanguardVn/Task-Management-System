import { QueryClient } from '@tanstack/react-query'
import { subscribeToToken } from '../api/tokenStore.js'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnWindowFocus: false,
      retry: (count, error) =>
        count < 1 && !error?.response?.status && error?.code !== 'ERR_CANCELED',
    },
    mutations: { retry: false },
  },
})
let generation = 0
let version = 0
const listeners = new Set()
export const pendingWrites = new Map()
export const subscribeCache = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const cacheVersion = () => version
export const sessionGeneration = () => generation
export const scopedKey = (key) => ['session', generation, ...key]
export function publishCache() {
  version += 1
  listeners.forEach((listener) => listener())
}
subscribeToToken(() => {
  generation += 1
  pendingWrites.forEach((write) => write.controller.abort())
  pendingWrites.clear()
  void queryClient.cancelQueries()
  queryClient.clear()
  publishCache()
})
export function readBlocked(key) {
  return [...pendingWrites.values()].some((write) => {
    if (key[0] === 'dashboard') return true
    if (key[0] === 'projects') return write.kind === 'project'
    return (
      key[0] === 'tasks' &&
      (key[1] === 'detail'
        ? write.id === key[2] || write.kind === 'project'
        : write.projects.includes(key[2]))
    )
  })
}
