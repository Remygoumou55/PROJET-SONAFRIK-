import type {
  CreatorAnalyticsData,
  CreatorAudienceStats,
  CreatorRevenueStats,
  CreatorStreamStats,
  StreamTimelineEntry,
} from "@sonafrik/types";

/** Presets calendrier global — contrôleur unique de la page Analytics. */
export type AnalyticsPeriodId = "today" | "7d" | "30d" | "90d" | "year" | "custom";

export interface AnalyticsPeriodPreset {
  id: AnalyticsPeriodId;
  label: string;
  /** Jours demandés à l'API timeline (7–90). */
  timelineDays: number;
}

export const ANALYTICS_PERIOD_PRESETS: readonly AnalyticsPeriodPreset[] = [
  { id: "today", label: "Aujourd'hui", timelineDays: 7 },
  { id: "7d", label: "7 jours", timelineDays: 7 },
  { id: "30d", label: "30 jours", timelineDays: 30 },
  { id: "90d", label: "90 jours", timelineDays: 90 },
  { id: "year", label: "Cette année", timelineDays: 90 },
] as const;

export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriodId = "30d";

export interface AnalyticsCustomRange {
  start: string;
  end: string;
}

export function getPresetById(id: AnalyticsPeriodId): AnalyticsPeriodPreset {
  return ANALYTICS_PERIOD_PRESETS.find((p) => p.id === id) ?? ANALYTICS_PERIOD_PRESETS[2]!;
}

export function getTimelineDaysForPeriod(
  periodId: AnalyticsPeriodId,
  customRange?: AnalyticsCustomRange | null,
): number {
  if (periodId === "custom" && customRange) {
    const start = new Date(customRange.start);
    const end = new Date(customRange.end);
    const diff = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
    return Math.min(90, Math.max(7, diff));
  }
  return getPresetById(periodId).timelineDays;
}

function startOfYearIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-01-01`;
}

/** Filtre les entrées timeline selon la période active. */
export function filterTimelineForPeriod(
  entries: StreamTimelineEntry[],
  periodId: AnalyticsPeriodId,
  customRange?: AnalyticsCustomRange | null,
): StreamTimelineEntry[] {
  if (entries.length === 0) return entries;

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  if (periodId === "custom" && customRange) {
    return sorted.filter((e) => e.date >= customRange.start && e.date <= customRange.end);
  }

  if (periodId === "today") {
    const last = sorted[sorted.length - 1];
    return last ? [last] : sorted.slice(-1);
  }

  if (periodId === "year") {
    const yearStart = startOfYearIso();
    const yearEntries = sorted.filter((e) => e.date >= yearStart);
    return yearEntries.length > 0 ? yearEntries : sorted;
  }

  const preset = getPresetById(periodId);
  return sorted.slice(-preset.timelineDays);
}

export interface PeriodStreamSnapshot {
  listens: number;
  validListens: number;
  label: string;
}

/** Mappe les KPI écoutes depuis les fenêtres SQL existantes (pas de nouvelle RPC). */
export function resolvePeriodStreams(
  stats: CreatorStreamStats,
  periodId: AnalyticsPeriodId,
  timeline: StreamTimelineEntry[],
  customRange?: AnalyticsCustomRange | null,
): PeriodStreamSnapshot {
  const filtered = filterTimelineForPeriod(timeline, periodId, customRange);
  const fromTimeline = {
    listens: filtered.reduce((s, e) => s + e.streams, 0),
    validListens: filtered.reduce((s, e) => s + e.valid_streams, 0),
  };

  switch (periodId) {
    case "today":
      return {
        listens: stats.today_streams,
        validListens: stats.today_streams,
        label: "aujourd'hui",
      };
    case "7d":
      return {
        listens: stats.week_streams,
        validListens: stats.valid_week_streams,
        label: "7 derniers jours",
      };
    case "30d":
      return {
        listens: stats.month_streams,
        validListens: stats.valid_month_streams,
        label: "30 derniers jours",
      };
    case "90d":
      return {
        listens: stats.quarter_streams,
        validListens: fromTimeline.validListens || stats.valid_month_streams,
        label: "90 derniers jours",
      };
    case "year":
      return {
        listens: fromTimeline.listens,
        validListens: fromTimeline.validListens,
        label: "depuis janvier",
      };
    case "custom":
      return {
        listens: fromTimeline.listens,
        validListens: fromTimeline.validListens,
        label: "période choisie",
      };
    default:
      return {
        listens: stats.month_streams,
        validListens: stats.valid_month_streams,
        label: "30 derniers jours",
      };
  }
}

export type TrendDirection = "up" | "down" | "flat";

export interface PeriodTrend {
  direction: TrendDirection;
  percent: number;
  label: string;
}

/** Tendance : compare la 1re moitié vs la 2e moitié de la période sur le graphique. */
export function computePeriodTrend(
  timeline: StreamTimelineEntry[],
  periodId: AnalyticsPeriodId,
  customRange?: AnalyticsCustomRange | null,
): PeriodTrend {
  const filtered = filterTimelineForPeriod(timeline, periodId, customRange);
  if (filtered.length < 2) {
    return { direction: "flat", percent: 0, label: "Pas assez de données" };
  }

  const mid = Math.max(1, Math.floor(filtered.length / 2));
  const first = filtered.slice(0, mid).reduce((s, e) => s + e.valid_streams, 0);
  const second = filtered.slice(mid).reduce((s, e) => s + e.valid_streams, 0);

  if (first === 0 && second === 0) {
    return { direction: "flat", percent: 0, label: "Stable" };
  }

  const percent = first > 0 ? Math.round(((second - first) / first) * 100) : second > 0 ? 100 : 0;
  const direction: TrendDirection = percent > 8 ? "up" : percent < -8 ? "down" : "flat";
  const label =
    direction === "up"
      ? `+${percent} % vs début de période`
      : direction === "down"
        ? `${percent} % vs début de période`
        : "Stable sur la période";

  return { direction, percent, label };
}

export function resolvePeriodAudience(
  stats: CreatorAudienceStats,
  periodId: AnalyticsPeriodId,
): { newFollowers: number; totalFollowers: number; label: string } {
  const use7d = periodId === "today" || periodId === "7d";
  return {
    newFollowers: use7d ? stats.new_followers_7d : stats.new_followers_30d,
    totalFollowers: stats.total_followers,
    label: use7d ? "nouveaux fans (7 j)" : "nouveaux fans (30 j)",
  };
}

export function resolvePeriodRevenue(
  stats: CreatorRevenueStats,
  periodId: AnalyticsPeriodId,
  streamSnapshot: PeriodStreamSnapshot,
): { estimated: number; balance: number; evolution: PeriodTrend } {
  let estimated = stats.estimated_monthly_gnf;

  if (periodId === "7d" || periodId === "today") {
    estimated = Math.round(streamSnapshot.validListens * stats.avg_gnf_per_listen);
  } else if (periodId === "90d" || periodId === "year" || periodId === "custom") {
    estimated = Math.round(stats.estimated_monthly_gnf * 3);
  }

  const evolution: PeriodTrend =
    estimated > 0 && stats.month_valid_streams > 0
      ? {
          direction: streamSnapshot.validListens >= stats.month_valid_streams ? "up" : "flat",
          percent: Math.round(
            ((streamSnapshot.validListens - stats.month_valid_streams) /
              Math.max(stats.month_valid_streams, 1)) *
              100,
          ),
          label:
            streamSnapshot.validListens >= stats.month_valid_streams
              ? "Au rythme actuel"
              : "En progression",
        }
      : { direction: "flat", percent: 0, label: "Premiers gains à venir" };

  return {
    estimated,
    balance: stats.wallet_balance_gnf,
    evolution,
  };
}

export function buildAnalyticsStory(
  data: CreatorAnalyticsData,
  periodId: AnalyticsPeriodId,
  customRange?: AnalyticsCustomRange | null,
): string {
  const streams = resolvePeriodStreams(data.streamStats, periodId, data.timeline, customRange);
  const trend = computePeriodTrend(data.timeline, periodId, customRange);
  const audience = resolvePeriodAudience(data.audienceStats, periodId);

  if (streams.validListens === 0) {
    return "Ta musique attend ses premières écoutes — continue à partager ton catalogue.";
  }

  if (trend.direction === "up") {
    return `Belle dynamique ! ${streams.validListens.toLocaleString("fr-FR")} écoutes ${streams.label}, en hausse.`;
  }

  if (audience.newFollowers > 0) {
    return `${streams.validListens.toLocaleString("fr-FR")} écoutes ${streams.label} · +${audience.newFollowers} nouveaux fans.`;
  }

  return `${streams.validListens.toLocaleString("fr-FR")} écoutes comptabilisées ${streams.label}.`;
}

export function formatListenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)} k`;
  return n.toLocaleString("fr-FR");
}

/** Évolution relative d'un morceau vs la moyenne du top (proxy sans RPC période). */
export function trackEvolutionBadge(
  trackValidStreams: number,
  trackTotalStreams: number,
  leaderValidStreams: number,
): { direction: TrendDirection; label: string } {
  const share = leaderValidStreams > 0 ? (trackValidStreams / leaderValidStreams) * 100 : 0;
  const validRate =
    trackTotalStreams > 0 ? (trackValidStreams / trackTotalStreams) * 100 : 0;

  if (share >= 70 && validRate >= 85) {
    return { direction: "up", label: `${Math.round(share)} % du #1` };
  }
  if (share >= 35) {
    return { direction: "flat", label: `${Math.round(share)} % du #1` };
  }
  return { direction: "down", label: `${Math.round(share)} % du #1` };
}
