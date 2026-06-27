import type { CreatorCareerLevel, CreatorDashboardKpi, StreamTimelineEntry } from "@sonafrik/types";

export interface StatCardView {
  id: string;
  icon: string;
  label: string;
  value: string;
  hint: string;
  trend: "up" | "down" | "flat";
  sparkline?: StreamTimelineEntry[];
}

const STAT_IDS = ["today_streams", "followers", "tracks", "revenue_est"] as const;

const STAT_LABELS: Record<(typeof STAT_IDS)[number], string> = {
  today_streams: "Écoutes",
  followers: "Followers",
  tracks: "Morceaux",
  revenue_est: "Revenus",
};

export function buildStatCards(
  kpis: CreatorDashboardKpi[],
  timeline: StreamTimelineEntry[],
): StatCardView[] {
  const byId = new Map(kpis.map((k) => [k.id, k]));

  return STAT_IDS.map((id) => {
    const kpi = byId.get(id);
    if (!kpi) {
      return {
        id,
        icon: "📊",
        label: STAT_LABELS[id],
        value: "0",
        hint: "",
        trend: "flat" as const,
      };
    }

    const value =
      id === "revenue_est"
        ? `${kpi.numericValue.toLocaleString("fr-FR")} GNF`
        : kpi.numericValue.toLocaleString("fr-FR");

    let hint = kpi.insight;

    if (kpi.numericValue === 0 && kpi.emptyState) {
      hint = kpi.emptyState.message;
    } else if (kpi.id === "followers" && kpi.deltaPercent !== null) {
      hint = `${kpi.deltaPercent > 0 ? "+" : ""}${kpi.deltaPercent} % ${kpi.deltaLabel}`;
    }

    return {
      id,
      icon: kpi.icon,
      label: STAT_LABELS[id],
      value,
      hint,
      trend: kpi.trend,
      sparkline: id === "today_streams" ? timeline : undefined,
    };
  });
}

export function resolveNextCareerLevel(levels: CreatorCareerLevel[]): CreatorCareerLevel | null {
  const currentIndex = levels.findIndex((l) => l.isCurrent);
  if (currentIndex < 0) return null;
  return levels.slice(currentIndex + 1).find((l) => !l.unlocked) ?? null;
}

export function resolveCareerLevelNumber(levels: CreatorCareerLevel[]): number {
  const unlocked = levels.filter((l) => l.unlocked).length;
  return Math.max(1, unlocked);
}
