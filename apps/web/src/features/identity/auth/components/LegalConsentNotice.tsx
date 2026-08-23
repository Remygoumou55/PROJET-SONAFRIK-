import Link from "next/link";

/** Consentement implicite — affiché sous le CTA Google (sans checkbox). */
export function LegalConsentNotice() {
  return (
    <p className="auth-legal-notice text-center text-xs leading-relaxed text-[var(--t8-silver)]">
      En continuant, vous acceptez les{" "}
      <Link
        href="/legal/terms"
        className="text-[var(--t8-primary-lavender)] underline underline-offset-2 transition-opacity hover:opacity-90"
        target="_blank"
        rel="noopener noreferrer"
      >
        Conditions Générales
      </Link>{" "}
      et la{" "}
      <Link
        href="/legal/privacy"
        className="text-[var(--t8-primary-lavender)] underline underline-offset-2 transition-opacity hover:opacity-90"
        target="_blank"
        rel="noopener noreferrer"
      >
        Politique de confidentialité
      </Link>
      .
    </p>
  );
}
