import type { CreatorDashboardData } from "@sonafrik/types";

export type GlanceKpiId = "today_streams" | "followers" | "tracks" | "revenue_est";

export interface GlanceKpiView {
  id: GlanceKpiId;
  icon: string;
  label: string;
  value: string;
  sublabel: string;
  trend: "up" | "down" | "flat";
}

function formatGnf(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} GNF`;
}

export function buildGlanceKpis(data: CreatorDashboardData): GlanceKpiView[] {
  const { kpis, catalogCounts, timeline, monthlyRevenue } = data;
  const byId = new Map(kpis.map((k) => [k.id, k]));

  const yesterday =
    timeline.length >= 2 ? timeline[timeline.length - 2]?.streams ?? 0 : 0;

  const lastMonth =
    monthlyRevenue.length >= 2
      ? monthlyRevenue[monthlyRevenue.length - 2]?.amountGnf ?? 0
      : 0;

  const views: GlanceKpiView[] = [];

  const today = byId.get("today_streams");
  if (today) {
    views.push({
      id: "today_streams",
      icon: today.icon,
      label: "Écoutes aujourd'hui",
      value: today.numericValue.toLocaleString("fr-FR"),
      sublabel: `${yesterday.toLocaleString("fr-FR")} hier`,
      trend: today.trend,
    });
  }

  const followers = byId.get("followers");
  if (followers) {
    const delta =
      followers.deltaPercent !== null
        ? `${followers.deltaPercent > 0 ? "+" : ""}${followers.deltaPercent} % cette semaine`
        : "Fans engagés";
    views.push({
      id: "followers",
      icon: followers.icon,
      label: "Fans",
      value: followers.numericValue.toLocaleString("fr-FR"),
      sublabel: delta,
      trend: followers.trend,
    });
  }

  const tracks = byId.get("tracks");
  if (tracks) {
    views.push({
      id: "tracks",
      icon: tracks.icon,
      label: "Morceaux publiés",
      value: tracks.numericValue.toLocaleString("fr-FR"),
      sublabel: `${catalogCounts.albumsPublished} album${catalogCounts.albumsPublished > 1 ? "s" : ""}`,
      trend: tracks.trend,
    });
  }

  const revenue = byId.get("revenue_est");
  if (revenue) {
    views.push({
      id: "revenue_est",
      icon: revenue.icon,
      label: "Revenus du mois",
      value: formatGnf(revenue.numericValue),
      sublabel: `${formatGnf(lastMonth)} le mois dernier`,
      trend: revenue.trend,
    });
  }

  return views;
}
