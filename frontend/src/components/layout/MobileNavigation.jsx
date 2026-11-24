import { useEffect, useRef } from 'react'
import { Sidebar } from './Sidebar.jsx'

export function MobileNavigation({ open, onClose }) {
  const dialog = useRef(null)

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
    if (!open) return
    const media = window.matchMedia('(min-width: 1024px)')
    const resize = () => {
      if (media.matches) onClose()
    }
    media.addEventListener('change', resize)
    return () => {
      media.removeEventListener('change', resize)
      element.close()
      previousFocus?.focus()
    }
  }, [open, onClose])

  return (
    <dialog
      ref={dialog}
      id="mobile-navigation"
      className="mobile-navigation"
      aria-label="Điều hướng TaskFlow"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Sidebar mobile onNavigate={onClose} />
    </dialog>
  )
}
