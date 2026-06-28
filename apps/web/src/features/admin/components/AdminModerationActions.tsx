"use client";

interface AdminModerationActionsProps {
  busy?: boolean;
  onApprove: () => void;
  onReject: () => void;
  approveLabel?: string;
  rejectLabel?: string;
}

/** Boutons Approuver / Rejeter — pattern unifié modération admin. */
export function AdminModerationActions({
  busy = false,
  onApprove,
  onReject,
  approveLabel = "Approuver",
  rejectLabel = "Rejeter",
}: AdminModerationActionsProps) {
  return (
    <div className="admin-moderation-actions">
      <button
        type="button"
        disabled={busy}
        onClick={onApprove}
        className="admin-btn admin-btn-primary admin-btn-sm"
      >
        {busy ? "…" : approveLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onReject}
        className="admin-btn admin-btn-danger admin-btn-sm"
      >
        {rejectLabel}
      </button>
    </div>
  );
}
