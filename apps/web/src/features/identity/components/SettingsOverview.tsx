import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import type { IdentityContext } from "@sonafrik/types";

interface SettingsOverviewProps {
  context: IdentityContext;
}

const SECTIONS = [
  {
    href: "/settings/preferences",
    title: "Préférences",
    description: "Langue, audio, confidentialité et alertes contenu.",
  },
  {
    href: "/settings/notifications",
    title: "Notifications",
    description: "Centre de notifications in-app et historique.",
  },
  {
    href: "/settings/sessions",
    title: "Sessions actives",
    description: "Appareils connectés et révocation à distance.",
  },
  {
    href: "/settings/account",
    title: "Compte",
    description: "Suppression de compte et données personnelles.",
  },
] as const;

export function SettingsOverview({ context }: SettingsOverviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Résumé Identity OS</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Metric label="Langue" value={context.preferences.language === "en" ? "English" : "Français"} />
          <Metric label="Qualité audio" value={context.preferences.audio_quality} />
          <Metric
            label="Notifications non lues"
            value={String(context.unreadNotifications)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:border-vert-energie/40 h-full transition-colors">
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
      <p className="text-texte-principal mt-1 text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
