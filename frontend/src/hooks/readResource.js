// Deferring one microtask avoids a throwaway request in StrictMode's effect replay.
export function startReadResource(load, signal, publish) {
  return Promise.resolve().then(async () => {
    if (signal.aborted) return
    publish({ status: 'loading', data: null, error: null })
    try {
      const data = await load(signal)
      if (!signal.aborted) publish({ status: 'success', data, error: null })
    } catch (error) {
      if (!signal.aborted) publish({ status: 'error', data: null, error })
    }
  })
}
