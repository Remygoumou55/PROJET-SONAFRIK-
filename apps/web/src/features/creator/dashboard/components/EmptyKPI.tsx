"use client";

import Link from "next/link";
import type { CreatorDashboardKpiEmptyState } from "@sonafrik/types";

interface EmptyKPIProps extends CreatorDashboardKpiEmptyState {
  onCopyProfile?: () => void;
  copyProfileLabel?: string;
}

export function EmptyKPI({
  icon,
  message,
  subMessage,
  actionLabel,
  actionHref,
  onCopyProfile,
  copyProfileLabel,
}: EmptyKPIProps) {
  const isCopyAction = actionLabel === "Copier mon lien profil" && onCopyProfile;

  return (
    <div className="creator-empty-kpi">
      <span className="creator-empty-kpi__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="creator-empty-kpi__message">{message}</p>
      {subMessage ? <p className="creator-empty-kpi__sub">{subMessage}</p> : null}
      {isCopyAction ? (
        <button type="button" className="creator-empty-kpi__cta" onClick={onCopyProfile}>
          {copyProfileLabel ?? actionLabel}
        </button>
      ) : actionLabel && actionHref ? (
        <Link href={actionHref} className="creator-empty-kpi__cta">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
