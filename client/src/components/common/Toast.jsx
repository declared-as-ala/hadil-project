import { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title, message) => addToast('success', title, message),
    [addToast]
  );
  const error = useCallback(
    (title, message) => addToast('error', title, message),
    [addToast]
  );
  const warning = useCallback(
    (title, message) => addToast('warning', title, message),
    [addToast]
  );
  const info = useCallback(
    (title, message) => addToast('info', title, message),
    [addToast]
  );

  const icons = {
    success: '\u2714\uFE0F',
    error: '\u2716\uFE0F',
    warning: '\u26A0\uFE0F',
    info: '\u2139\uFE0F',
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{icons[toast.type]}</span>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function useApiToast() {
  const toast = useToast();
  return {
    success: (data) => toast.success('Success', data?.message || 'Operation completed successfully'),
    error: (err) =>
      toast.error('Error', err?.message || 'An unexpected error occurred'),
  };
}
