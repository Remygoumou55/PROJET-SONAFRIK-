import type { SrtspMetrics, SrtspMonitorSnapshot } from "../types";
import type { SynchronizationEngine } from "../engine/synchronization-engine";

/** API métriques interne — exposition sans UI graphique. */
export interface SrtspMetricsApi {
  getSnapshot(): SrtspMonitorSnapshot;
  getMetrics(): SrtspMetrics;
  getJournal(): ReturnType<SynchronizationEngine["getJournalRecent"]>;
}

export function createMetricsApi(engine: SynchronizationEngine): SrtspMetricsApi {
  return {
    getSnapshot: () => engine.getSnapshot(),
    getMetrics: () => engine.getMetrics(),
    getJournal: () => engine.getJournalRecent(),
  };
}
