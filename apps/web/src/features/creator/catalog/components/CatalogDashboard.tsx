import type { CatalogContext } from "@sonafrik/types";
import { buttonVariants, Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";
import Link from "next/link";
import { useCatalogContextSrtspLive } from "../hooks/useCatalogContextSrtspLive";

export function CatalogDashboard({ context: initialContext }: { context: CatalogContext }) {
  const { data: liveContext } = useCatalogContextSrtspLive({
    creatorId: initialContext.creatorId,
    initialData: initialContext,
  });

  const context = liveContext ?? initialContext;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Albums et mini-albums" value={String(context.albumsCount)} />
        <Metric label="Morceaux seuls" value={String(context.singlesCount)} />
        <Metric label="Morceaux" value={String(context.tracksCount)} />
        <Metric label="En attente de validation" value={String(context.pendingReview)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mon catalogue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-texte-secondaire text-sm">
            Gérez vos sorties, ajoutez vos morceaux et suivez leur publication sur SONAFRIK.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/creator/catalog/releases" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Gérer mes sorties
            </Link>
            <Link href="/creator/catalog/tracks" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Gérer mes morceaux
            </Link>
            <Link href="/creator/catalog/tracks/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Publier un morceau
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="text-texte-secondaire py-4 text-sm">
          {context.publishedCount} élément{context.publishedCount !== 1 ? "s" : ""} publié
          {context.publishedCount !== 1 ? "s" : ""} · Fichiers audio et pochettes sécurisés pour la diffusion.
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
