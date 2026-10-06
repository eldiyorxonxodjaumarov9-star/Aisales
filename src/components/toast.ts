import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'info' | 'error'

export const ToastContext = createContext<(text: string, tone?: ToastTone) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}
