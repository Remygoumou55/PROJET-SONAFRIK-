import type { SynchronizationEngine } from "../engine/synchronization-engine";
import { PIPELINE_TRACE_CODE, type SrtspPipelineStage } from "./pipeline-stages";

/** Lecteur diagnostic — extrait les étapes journalisées du pipeline E2E. */
export function createE2ePipelineReader(engine: SynchronizationEngine) {
  return {
    getStages(limit = 100): string[] {
      return engine
        .getJournalRecent(limit)
        .filter((entry) => entry.code === PIPELINE_TRACE_CODE)
        .map((entry) => entry.message);
    },

    includes(stage: SrtspPipelineStage | string): boolean {
      return this.getStages().includes(stage);
    },

    assertContains(stages: Array<SrtspPipelineStage | string>): void {
      const recorded = this.getStages();
      for (const stage of stages) {
        if (!recorded.includes(stage)) {
          throw new Error(`SRTSP E2E: étape manquante "${stage}". Enregistré: ${recorded.join(" → ")}`);
        }
      }
    },

    assertOrdered(subsequence: Array<SrtspPipelineStage | string>): void {
      const recorded = this.getStages();
      let cursor = 0;
      for (const stage of subsequence) {
        const idx = recorded.indexOf(stage, cursor);
        if (idx === -1) {
          throw new Error(
            `SRTSP E2E: ordre invalide — "${stage}" absent après index ${cursor}. Pipeline: ${recorded.join(" → ")}`,
          );
        }
        cursor = idx + 1;
      }
    },
  };
}

/** Vérifie la cohérence des métriques observabilité. */
export function assertMetricsCoherent(
  metrics: ReturnType<SynchronizationEngine["getMetrics"]>,
  options?: { minDelivered?: number },
): void {
  const { events, subscriptions, latency } = metrics;
  if (events.delivered < (options?.minDelivered ?? 0)) {
    throw new Error(`SRTSP metrics: delivered=${events.delivered} incohérent`);
  }
  if (events.rejected < 0 || events.dropped < 0) {
    throw new Error("SRTSP metrics: compteurs négatifs");
  }
  if (subscriptions.active < 0) {
    throw new Error("SRTSP metrics: subscriptions.active négatif");
  }
  if (latency.samples > 0 && latency.maxPropagationMs < latency.avgPropagationMs) {
    throw new Error("SRTSP metrics: maxPropagationMs < avgPropagationMs");
  }
}
