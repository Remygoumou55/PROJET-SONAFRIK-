import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";

export default async function PaymentSettingsPage() {
  const context = await requireIdentityContext();
  const { profile } = context;
  const isArtist =
    profile.account_type === "artiste" ||
    profile.account_type === "auditeur_artiste";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portefeuille &amp; historique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-texte-secondaire text-sm">
            Consultez votre solde, vos transactions et vos recharges SONAFRIK.
          </p>
          <Link
            href="/wallet"
            className="text-vert-energie text-sm font-medium hover:underline"
          >
            Accéder à mon portefeuille →
          </Link>
        </CardContent>
      </Card>

      {isArtist ? (
        <Card>
          <CardHeader>
            <CardTitle>Comptes de retrait (artiste)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-texte-secondaire text-sm">
              Numéros enregistrés pour vos retraits de royalties. Pour les
              modifier, mettez à jour votre profil artiste.
            </p>
            <div className="space-y-3">
              <Row
                label="Orange Money"
                value={profile.orange_money_number ?? "—"}
              />
              <Row
                label="MTN Money"
                value={profile.mtn_money_number ?? "Non renseigné"}
              />
            </div>
            <Link
              href="/wallet/payout"
              className="text-vert-energie text-sm font-medium hover:underline"
            >
              Gérer les retraits →
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-bordure flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="text-texte-secondaire text-sm">{label}</span>
      <span className="text-texte-principal text-sm font-medium">{value}</span>
    </div>
  );
}
