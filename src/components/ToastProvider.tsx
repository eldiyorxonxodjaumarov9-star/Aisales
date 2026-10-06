import { useCallback, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { ToastContext, type ToastTone } from './toast'

interface Toast {
  id: number
  text: string
  tone: ToastTone
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((text: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x.slice(-3), { id, text, tone }])
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3200)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Icon name={t.tone === 'error' ? 'alert' : t.tone === 'info' ? 'info' : 'check'} size={16} />
            <span>{t.text}</span>
            <button className="icon-btn sm" aria-label="Yopish" onClick={() => setItems((x) => x.filter((i) => i.id !== t.id))}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
