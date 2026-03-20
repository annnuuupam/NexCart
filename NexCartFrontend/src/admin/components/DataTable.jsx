import React from "react";

const DataTable = ({ columns, data, emptyText = "No data available" }) => {
  return (
    <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[720px] sm:min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id || row.orderId || row.userId || rowIndex} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/35 hover:bg-blue-50/30">
                {columns.map((column) => (
                  <td key={column.key} className="max-w-xs px-4 py-3 align-top text-slate-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

