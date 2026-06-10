"use client";

interface ToggleSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSetting({ label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <label className="border-bordure flex cursor-pointer items-start justify-between gap-4 rounded-lg border px-4 py-3">
      <span>
        <span className="text-texte-principal block text-sm font-medium">{label}</span>
        {description ? (
          <span className="text-texte-desactive mt-0.5 block text-xs">{description}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-vert-energie mt-1 h-4 w-4 shrink-0"
      />
    </label>
  );
}
