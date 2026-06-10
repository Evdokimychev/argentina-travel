import type { GuidePillarTable } from "@/types/guide-pillar";

type HubDataTableProps = {
  table: GuidePillarTable;
};

export default function HubDataTable({ table }: HubDataTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-surface-muted/80">
            {table.headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold text-charcoal">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-50 last:border-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cnCell(cellIndex, rowIndex === 0)}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cnCell(index: number, _isFirst: boolean) {
  const base = "px-4 py-3 text-slate align-top";
  if (index === 0) return `${base} font-medium text-charcoal`;
  return base;
}
