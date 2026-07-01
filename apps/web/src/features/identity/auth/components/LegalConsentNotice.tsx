import Link from "next/link";

/** Consentement implicite — affiché sous le CTA Google (sans checkbox). */
export function LegalConsentNotice() {
  return (
    <p className="auth-legal-notice text-center text-xs leading-relaxed text-texte-secondaire">
      En continuant, vous acceptez les{" "}
      <Link
        href="/legal/terms"
        className="text-vert-energie underline underline-offset-2 transition-opacity hover:opacity-90"
        target="_blank"
        rel="noopener noreferrer"
      >
        Conditions Générales
      </Link>{" "}
      et la{" "}
      <Link
        href="/legal/privacy"
        className="text-vert-energie underline underline-offset-2 transition-opacity hover:opacity-90"
        target="_blank"
        rel="noopener noreferrer"
      >
        Politique de confidentialité
      </Link>
      .
    </p>
  );
}
