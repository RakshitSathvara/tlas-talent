import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
  mono?: boolean;
}

/**
 * Lightweight headless-ish table for already-fetched rows (e.g. the audit log).
 * The applicant table is intentionally bespoke (design-system.md §7.4), not this.
 */
export function DataTable<T>({
  columns,
  rows,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "smallcaps px-5 py-3 text-[10px] font-medium text-ink-softer",
                  col.align === "right" && "text-right",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-b-0 hover:bg-black/[0.02]">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-5 py-3 text-[13px] text-ink",
                    col.align === "right" && "text-right",
                    col.mono && "font-mono text-[12px] text-ink-soft",
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
