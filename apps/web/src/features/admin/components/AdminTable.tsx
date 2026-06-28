"use client";

interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = "Aucune donnée",
  isLoading,
}: AdminTableProps<T>) {
  if (isLoading) {
    return <AdminTableSkeleton rows={5} cols={columns.length} />;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="admin-th" style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="admin-td-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={String(row[keyField])} className="admin-tr">
                {columns.map((col) => (
                  <td key={String(col.key)} className="admin-td">
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminTableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="admin-tr">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="admin-td">
                  <div className="admin-skeleton" style={{ width: j === 0 ? "60%" : "80%" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
