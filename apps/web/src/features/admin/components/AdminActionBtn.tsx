interface AdminActionBtnProps {
  label: string;
  color: string;
  textColor: string;
  disabled: boolean;
  onClick: () => void;
}

export function AdminActionBtn({ label, color, textColor, disabled, onClick }: AdminActionBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
      style={{ backgroundColor: color, color: textColor }}
    >
      {label}
    </button>
  );
}
