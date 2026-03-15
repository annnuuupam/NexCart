import React from "react";

const toneClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function Notice({ message, tone = "info", action, onAction, onClose, className = "" }) {
  if (!message) return null;

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${toneClasses[tone] || toneClasses.info} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <div className="flex items-center gap-2">
          {action && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="rounded-md border border-current px-2 py-1 text-xs font-semibold opacity-90 hover:opacity-100"
            >
              {action}
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-current px-2 py-1 text-xs font-semibold opacity-90 hover:opacity-100"
              aria-label="Dismiss notice"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
