import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext(null)
let idCounter = 0
let pushRef = null

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback((message, type = 'success') => {
    const id = ++idCounter
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => dismiss(id), 3800)
  }, [dismiss])

  useEffect(() => { pushRef = push; return () => { pushRef = null } }, [push])

  return (
    <ToastContext.Provider value={{ toast: push }}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type}`}>
            <div className="toast-icon-badge">
              {t.type === 'error' ? '✕' : t.type === 'info' ? 'ℹ' : '✓'}
            </div>
            <div className="toast-content">
              <span className="toast-msg">{t.message}</span>
            </div>
            <button className="toast-close-btn" onClick={() => dismiss(t.id)} aria-label="Close">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext).toast
}

// Direct toast callable anywhere (no component needed).
export function toast(message, type = 'success') {
  if (pushRef) pushRef(message, type)
}