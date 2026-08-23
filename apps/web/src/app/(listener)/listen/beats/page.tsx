import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createBeatsService } from "@sonafrik/api/beats";
import { createListenerService } from "@sonafrik/api/listener";
import { BeatStoreClient } from "@/features/listener/beats/BeatStoreClient";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Beat Store — SONAFRIK" };

/** Post-MVP — gelé par défaut (`beat_store` flag off → redirect). */
export default async function BeatStorePage({
  searchParams,
}: {
  searchParams: Promise<{ beat?: string }>;
}) {
  await requireIdentityContext();
  const { beat: highlightBeatId } = await searchParams;
  const supabase = await getSupabaseServerClient();
  const listener = createListenerService(supabase);

  if (!(await listener.isFeatureEnabled("beat_store"))) {
    return (
      <ComingSoon
        title="Beat Store"
        description="La vente de beats arrive bientôt. Restez connectés."
        emoji="🎹"
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
        <h1 className="text-2xl font-bold text-[var(--t8-pearl)]">Beat Store</h1>
        <p className="mt-1 text-sm text-[var(--t8-silver-deep)]">
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
