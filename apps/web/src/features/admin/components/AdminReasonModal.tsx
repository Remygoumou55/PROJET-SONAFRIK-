"use client";

interface AdminReasonModalProps {
  title: string;
  placeholder: string;
  confirmLabel?: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

/** Modal saisie motif — modération catalogue, retraits, droits. */
export function AdminReasonModal({
  title,
  placeholder,
  confirmLabel = "Confirmer",
  value,
  onChange,
  onConfirm,
  onCancel,
  danger = false,
}: AdminReasonModalProps) {
  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-reason-modal-title"
    >
      <div className="admin-modal">
        <h3 id="admin-reason-modal-title" className="admin-modal-title">
          {title}
        </h3>
        <input
          autoFocus
          className="admin-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="admin-modal-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onCancel}>
            Annuler
          </button>
          <button
            type="button"
            className={`admin-btn ${danger ? "admin-btn-danger" : "admin-btn-primary"}`}
            onClick={onConfirm}
            disabled={!value.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
