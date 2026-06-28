"use client";

import { useState } from "react";

interface AdminConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  confirmLabel: string;
  isDanger?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function AdminConfirmModal({
  isOpen,
  title,
  description,
  confirmText,
  confirmLabel,
  isDanger = false,
  onConfirm,
  onCancel,
}: AdminConfirmModalProps) {
  const [typed, setTyped] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isMatch = typed === confirmText;

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isMatch) return;
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      setTyped("");
    }
  };

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
      <div className="admin-modal">
        <h3 id="admin-modal-title" className="admin-modal-title">
          {title}
        </h3>
        <p className="admin-modal-desc">{description}</p>

        <div className="admin-modal-confirm-input">
          <p className="admin-modal-confirm-label">
            Tapez <strong>{confirmText}</strong> pour confirmer :
          </p>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmText}
            className="admin-input"
            autoFocus
          />
        </div>

        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            type="button"
            className={`admin-btn ${isDanger ? "admin-btn-danger" : "admin-btn-primary"}`}
            onClick={handleConfirm}
            disabled={!isMatch || isLoading}
          >
            {isLoading ? "En cours..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
