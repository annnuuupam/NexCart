import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const normalizeOptions = (options = []) =>
  options.map((option) => {
    if (typeof option === "string" || typeof option === "number") {
      return { value: String(option), label: String(option) };
    }
    return {
      value: String(option?.value ?? ""),
      label: String(option?.label ?? option?.value ?? ""),
    };
  });

const AdminSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  disabled = false,
  size = "md",
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const selected = normalizedOptions.find((item) => item.value === String(value ?? ""));

  useEffect(() => {
    const onOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const baseButtonClass =
    size === "sm"
      ? "h-8 rounded-lg px-2.5 py-1 text-xs"
      : "h-10 rounded-xl px-3 py-2 text-sm";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 border border-slate-200 bg-white text-left font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${baseButtonClass} ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          className={`absolute z-[120] mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl ${menuClassName}`}
          role="listbox"
        >
          {normalizedOptions.map((item) => {
            const isActive = item.value === String(value ?? "");
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onChange?.(item.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default AdminSelect;
