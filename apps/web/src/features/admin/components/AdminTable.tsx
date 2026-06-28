"use client";

import { Fragment } from "react";

export interface AdminTableColumn<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  /** Masquer sur la vue carte mobile (ex. colonnes techniques) */
  hideOnMobile?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  isLoading?: boolean;
  expandedRowKey?: string | null;
  renderExpandedRow?: (row: T) => React.ReactNode;
  /** Vue carte personnalisée ; sinon rendu auto depuis les colonnes */
  mobileCardRender?: (row: T) => React.ReactNode;
}

function DefaultMobileCard<T extends Record<string, unknown>>({
  row,
  columns,
}: {
  row: T;
  columns: AdminTableColumn<T>[];
}) {
  const visible = columns.filter((c) => !c.hideOnMobile);
  return (
    <article className="admin-table-card">
      {visible.map((col) => (
        <div key={String(col.key)} className="admin-table-card__row">
          <span className="admin-table-card__label">{col.label}</span>
          <div className="admin-table-card__value">
            {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "—")}
          </div>
        </div>
      ))}
    </article>
  );
}

export function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = "Aucune donnée",
  isLoading,
  expandedRowKey,
  renderExpandedRow,
  mobileCardRender,
}: AdminTableProps<T>) {
  if (isLoading) {
    return <AdminTableSkeleton rows={5} cols={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className="admin-table-empty" role="status">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="admin-table-wrap admin-table-wrap--desktop">
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
            {data.map((row) => {
              const rowKey = String(row[keyField]);
              const isExpanded = expandedRowKey === rowKey;
              return (
                <Fragment key={rowKey}>
                  <tr className="admin-tr">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="admin-td">
                        {col.render
                          ? col.render(row)
                          : String(row[col.key as keyof T] ?? "—")}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpandedRow ? (
                    <tr className="admin-tr-expanded">
                      <td colSpan={columns.length} className="admin-td-expanded">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="admin-table-cards admin-table-cards--mobile" role="list">
        {data.map((row) => {
          const rowKey = String(row[keyField]);
          const isExpanded = expandedRowKey === rowKey;
          return (
            <div key={rowKey} role="listitem">
              {mobileCardRender ? (
                mobileCardRender(row)
              ) : (
                <DefaultMobileCard row={row} columns={columns} />
              )}
              {isExpanded && renderExpandedRow ? (
                <div className="admin-table-card__expanded">{renderExpandedRow(row)}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

function AdminTableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      <div className="admin-table-wrap admin-table-wrap--desktop">
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
      <div className="admin-table-cards admin-table-cards--mobile">
        {Array.from({ length: Math.min(rows, 3) }).map((_, i) => (
          <div key={i} className="admin-table-card admin-table-card--skeleton">
            <div className="admin-skeleton" style={{ height: 80, width: "100%" }} />
          </div>
        ))}
      </div>
    </>
  );
}
