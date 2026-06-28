import { AdminReasonModal } from "./AdminReasonModal";

interface AdminPayoutModalProps {
  type: "reject" | "mark_paid";
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminPayoutModal({ type, value, onChange, onConfirm, onCancel }: AdminPayoutModalProps) {
  return (
    <AdminReasonModal
      title={type === "reject" ? "Motif de rejet" : "Référence de paiement"}
      placeholder={
        type === "reject" ? "Ex: Compte invalide, numéro incorrect…" : "Ex: OM-20260612-001"
      }
      confirmLabel="Confirmer"
      value={value}
      onChange={onChange}
      onConfirm={onConfirm}
      onCancel={onCancel}
      danger={type === "reject"}
    />
  );
}
