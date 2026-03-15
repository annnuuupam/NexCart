import React, { useState } from "react";

export default function EmailTemplateEditor({ initialValue = "", onSave }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-base font-bold text-slate-900">Reset Email Template</h4>
          <p className="text-xs text-slate-500">Use {"{{resetLink}}"} where the button should point.</p>
        </div>
        <button
          type="button"
          onClick={() => onSave?.(value)}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
        >
          Save Template
        </button>
      </div>
      <textarea
        rows={10}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
      />
    </div>
  );
}
