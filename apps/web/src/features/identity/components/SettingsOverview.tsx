import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import type { IdentityContext } from "@sonafrik/types";

interface SettingsOverviewProps {
  context: IdentityContext;
}

const SECTIONS = [
  {
    href: "/settings/account",
    title: "Mon compte",
    description: "Vos informations personnelles et la gestion de votre compte.",
  },
  {
    href: "/settings/payment",
    title: "Paiements",
    description: "Votre portefeuille et vos moyens de retrait artiste.",
  },
  {
    href: "/settings/sessions",
    title: "Sécurité",
    description: "Appareils connectés, confidentialité et déconnexion.",
  },
  {
    href: "/settings/notifications",
    title: "Notifications",
    description: "Vos alertes et l'historique de vos messages.",
  },
  {
    href: "/settings/preferences",
    title: "Préférences",
    description: "Langue, qualité audio et expérience d'écoute.",
  },
  {
    href: "/settings/help",
    title: "Aide",
    description: "Support, informations légales et version de l'application.",
  },
] as const;

export function SettingsOverview({ context }: SettingsOverviewProps) {
  return (
    <div className="space-y-6">
      <Card className="identity-settings-summary">
        <CardHeader>
          <CardTitle>Votre espace en un coup d&apos;œil</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Metric label="Langue" value={context.preferences.language === "en" ? "English" : "Français"} />
          <Metric label="Qualité audio" value={context.preferences.audio_quality === "auto" ? "Automatique" : `${context.preferences.audio_quality} kbps`} />
          <Metric
            label="Messages non lus"
            value={String(context.unreadNotifications)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="identity-settings-card-link">
            <Card className="identity-settings-card h-full transition-colors hover:border-vert-energie/40">
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-texte-secondaire text-sm">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-texte-desactive text-xs uppercase tracking-wide">{label}</p>
      <p className="text-texte-principal mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
