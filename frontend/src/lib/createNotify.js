export const defaultToastDuration = 3500

export function createNotify(
  driver,
  timers = {
    setTimeout: (fn, delay) => setTimeout(fn, delay),
    clearTimeout: (id) => clearTimeout(id),
  },
) {
  const deadlines = new Map()
  function clear(id) {
    if (deadlines.has(id)) {
      timers.clearTimeout(deadlines.get(id))
      deadlines.delete(id)
    }
  }
  function dismiss(id) {
    if (id === undefined) {
      for (const key of deadlines.keys()) clear(key)
    } else clear(id)
    driver.dismiss(id)
  }
  const notify = Object.fromEntries(
    ['success', 'error', 'warning', 'info'].map((type) => [
      type,
      (message, options = {}) => {
        clear(options.id)
        return driver[type](message, {
          duration: defaultToastDuration,
          ...options,
        })
      },
    ]),
  )
  return {
    ...notify,
    dismiss,
    loading(message, options = {}) {
      const duration =
        Number.isFinite(options.duration) && options.duration > 0
          ? Math.min(options.duration, 60000)
          : 30000
      clear(options.id)
      const id = driver.loading(message, { ...options, duration })
      // Sonner loading toasts do not auto-expire; retain a finite independent deadline.
      deadlines.set(
        id,
        timers.setTimeout(() => dismiss(id), duration),
      )
      return id
    },
  }
}
