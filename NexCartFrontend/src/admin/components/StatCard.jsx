import React from "react";

const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon ? (
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {trend ? <p className="mt-1 text-xs text-emerald-600">{trend}</p> : <p className="mt-1 text-xs text-slate-400">Updated from live data</p>}
    </div>
  );
};

export default StatCard;
