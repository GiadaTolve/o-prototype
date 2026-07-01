"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

  const typeStyles: Record<ToastType, { borderColor: string; textColor: string; icon: typeof icons.check }> = {
    success: {
      borderColor: "rgba(212,175,55,0.5)",
      textColor: "#d4af37",
      icon: icons.check,
    },
    error: {
      borderColor: "rgba(138,28,28,0.6)",
      textColor: "#f87171",
      icon: icons.times,
    },
    info: {
      borderColor: "rgba(124,58,237,0.5)",
      textColor: "#a78bfa",
      icon: icons.info,
    },
    warning: {
      borderColor: "rgba(212,175,55,0.5)",
      textColor: "#d4af37",
      icon: icons.exclamation,
    },
  };

  const style = typeStyles[toast.type];

  return (
    <div
      className="border rounded-lg p-4 flex items-center gap-3 min-w-[280px] max-w-[420px] font-display animate-slide-in-right backdrop-blur-sm"
      style={{
        backgroundColor: "rgba(15,15,18,0.97)",
        borderColor: style.borderColor,
        color: style.textColor,
        boxShadow: "0 0 20px rgba(0,0,0,0.6), 0 0 1px rgba(212,175,55,0.2)",
      }}
    >
      <FontAwesomeIcon icon={style.icon} className="w-4 h-4 flex-shrink-0 opacity-90" />
      <p className="flex-1 text-sm tracking-wide text-inherit">{toast.message}</p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-[#d4af37] transition-colors p-1"
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

  const container = (
    <div
      className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: "calc(100vw - 2rem)" }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onClose={handleClose} />
        </div>
      ))}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(container, document.body);
  }
  return container;
}

// Helper functions per facilità d'uso
export const toast = {
  success: (message: string, duration?: number) => showToast(message, "success", duration),
  error: (message: string, duration?: number) => showToast(message, "error", duration),
  info: (message: string, duration?: number) => showToast(message, "info", duration),
  warning: (message: string, duration?: number) => showToast(message, "warning", duration),
};
