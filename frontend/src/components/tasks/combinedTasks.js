function compareTimestamp(a, b) {
  const milliseconds = Date.parse(a) - Date.parse(b)
  if (milliseconds) return milliseconds
  const fraction = (value) =>
    (value.match(/\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/)?.[1] || '')
      .padEnd(9, '0')
      .slice(3)
  return fraction(a).localeCompare(fraction(b))
}

export function combinedTaskPage(tasks, query) {
  const filtered = tasks.filter(
    (task) =>
      (!query.search ||
        task.title.toLowerCase().includes(query.search.trim().toLowerCase())) &&
      (!query.status || task.status === query.status) &&
      (!query.priority || task.priority === query.priority),
  )
  const [field, direction] = query.sort.split(',')
  const sign = direction === 'desc' ? -1 : 1
  const priorities = { LOW: 0, MEDIUM: 1, HIGH: 2 }
  const statuses = { TODO: 0, IN_PROGRESS: 1, DONE: 2 }
  filtered.sort((a, b) => {
    // PostgreSQL defaults: NULLS LAST for ASC, NULLS FIRST for DESC.
    if (a[field] == null && b[field] != null) return sign
    if (b[field] == null && a[field] != null) return -sign
    let order = 0
    if (a[field] != null && b[field] != null) {
      if (field === 'priority')
        order = priorities[a.priority] - priorities[b.priority]
      else if (field === 'status')
        order = statuses[a.status] - statuses[b.status]
      else if (field.endsWith('At')) {
        order = compareTimestamp(a[field], b[field])
      } else order = String(a[field]).localeCompare(String(b[field]), 'vi')
    }
    return order * sign || a.id.localeCompare(b.id)
  })
  return {
    content: filtered.slice(
      query.page * query.size,
      (query.page + 1) * query.size,
    ),
    page: query.page,
    size: query.size,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / query.size),
  }
}
