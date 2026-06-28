"use client";

import { Fragment } from "react";

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
  expandedRowKey?: string | null;
  renderExpandedRow?: (row: T) => React.ReactNode;
}

export function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = "Aucune donnée",
  isLoading,
  expandedRowKey,
  renderExpandedRow,
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
            data.map((row) => {
              const rowKey = String(row[keyField]);
              const isExpanded = expandedRowKey === rowKey;
              return (
                <Fragment key={rowKey}>
                  <tr key={rowKey} className="admin-tr">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="admin-td">
                        {col.render
                          ? col.render(row)
                          : String(row[col.key as keyof T] ?? "—")}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpandedRow ? (
                    <tr key={`${rowKey}-detail`} className="admin-tr-expanded">
                      <td colSpan={columns.length} className="admin-td-expanded">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
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
