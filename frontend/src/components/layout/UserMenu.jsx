import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth.js'
import { Icon } from '../Icon.jsx'
import { UserAvatar } from './UserAvatar.jsx'

export function UserMenu() {
  const { user, status, logout, logoutError } = useAuth()
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const action = useRef(null)
  const signingOut = useRef(false)
  const navigate = useNavigate()
  const pending = status === 'logging-out'
  const name = user.name?.trim() || 'Tài khoản của bạn'

  useEffect(() => {
    if (!open) return
    action.current?.focus()
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  async function signOut() {
    signingOut.current = true
    try {
      if (await logout()) navigate('/login', { replace: true })
    } finally {
      signingOut.current = false
    }
  }

  return (
    <div
      className="user-menu"
      ref={root}
      onBlur={(event) => {
        if (
          !signingOut.current &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false)
      }}
    >
      <button
        type="button"
        ref={trigger}
        className="user-menu-trigger"
        aria-label={`Tài khoản: ${name}`}
        aria-expanded={open}
        aria-controls="user-menu-panel"
        onClick={() => setOpen(!open)}
      >
        <span className="header-user-name">
          {name}
          <span>Tài khoản cá nhân</span>
        </span>
        <UserAvatar name={user.name} />
        <Icon name="chevron" className="size-4" />
      </button>
      {open && (
        <div id="user-menu-panel" className="user-menu-panel">
          <div className="user-menu-details">
            <strong>{name}</strong>
            <span>{user.email}</span>
          </div>
          {logoutError && (
            <p className="logout-error" role="alert">
              {logoutError}
            </p>
          )}
          <button
            type="button"
            ref={action}
            className="logout-button"
            onClick={signOut}
            disabled={pending}
          >
            <Icon name="logout" />
            {pending ? 'Đang đăng xuất…' : 'Đăng xuất'}
          </button>
        </div>
      )}
    </div>
  )
}
