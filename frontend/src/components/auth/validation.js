import { apiErrorMessage } from '../../lib/apiErrorMessage.js'

export function passwordRequirements(password) {
  return [
    { label: 'Ít nhất 12 ký tự', met: [...password].length >= 12 },

    {
      label: 'Không chỉ có khoảng trắng hoặc chứa ký tự không hợp lệ',
      met: Boolean(password.trim()) && !password.includes('\0'),
    },
  ]
}

export function validateAuth(values, mode) {
  const errors = {}
  const email = values.email.trim()
  if (!email) errors.email = 'Vui lòng nhập email.'
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email))
    errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.'
  if (!values.password.trim()) errors.password = 'Vui lòng nhập mật khẩu.'
  else if (values.password.includes('\0'))
    errors.password = 'Mật khẩu chứa ký tự không hợp lệ.'
  else if (new TextEncoder().encode(values.password).length > 72)
    errors.password = 'Mật khẩu không được vượt quá 72 byte UTF-8.'
  if (mode === 'register') {
    if (!values.name.trim()) errors.name = 'Vui lòng nhập họ và tên.'
    else if (values.name.trim().length > 120)
      errors.name = 'Họ và tên không được vượt quá 120 ký tự.'
    if (!errors.password && [...values.password].length < 12)
      errors.password = 'Mật khẩu cần có ít nhất 12 ký tự.'
    if (!values.confirmPassword)
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
    else if (values.confirmPassword !== values.password)
      errors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.'
  }
  return errors
}

export function authErrorMessage(error, mode) {
  return apiErrorMessage(error, mode)
}

export function authFieldErrors(error) {
  const messages = {
    email: 'Email chưa hợp lệ. Vui lòng kiểm tra lại.',
    name: 'Họ và tên chưa hợp lệ (tối đa 120 ký tự).',
    password: 'Mật khẩu chưa hợp lệ. Vui lòng kiểm tra yêu cầu mật khẩu.',
  }
  const errors = {}
  const validationErrors = error.response?.data?.validationErrors
  if (!Array.isArray(validationErrors)) return errors
  for (const item of validationErrors) {
    if (item && Object.hasOwn(messages, item.field))
      errors[item.field] = messages[item.field]
  }
  return errors
}
