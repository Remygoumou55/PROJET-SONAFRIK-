import { getLaunchProgress } from "@/lib/landing/getLaunchProgress";
import { LancementHeroStats } from "@/components/lancement/LancementHeroStats";

/** Stats hero streamées — n'attendent pas la barre de progression. */
export async function LancementHeroStatsSection() {
  const progress = await getLaunchProgress();
  if (!progress) return null;

  return (
    <LancementHeroStats artistCount={progress.artistCount} trackCount={progress.trackCount} />
  );
}
