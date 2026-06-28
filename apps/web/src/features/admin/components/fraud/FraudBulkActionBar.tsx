"use client";

import { memo } from "react";

interface Props {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onArchive: () => void;
  onMarkTreated: () => void;
  onHide: () => void;
  onExport: () => void;
  onDelete: () => void;
  onAddNote: () => void;
}

function FraudBulkActionBarView({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onArchive,
  onMarkTreated,
  onHide,
  onExport,
  onDelete,
  onAddNote,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="fraud-bulk-bar" role="region" aria-label="Actions groupées">
      <p className="fraud-bulk-bar__count">
        {selectedCount} incident{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
      </p>
      <div className="fraud-bulk-bar__actions">
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onSelectAll}>
          Tout sélectionner
        </button>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onClearSelection}>
          Tout désélectionner
        </button>
        <span className="fraud-bulk-bar__sep" aria-hidden />
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onArchive}>
          Archiver
        </button>
        <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={onMarkTreated}>
          Marquer traité
        </button>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onHide}>
          Masquer
        </button>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onExport}>
          Exporter
        </button>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onAddNote}>
          Ajouter une note
        </button>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm fraud-bulk-bar__danger" onClick={onDelete}>
          Supprimer
        </button>
      </div>
    </div>
  );
}

export const FraudBulkActionBar = memo(FraudBulkActionBarView);
