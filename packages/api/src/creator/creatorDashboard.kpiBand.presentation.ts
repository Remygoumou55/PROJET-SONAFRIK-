import type { CreatorDashboardData, CreatorDashboardKpiTrend } from "@sonafrik/types";

export type DashboardKpiId = "streams" | "fans" | "catalog" | "revenue";

export interface DashboardKpiTileView {
  id: DashboardKpiId;
  icon: string;
  label: string;
  value: string;
  delta: string | null;
  trend: CreatorDashboardKpiTrend;
}

function formatGnf(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M GNF`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k GNF`;
  return `${Math.round(amount).toLocaleString("fr-FR")} GNF`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

/** Bandeau KPI dashboard — 4 métriques principales, sans duplication hero. */
export function buildDashboardKpiBand(data: CreatorDashboardData): DashboardKpiTileView[] {
  const { streamStats, catalogCounts, revenueStats, kpis, monthlyRevenue } = data;
  const byId = new Map(kpis.map((k) => [k.id, k]));

  const todayKpi = byId.get("today_streams");
  const followersKpi = byId.get("followers");
  const revenueKpi = byId.get("revenue_est");

  const lastMonth =
    monthlyRevenue.length >= 2
      ? (monthlyRevenue[monthlyRevenue.length - 2]?.amountGnf ?? 0)
      : 0;

  const revenueDelta =
    lastMonth > 0 && revenueStats.estimated_monthly_gnf > 0
      ? `${revenueStats.estimated_monthly_gnf >= lastMonth ? "+" : ""}${Math.round(
          ((revenueStats.estimated_monthly_gnf - lastMonth) / lastMonth) * 100,
        )} % vs mois dernier`
      : revenueStats.estimated_monthly_gnf > 0
        ? "Ce mois"
        : null;

  const streamsValue = streamStats.valid_streams > 0 ? streamStats.valid_streams : streamStats.total_streams;

  const streamsDelta =
    streamStats.today_streams > 0
      ? `+${formatCount(streamStats.today_streams)} aujourd'hui`
      : streamStats.week_streams > 0
        ? `${formatCount(streamStats.week_streams)} cette semaine`
        : null;

  const fansDelta =
    followersKpi?.deltaLabel && followersKpi.numericValue > 0
      ? followersKpi.deltaLabel
      : followersKpi?.deltaPercent !== null && followersKpi?.deltaPercent !== undefined
        ? `${followersKpi.deltaPercent > 0 ? "+" : ""}${followersKpi.deltaPercent} %`
        : null;

  const catalogDelta =
    catalogCounts.albumsPublished > 0
      ? `${catalogCounts.albumsPublished} album${catalogCounts.albumsPublished > 1 ? "s" : ""}`
      : catalogCounts.tracksPublished === 0
        ? "À publier"
        : null;

  return [
    {
      id: "streams",
      icon: "🎧",
      label: "Écoutes",
      value: formatCount(streamsValue),
      delta: streamsDelta,
      trend: todayKpi?.trend ?? (streamStats.week_streams > 0 ? "up" : "flat"),
    },
    {
      id: "fans",
      icon: "❤️",
      label: "Fans",
      value: followersKpi ? formatCount(followersKpi.numericValue) : "0",
      delta: fansDelta,
      trend: followersKpi?.trend ?? "flat",
    },
    {
      id: "catalog",
      icon: "🎵",
      label: "Catalogue",
      value: formatCount(catalogCounts.tracksPublished),
      delta: catalogDelta,
      trend: "flat",
    },
    {
      id: "revenue",
      icon: "💰",
      label: "Revenus",
      value: formatGnf(revenueStats.estimated_monthly_gnf),
      delta: revenueDelta,
      trend: revenueKpi?.trend ?? (revenueStats.estimated_monthly_gnf > 0 ? "up" : "flat"),
    },
  ];
}
