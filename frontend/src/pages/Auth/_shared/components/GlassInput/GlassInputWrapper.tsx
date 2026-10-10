import type { ReactNode } from 'react'
import { Form } from 'antd'
import type { FormItemProps } from 'antd'

interface GlassInputWrapperProps extends FormItemProps {
  hasError?: boolean
  errorMessage?: ReactNode
}

export function GlassInputWrapper({ hasError, errorMessage, children, ...rest }: GlassInputWrapperProps) {
  return (
    <Form.Item
      {...rest}
      validateStatus={hasError ? 'error' : ''}
      help={hasError && errorMessage ? (
        <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[13px]">error</span>
          {errorMessage}
        </span>
      ) : null}
      className={`auth-input-wrapper mb-0 ${hasError ? 'has-error' : ''}`}
    >
      {children}
    </Form.Item>
  )
}
