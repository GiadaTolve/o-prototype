"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

// Assicurati che le icone siano disponibili
if (!icons.check || !icons.times || !icons.info || !icons.exclamation) {
  console.warn("Alcune icone toast non sono disponibili");
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const typeStyles = {
    success: {
      bg: "bg-green-900/90 border-green-500/50",
      text: "text-green-300",
      icon: icons.check,
    },
    error: {
      bg: "bg-red-900/90 border-red-500/50",
      text: "text-red-300",
      icon: icons.times,
    },
    info: {
      bg: "bg-blue-900/90 border-blue-500/50",
      text: "text-blue-300",
      icon: icons.info,
    },
    warning: {
      bg: "bg-yellow-900/90 border-yellow-500/50",
      text: "text-yellow-300",
      icon: icons.exclamation,
    },
  };

  const style = typeStyles[toast.type];

  return (
    <div
      className={`${style.bg} ${style.text} border rounded-lg p-4 shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px] animate-slide-in-right`}
      style={{
        animation: "slideInRight 0.3s ease-out",
      }}
    >
      <FontAwesomeIcon icon={style.icon} className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-sans">{toast.message}</p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <FontAwesomeIcon icon={icons.times} className="w-4 h-4" />
      </button>
    </div>
  );
}

let toastIdCounter = 0;
const toastListeners = new Set<(toast: Toast) => void>();

export function showToast(message: string, type: ToastType = "info", duration?: number) {
  const id = `toast-${++toastIdCounter}`;
  const toast: Toast = { id, message, type, duration };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={handleClose} />
        </div>
      ))}
    </div>
  );
}

// Helper functions per facilità d'uso
export const toast = {
  success: (message: string, duration?: number) => showToast(message, "success", duration),
  error: (message: string, duration?: number) => showToast(message, "error", duration),
  info: (message: string, duration?: number) => showToast(message, "info", duration),
  warning: (message: string, duration?: number) => showToast(message, "warning", duration),
};
