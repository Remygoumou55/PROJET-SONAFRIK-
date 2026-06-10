import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import { AccountDeletionPanel } from "@/features/identity/components/AccountDeletionPanel";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";

export default async function AccountSettingsPage() {
  const context = await requireIdentityContext();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Identifiant" value={context.profile.id} />
          <Row label="Téléphone" value={context.profile.phone ?? "—"} />
          <Row label="Email" value={context.profile.email ?? "—"} />
          <Row label="Type de compte" value={context.profile.account_type ?? "—"} />
          <Row label="Rôles" value={context.roles.join(", ") || "—"} />
        </CardContent>
      </Card>

      <AccountDeletionPanel />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-bordure flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="text-texte-secondaire">{label}</span>
      <span className="text-texte-principal font-medium capitalize">{value}</span>
    </div>
  );
}
