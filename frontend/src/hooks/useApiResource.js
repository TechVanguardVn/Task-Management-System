import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAccessToken } from '../api/tokenStore.js'
import {
  cacheVersion,
  readBlocked,
  scopedKey,
  subscribeCache,
} from '../query/client.js'
import { resourceState } from '../query/resourceState.js'

export function useApiResource(load, key, enabled = true) {
  useSyncExternalStore(subscribeCache, cacheVersion, cacheVersion)
  const blocked = readBlocked(key)
  const query = useQuery({
    queryKey: scopedKey(key),
    queryFn: ({ signal }) => load(signal),
    enabled: enabled && Boolean(getAccessToken()) && !blocked,
  })
  return { ...resourceState(query), retry: () => !blocked && query.refetch() }
}
