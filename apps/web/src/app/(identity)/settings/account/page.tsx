import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@sonafrik/ui";
import { AccountDeletionPanel } from "@/features/identity/components/AccountDeletionPanel";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";

export default async function AccountSettingsPage() {
  const context = await requireIdentityContext();
  const { profile } = context;

  const accountTypeLabels: Record<string, string> = {
    auditeur: "Auditeur",
    artiste: "Artiste",
    auditeur_artiste: "Auditeur & Artiste",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Informations du compte</CardTitle>
          <Link href="/profile/edit">
            <Button variant="outline" size="sm">Modifier le profil</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Nom complet" value={profile.full_name ?? "—"} />
          <Row label="Téléphone" value={profile.phone ?? "—"} note="🔒 Vérification requise pour modifier" />
          <Row label="Email" value={profile.email ?? "—"} />
          <Row label="Email de secours" value={profile.backup_email ?? "Non renseigné"} />
          <Row label="Langue préférée" value={profile.preferred_language ?? profile.locale ?? "fr"} />
          <Row
            label="Type de compte"
            value={accountTypeLabels[profile.account_type ?? ""] ?? (profile.account_type ?? "—")}
          />
          <Row label="Rôles" value={context.roles.join(", ") || "—"} />
        </CardContent>
      </Card>

      <AccountDeletionPanel />
    </div>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border-bordure flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="text-texte-secondaire">{label}</span>
      <div className="text-right">
        <span className="text-texte-principal font-medium">{value}</span>
        {note ? (
          <p className="text-texte-desactive mt-0.5 text-xs">{note}</p>
        ) : null}
      </div>
    </div>
  );
}
