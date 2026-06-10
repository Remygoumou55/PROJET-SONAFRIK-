import type { CreatorContext } from "@sonafrik/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import Link from "next/link";

export function CreatorDashboard({ context }: { context: CreatorContext }) {
  const { creator, artistProfile } = context;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{artistProfile.stage_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">{creator.tier}</Badge>
            <Badge variant="outline">{creator.status}</Badge>
            {artistProfile.verified ? (
              <Badge variant="verified">Vérifié</Badge>
            ) : (
              <Badge variant="outline">Non vérifié</Badge>
            )}
          </div>
          <p className="text-texte-secondaire text-sm">
            {artistProfile.bio ?? "Complétez votre identité artiste pour activer votre espace pro."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href="/creator/identity">Modifier l&apos;identité</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/creator/verification">Vérification</Link>
            </Button>
            <Button asChild variant="premium" size="sm">
              <Link href="/creator/catalog">Catalogue</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Équipe" value={String(context.teamCount)} />
        <Metric label="Labels" value={String(context.labelCount)} />
        <Metric label="Studios" value={String(context.studios.length)} />
        <Metric label="Vérif. en cours" value={String(context.pendingVerifications)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statut professionnel</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Row label="Nom de scène" value={artistProfile.stage_name} />
          <Row label="Slug public" value={artistProfile.slug} />
          <Row label="Visibilité" value={artistProfile.is_public ? "Public" : "Privé"} />
          <Row label="Genres" value={artistProfile.genres.join(", ") || "—"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-texte-desactive text-xs uppercase">{label}</p>
        <p className="text-texte-principal mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-texte-desactive text-xs">{label}</p>
      <p className="text-texte-principal text-sm font-medium">{value}</p>
    </div>
  );
}