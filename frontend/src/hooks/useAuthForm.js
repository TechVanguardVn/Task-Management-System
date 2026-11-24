import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { authenticate } from '../api/auth.js'
import { authFieldErrors, validateAuth } from '../components/auth/validation.js'
import { useAuth } from './useAuth.js'
import { notify, sessionExpiredToastId } from '../lib/notify.js'
import { startOperationNotification } from '../lib/operationNotification.js'

export function useAuthForm(mode) {
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState(false)
  const request = useRef(null)
  const { completeAuthentication } = useAuth()
  const navigate = useNavigate()
  useEffect(
    () => () => {
      request.current?.controller.abort()
      request.current?.feedback.cancel()
    },
    [],
  )

  function change(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
      ...(name === 'password' ? { confirmPassword: undefined } : {}),
    }))
  }

  function blur(event) {
    const { name } = event.target
    setErrors((previous) => ({
      ...previous,
      [name]: validateAuth(values, mode)[name],
    }))
  }

  async function submit(event) {
    event.preventDefault()
    if (request.current) return
    const form = event.currentTarget
    const validation = validateAuth(values, mode)
    setErrors(validation)
    if (Object.keys(validation).length) {
      form.elements.namedItem(Object.keys(validation)[0])?.focus()
      return
    }
    const controller = new AbortController()
    const feedback = startOperationNotification(notify, `auth.${mode}`)
    request.current = { controller, feedback }
    setPending(true)
    try {
      const data = await authenticate(mode, values, controller.signal)
      if (controller.signal.aborted) return
      notify.dismiss(sessionExpiredToastId)
      completeAuthentication(data)
      feedback.success()
      navigate('/dashboard', { replace: true })
    } catch (error) {
      if (!controller.signal.aborted) {
        feedback.error(error)
        setErrors(authFieldErrors(error))
      }
    } finally {
      feedback.cancel()
      if (!controller.signal.aborted) setPending(false)
      request.current = null
    }
  }
  return { values, errors, pending, change, blur, submit }
}
