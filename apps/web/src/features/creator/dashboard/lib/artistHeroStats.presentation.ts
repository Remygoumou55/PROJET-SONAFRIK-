import type { CreatorDashboardKpi } from "@sonafrik/types";

export const HERO_HIGHLIGHT_KPI_IDS = [
  "today_streams",
  "followers",
  "tracks",
  "revenue_est",
] as const;

const HERO_HIGHLIGHT_LABELS: Record<(typeof HERO_HIGHLIGHT_KPI_IDS)[number], string> = {
  today_streams: "Écoutes",
  followers: "Fans",
  tracks: "Morceaux",
  revenue_est: "Revenus",
};

const SUPPORTED_CURRENCIES = ["GNF", "XOF", "USD", "EUR"] as const;
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

function resolvePlatformCurrency(): SupportedCurrency {
  const raw = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY?.toUpperCase();
  if (raw && SUPPORTED_CURRENCIES.includes(raw as SupportedCurrency)) {
    return raw as SupportedCurrency;
  }
  return "GNF";
}

function formatMoney(amount: number, currency: SupportedCurrency): string {
  switch (currency) {
    case "GNF":
      return `${Math.round(amount).toLocaleString("fr-FR")} GNF`;
    case "XOF":
      return `${Math.round(amount).toLocaleString("fr-FR")} XOF`;
    case "USD":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    case "EUR":
      return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
    default:
      return `${Math.round(amount).toLocaleString("fr-FR")} GNF`;
  }
}

function formatCompactCount(value: number): string {
  if (value > 999) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString("fr-FR");
}

export function selectHeroHighlightKpis(kpis: CreatorDashboardKpi[]): CreatorDashboardKpi[] {
  const byId = new Map(kpis.map((kpi) => [kpi.id, kpi]));
  return HERO_HIGHLIGHT_KPI_IDS.map((id) => byId.get(id)).filter(
    (kpi): kpi is CreatorDashboardKpi => kpi != null,
  );
}

export function getHeroHighlightLabel(kpi: CreatorDashboardKpi): string {
  const id = kpi.id as (typeof HERO_HIGHLIGHT_KPI_IDS)[number];
  return HERO_HIGHLIGHT_LABELS[id] ?? kpi.label;
}

export function getHeroHighlightValue(kpi: CreatorDashboardKpi): string {
  if (kpi.id === "revenue_est") {
    if (kpi.numericValue <= 0) return "0";
    return formatMoney(kpi.numericValue, resolvePlatformCurrency());
  }
  return formatCompactCount(kpi.numericValue);
}

export function getHeroHighlightAriaLabel(kpi: CreatorDashboardKpi): string {
  return `${getHeroHighlightLabel(kpi)} : ${getHeroHighlightValue(kpi)}`;
}
