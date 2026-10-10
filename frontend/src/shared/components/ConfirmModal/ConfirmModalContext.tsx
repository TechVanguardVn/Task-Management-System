import { createContext } from 'react'
import type { ConfirmContextType } from './types/confirm.types'

export const ConfirmModalContext = createContext<ConfirmContextType | undefined>(undefined)
