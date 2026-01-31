import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, message, type }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{ position: "fixed", top: 24, right: 24, zIndex: 2000 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === "error" ? "#FDECEA" : t.type === "success" ? "#E8F8F2" : "#F4F8FB",
            color: t.type === "error" ? "#E74C3C" : t.type === "success" ? "#27AE60" : "#2C3E50",
            borderRadius: 6,
            boxShadow: "0 2px 8px rgba(44,62,80,0.12)",
            padding: "14px 24px",
            marginBottom: 12,
            fontWeight: 500,
            minWidth: 220,
            maxWidth: 320,
            fontSize: 16,
            pointerEvents: "auto",
          }}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
