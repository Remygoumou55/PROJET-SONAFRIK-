"use client";

import Link from "next/link";

interface LegalConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  error?: string | null;
}

export function LegalConsentCheckbox({
  checked,
  onChange,
  id = "legal-consent",
  error = null,
}: LegalConsentCheckboxProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-start gap-3 cursor-pointer text-left"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--color-vert-energie)]"
          required
        />
        <span className="text-xs leading-relaxed" style={{ color: "var(--color-texte-secondaire)" }}>
          J&apos;accepte les{" "}
          <Link
            href="/legal/terms"
            className="underline"
            style={{ color: "var(--color-vert-energie)" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Conditions Générales
          </Link>{" "}
          et la{" "}
          <Link
            href="/legal/privacy"
            className="underline"
            style={{ color: "var(--color-vert-energie)" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            politique de confidentialité
          </Link>
          .
        </span>
      </label>
      {error ? (
        <p role="alert" style={{ fontSize: "12px", color: "var(--color-erreur)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
