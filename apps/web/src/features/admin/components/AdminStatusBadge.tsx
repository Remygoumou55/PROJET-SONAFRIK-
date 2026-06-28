import type { AdminAccountStatus } from "@sonafrik/types";

type StatusType = AdminAccountStatus | "premium" | "pending" | "verified";

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
  active: { label: "Actif", className: "badge-active" },
  suspended: { label: "Suspendu", className: "badge-suspended" },
  pending: { label: "En attente", className: "badge-pending" },
  verified: { label: "Vérifié", className: "badge-verified" },
  banned: { label: "Banni", className: "badge-banned" },
  deleted: { label: "Supprimé", className: "badge-banned" },
  premium: { label: "Premium", className: "badge-premium" },
};

export function AdminStatusBadge({ status }: { status: StatusType }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "badge-default" };
  return (
    <span className={`admin-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
