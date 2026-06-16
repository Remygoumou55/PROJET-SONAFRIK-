import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createBeatsService } from "@sonafrik/api/beats";
import { BeatStoreClient } from "@/features/marketplace/components/BeatStoreClient";

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
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-5xl mb-4">🎹</p>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF" }}>
          Beat Store
        </h1>
        <p className="text-sm max-w-xs" style={{ color: "#555555" }}>
          Le Beat Store arrive bientôt sur SONAFRIK. Les producteurs guinéens pourront
          vendre leurs instrumentaux sans commission.
        </p>
        <span
          className="mt-4 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: "#FFC20E22", color: "#FFC20E" }}
        >
          Bientôt disponible
        </span>
      </div>
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
