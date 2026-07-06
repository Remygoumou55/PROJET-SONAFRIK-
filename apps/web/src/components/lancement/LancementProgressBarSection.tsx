import { getLaunchProgress } from "@/lib/landing/getLaunchProgress";
import { LancementProgressBar } from "@/components/lancement/LancementProgressBar";

/** Barre de progression streamée — après le hero LCP. */
export async function LancementProgressBarSection() {
  const progress = await getLaunchProgress();

  if (!progress) {
    return (
      <p className="lancement-progress-message mb-8">Lancement en cours de préparation</p>
    );
  }

  return (
    <LancementProgressBar
      current={progress.current}
      target={progress.target}
      percentage={progress.percent}
      launched={progress.launched}
    />
  );
}
