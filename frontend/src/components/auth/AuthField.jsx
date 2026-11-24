import { useState } from 'react'
import { AuthIcon } from './AuthIcon.jsx'

export function AuthField({
  name,
  label,
  type = 'text',
  icon,
  error,
  hintId,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false)
  const password = type === 'password'
  const describedBy =
    [error ? `${name}-error` : null, hintId].filter(Boolean).join(' ') ||
    undefined
  return (
    <div className="auth-field">
      <label htmlFor={name}>{label}</label>
      <div className={`auth-input-wrap${error ? ' has-error' : ''}`}>
        <span className="auth-input-icon">
          <AuthIcon name={icon} />
        </span>
        <input
          {...inputProps}
          id={name}
          name={name}
          type={password && visible ? 'text' : type}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={password ? 'auth-input auth-password' : 'auth-input'}
        />
        {password && (
          <button
            type="button"
            className="auth-visibility"
            aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
            tabIndex={-1}
          >
            <AuthIcon  name={visible ? 'eyeOff' : 'eye'} />
          </button>
        )}
      </div>
      {error && (
        <p className="auth-field-error" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
