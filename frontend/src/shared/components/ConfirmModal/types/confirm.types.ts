import type { ReactNode } from 'react'

export interface ConfirmConfig {
  title: string
  content: ReactNode
  okText?: string
  cancelText?: string
  okType?: 'primary' | 'danger'
  onOk: () => void | Promise<void>
  onCancel?: () => void
}

export interface ConfirmContextType {
  confirm: (config: ConfirmConfig) => void
}
