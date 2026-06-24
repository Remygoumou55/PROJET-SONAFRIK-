import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createBeatsService } from "@sonafrik/api/beats";
import { createListenerService } from "@sonafrik/api/listener";
import { BeatStoreClient } from "@/features/marketplace/components/BeatStoreClient";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Beat Store — SONAFRIK" };

export default async function BeatStorePage({
  searchParams,
}: {
  searchParams: Promise<{ beat?: string }>;
}) {
  await requireIdentityContext();
  const { beat: highlightBeatId } = await searchParams;
  const supabase = await getSupabaseServerClient();
  const listener = createListenerService(supabase);

  const flagEnabled = await listener.isFeatureEnabled("beat_store");

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
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-texte-principal)" }}>
          Beat Store
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-texte-desactive)" }}>
          Instrumentaux de producteurs guinéens — commission 0% (CDC Règle #4)
        </p>
      </div>

      <BeatStoreClient
        beats={beats}
        purchasedIds={purchasedIds}
        highlightBeatId={highlightBeatId ?? null}
      />
    </div>
  );
}
