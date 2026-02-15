"use client";

import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Conferma",
  cancelText = "Annulla",
  type = "info",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open || typeof document === "undefined") return null;

  const typeStyles = {
    danger: {
      confirmBg: "bg-red-600 hover:bg-red-700",
      border: "border-red-500/50",
      icon: icons.exclamation,
      iconColor: "text-red-400",
    },
    warning: {
      confirmBg: "bg-yellow-600 hover:bg-yellow-700",
      border: "border-yellow-500/50",
      icon: icons.exclamation,
      iconColor: "text-yellow-400",
    },
    info: {
      confirmBg: "bg-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/90",
      border: "border-[var(--accent-gold)]/50",
      icon: icons.info,
      iconColor: "text-[var(--accent-gold)]",
    },
  };

  const style = typeStyles[type];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className={`bg-[var(--panel-bg)] border ${style.border} rounded-lg p-6 max-w-md w-full shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className={`${style.iconColor} flex-shrink-0`}>
            <FontAwesomeIcon icon={style.icon} className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-display text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-300 font-sans">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-[var(--border-color)] text-sm text-gray-400 hover:text-white hover:bg-black/20 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-sm text-white ${style.confirmBg} transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
