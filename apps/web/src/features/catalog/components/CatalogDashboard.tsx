import type { CatalogContext } from "@sonafrik/types";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import Link from "next/link";
import { Button } from "@sonafrik/ui";

export function CatalogDashboard({ context }: { context: CatalogContext }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Albums / EP" value={String(context.albumsCount)} />
        <Metric label="Singles" value={String(context.singlesCount)} />
        <Metric label="Morceaux" value={String(context.tracksCount)} />
        <Metric label="En revue" value={String(context.pendingReview)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalog OS</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild size="sm">
            <Link href="/creator/catalog/releases">Gérer les sorties</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/creator/catalog/tracks">Gérer les morceaux</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="text-texte-secondaire py-4 text-sm">
          Publiés : {context.publishedCount} · ISRC · UPC · assets audio/visuels via URLs signées
          (CDC Règle #10).
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
