import { useContext } from 'react'
import { ConfirmModalContext } from '../ConfirmModalContext'

export const useConfirm = () => {
  const context = useContext(ConfirmModalContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmModalProvider')
  }
  return context.confirm
}
