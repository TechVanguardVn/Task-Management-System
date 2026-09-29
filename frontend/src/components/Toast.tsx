import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState } from 'react'

type Toast = { id: number; message: string; kind: 'success' | 'error' }
const ToastContext = createContext<{ showToast: (message: string, kind?: Toast['kind']) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const showToast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now()
    setToasts((current) => [...current, { id, message, kind }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500)
  }, [])
  return <ToastContext.Provider value={{ showToast }}>
    {children}
    <div className="fixed right-4 top-4 z-50 space-y-2" aria-live="polite">
      {toasts.map((toast) => <div key={toast.id} role="status" className={`flex max-w-sm items-center gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${toast.kind === 'success' ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
        {toast.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <span className="flex-1">{toast.message}</span>
        <button aria-label="Đóng thông báo" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}><X size={16} /></button>
      </div>)}
    </div>
  </ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
