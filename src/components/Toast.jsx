import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100%-32px)] max-w-[398px] pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`rounded-2xl px-4 py-3 text-white text-sm font-600 shadow-lg
              flex items-center gap-3 animate-fade-in pointer-events-auto
              ${t.type === 'error' ? 'bg-red' : t.type === 'warning' ? 'bg-warning' : 'bg-success'}`}
          >
            <span className="text-lg">
              {t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : '✓'}
            </span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
