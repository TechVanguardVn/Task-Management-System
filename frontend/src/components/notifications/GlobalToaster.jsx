import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Toaster } from 'sonner'
import { defaultToastDuration } from '../../lib/createNotify.js'
import './toasts.css'

export function GlobalToaster() {
  const [host] = useState(() => {
    const element = document.createElement('div')
    element.className = 'taskflow-toast-host'
    return element
  })
  useLayoutEffect(() => {
    // Native modal dialogs are in the browser top layer. Keep the single stable
    // toast portal inside the active modal so it remains visible and dismissible.
    function position() {
      const dialogs = document.querySelectorAll('dialog:modal')
      const parent = dialogs[dialogs.length - 1] || document.body
      if (host.parentNode !== parent) parent.appendChild(host)
    }
    position()
    const observer = new MutationObserver(position)
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['open'],
    })
    return () => {
      observer.disconnect()
      host.remove()
    }
  }, [host])
  return createPortal(
    <Toaster
      position="top-right"
      theme="light"
      richColors
      closeButton
      duration={defaultToastDuration}
      visibleToasts={3}
      gap={10}
      offset={{ top: 88, right: 24 }}
      mobileOffset={{ top: 80, left: 16, right: 16 }}
      containerAriaLabel="Thông báo"
      toastOptions={{
        className: 'taskflow-toast',
        closeButtonAriaLabel: 'Đóng thông báo',
      }}
    />,
    host,
  )
}
