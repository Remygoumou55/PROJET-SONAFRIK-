import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

export default function HelpSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aide &amp; support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-texte-secondaire text-sm">
            Une question ou un problème ? Notre équipe est disponible par email.
          </p>
          <a
            href="mailto:support@sonafrik.com"
            className="text-vert-energie text-sm font-medium hover:underline"
          >
            Contacter le support → support@sonafrik.com
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations légales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-texte-desactive text-xs">
            Les documents légaux complets seront disponibles avant le lancement public.
          </p>
          <div className="space-y-3">
            <LegalLink href="/legal/terms" label="Conditions d'utilisation (CGU)" />
            <LegalLink href="/legal/privacy" label="Politique de confidentialité" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row label="Application" value="SONAFRIK" />
          <Row label="Version" value={APP_VERSION} />
          <Row label="Plateforme" value="Web" />
        </CardContent>
      </Card>
    </div>
  );
}

function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-texte-secondaire hover:text-texte-principal flex items-center justify-between text-sm transition-colors"
    >
      {label}
      <span className="text-texte-desactive">→</span>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-bordure flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="text-texte-secondaire text-sm">{label}</span>
      <span className="text-texte-principal text-sm font-medium">{value}</span>
    </div>
  );
}
