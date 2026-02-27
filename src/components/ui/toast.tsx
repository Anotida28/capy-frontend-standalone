"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastMessage = {
  id: string;
  message: string;
  tone?: "success" | "error" | "info";
};

const ToastContext = createContext<{ notify: (msg: Omit<ToastMessage, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastMessage[]>([]);

  const notify = useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((prev) => [...prev, { id, ...msg }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {items.map((item) => (
          <div key={item.id} className={`toast toast-${item.tone ?? "info"}`}>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
