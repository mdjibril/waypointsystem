import React from "react";

interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data available.",
  className = "",
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-6 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="py-16 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3.5 px-6 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-xs">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`${onRowClick ? "cursor-pointer" : ""} hover:bg-muted/10 transition-colors`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-3.5 px-6 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                >
                  {col.render ? col.render(item) : String(item[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
