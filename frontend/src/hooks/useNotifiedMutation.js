import { useEffect, useRef, useState } from 'react'
import { getAccessToken } from '../api/tokenStore.js'
import { notify } from '../lib/notify.js'
import { startOperationNotification } from '../lib/operationNotification.js'
import { mutationRecovery } from '../lib/apiErrorMessage.js'

export function useNotifiedMutation(
  onSuccess,
  fieldsFor,
  operation,
  concurrent = false,
) {
  const [state, setState] = useState({
    pending: false,
    error: '',
    fieldErrors: {},
  })
  const request = useRef(new Map())
  useEffect(
    () => () => {
      request.current.forEach(({ controller, feedback }) => {
        controller.abort()
        feedback.cancel()
      })
    },
    [],
  )
  async function run(action) {
    if (!concurrent && request.current.size) return
    const controller = new AbortController()
    const token = getAccessToken()
    const feedback = startOperationNotification(notify, operation)
    request.current.set(controller, { controller, feedback })
    setState({ pending: true, error: '', fieldErrors: {} })
    try {
      const result = await action(controller.signal)
      if (!controller.signal.aborted && token === getAccessToken()) {
        feedback.success()
        onSuccess(result)
      }
    } catch (error) {
      if (
        !controller.signal.aborted &&
        token === getAccessToken() &&
        error.code !== 'ERR_CANCELED'
      ) {
        feedback.error(error)
        setState({
          pending: false,
          error: mutationRecovery(error),
          fieldErrors: fieldsFor(error),
        })
      }
    } finally {
      feedback.cancel()
      request.current.delete(controller)
      setState((previous) => ({
        ...previous,
        pending: request.current.size > 0,
      }))
    }
  }
  return { ...state, run }
}
