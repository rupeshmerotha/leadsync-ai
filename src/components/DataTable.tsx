import React from "react";

interface DataTableProps {
  columns: string[];
  data: Record<string, string>[];
}

export default function DataTable({ columns, data }: DataTableProps) {
  if (!columns || columns.length === 0) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 shadow-sm overflow-hidden backdrop-blur-xl">
      <div className="max-h-[500px] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
          <thead className="bg-slate-50/90 dark:bg-zinc-900/90 sticky top-0 z-10 backdrop-blur-md shadow-sm">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  scope="col"
                  className="whitespace-nowrap py-4 pl-6 pr-4 text-left text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 bg-white dark:bg-zinc-900">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors group">
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="whitespace-nowrap py-4 pl-6 pr-4 text-sm text-slate-600 dark:text-zinc-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                  >
                    {row[col] || <span className="text-slate-300 dark:text-zinc-600">-</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
