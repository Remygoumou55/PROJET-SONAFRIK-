interface AdminPayoutModalProps {
  type: "reject" | "mark_paid";
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminPayoutModal({ type, value, onChange, onConfirm, onCancel }: AdminPayoutModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-2xl p-6"
        style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-bordure)" }}
      >
        <h3 className="text-base font-semibold" style={{ color: "var(--color-texte-principal)" }}>
          {type === "reject" ? "Motif de rejet" : "Référence de paiement"}
        </h3>
        <input
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            backgroundColor: "var(--color-elevated)",
            border: "1px solid var(--color-bordure)",
            color: "var(--color-texte-principal)",
          }}
          placeholder={
            type === "reject"
              ? "Ex: Compte invalide, numéro incorrect…"
              : "Ex: OM-20260612-001"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={!value.trim()}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
          >
            Confirmer
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl px-4 text-sm"
            style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
