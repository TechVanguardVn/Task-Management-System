import { useEffect, useRef } from 'react'
import { Icon } from '../Icon.jsx'

export function ProjectDialog({ title, pending, onClose, children }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    return () => {
      element.close()
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return (
    <dialog
      className="project-dialog"
      ref={dialog}
      aria-labelledby="project-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose()
      }}
    >
      <div className="project-dialog-content">
        <header>
          <h2 id="project-dialog-title">{title}</h2>
          <button
            type="button"
            className="shell-icon-button"
            disabled={pending}
            aria-label="Đóng hộp thoại"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
