import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { ConfirmModalContext } from './ConfirmModalContext'
import type { ConfirmConfig } from './types/confirm.types'
import { ConfirmModalLayout } from './components/ConfirmModalLayout'
import { ConfirmModalHeader } from './components/ConfirmModalHeader'
import { ConfirmModalContent } from './components/ConfirmModalContent'
import { ConfirmModalFooter } from './components/ConfirmModalFooter'

export const ConfirmModalProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ConfirmConfig | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const confirm = useCallback((newConfig: ConfirmConfig) => {
    setConfig(newConfig)
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    config?.onCancel?.()
    setTimeout(() => {
      setConfig(null)
      setIsPending(false)
    }, 300) // Wait for transition out
  }, [config])

  const handleOk = useCallback(async () => {
    if (!config) return
    try {
      setIsPending(true)
      await config.onOk()
      setIsOpen(false)
      setTimeout(() => {
        setConfig(null)
        setIsPending(false)
      }, 300)
    } catch (error) {
      // If error, don't close, just stop loading
      setIsPending(false)
      throw error // Let the caller or global error handler catch it
    }
  }, [config])

  return (
    <ConfirmModalContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModalLayout isOpen={isOpen}>
        {config && (
          <>
            <ConfirmModalHeader title={config.title} type={config.okType} />
            <ConfirmModalContent content={config.content} />
            <ConfirmModalFooter
              okText={config.okText || 'Xác nhận'}
              cancelText={config.cancelText || 'Hủy'}
              okType={config.okType || 'primary'}
              onOk={handleOk}
              onCancel={handleClose}
              isPending={isPending}
            />
          </>
        )}
      </ConfirmModalLayout>
    </ConfirmModalContext.Provider>
  )
}
