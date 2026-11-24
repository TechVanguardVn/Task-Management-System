export function resourceState(query) {
  return {
    status:
      query.data !== undefined
        ? 'success'
        : query.isError
          ? 'error'
          : 'loading',
    data: query.data ?? null,
    error: query.error,
    isFetching: query.isFetching,
    backgroundError: query.data !== undefined ? query.error : null,
  }
}
