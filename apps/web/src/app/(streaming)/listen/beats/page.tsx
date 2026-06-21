import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createBeatsService } from "@sonafrik/api/beats";
import { BeatStoreClient } from "@/features/marketplace/components/BeatStoreClient";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Beat Store — SONAFRIK" };

export default async function BeatStorePage() {
  await requireIdentityContext();
  const supabase = await getSupabaseServerClient();

  // Vérifier le feature flag beat_store
  // SQL requis dans Supabase Studio : voir apps/web/src/lib/sql/feature_flags.sql
  // "as never" = table absente du schéma généré → à ajouter via supabase gen types après migration
  const { data: flagRow } = await supabase
    .from("feature_flags" as never)
    .select("enabled")
    .eq("name" as never, "beat_store")
    .maybeSingle();

  const flagEnabled = (flagRow as { enabled: boolean } | null)?.enabled ?? false;

  if (!flagEnabled) {
    return (
      <ComingSoon
        emoji="🎹"
        title="Beat Store"
        description="Les producteurs guinéens pourront vendre leurs instrumentaux sur SONAFRIK, commission 0% (CDC Règle #4)."
      />
    );
  }

  const service = createBeatsService(supabase);
  const [beats, purchasedIds] = await Promise.all([
    service.listBeats({ limit: 60 }).catch(() => []),
    service.getPurchasedBeatIds().catch(() => []),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
          Beat Store
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#555555" }}>
          Instrumentaux de producteurs guinéens — commission 0% (CDC Règle #4)
        </p>
      </div>

      <BeatStoreClient beats={beats} purchasedIds={purchasedIds} />
    </div>
  );
}
