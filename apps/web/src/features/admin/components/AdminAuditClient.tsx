"use client";

import { useState } from "react";
import type { AdminAuditActivityItem } from "@sonafrik/api/admin";
import { Input } from "@sonafrik/ui";
import { AdminTable } from "./AdminTable";

function formatAuditDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminAuditClient({
  initialEntries,
  total,
  initialQuery,
}: {
  initialEntries: AdminAuditActivityItem[];
  total: number;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");

  return (
    <div className="space-y-4">
      <form method="get" className="flex flex-wrap gap-2">
        <Input
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer par action (ex. catalog, wallet)"
          className="max-w-md"
        />
        <button type="submit" className="admin-btn admin-btn--primary">
          Rechercher
        </button>
      </form>
      <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
        {total.toLocaleString("fr-FR")} entrée{total > 1 ? "s" : ""} — lecture seule
      </p>
      <AdminTable<AdminAuditActivityItem>
        columns={[
          {
            key: "created_at",
            label: "Date",
            render: (row) => formatAuditDate(row.created_at),
          },
          { key: "action", label: "Action" },
          {
            key: "entity_type",
            label: "Entité",
            render: (row) => row.entity_type ?? "—",
          },
          {
            key: "actor_id",
            label: "Acteur",
            hideOnMobile: true,
            render: (row) => (row.actor_id ? `${row.actor_id.slice(0, 8)}…` : "—"),
          },
        ]}
        data={initialEntries}
        keyField="id"
        emptyMessage="Aucune entrée d'audit pour ce filtre."
      />
    </div>
  );
}
