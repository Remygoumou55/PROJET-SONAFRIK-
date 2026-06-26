import type { CreatorDashboardKpi } from "@sonafrik/types";
import type { BuildDashboardInput } from "./creatorDashboard.presentation.shared";
import { deltaPercent, fmt, fmtGnf, trendFromDelta } from "./creatorDashboard.presentation.shared";

export function buildKpis(input: BuildDashboardInput): CreatorDashboardKpi[] {
  const { streamStats, audienceStats, revenueStats, catalogCounts, timeline } = input;
  const yesterday =
    timeline.length >= 2 ? timeline[timeline.length - 2]?.streams ?? 0 : 0;
  const todayDelta = deltaPercent(streamStats.today_streams, yesterday);
  const weekAvg = streamStats.week_streams > 0 ? Math.round(streamStats.week_streams / 7) : 0;
  const weekDelta = deltaPercent(streamStats.today_streams, weekAvg);

  return [
    {
      id: "today_streams",
      label: "Écoutes aujourd'hui",
      value: fmt(streamStats.today_streams),
      numericValue: streamStats.today_streams,
      deltaPercent: streamStats.today_streams > 0 ? todayDelta : null,
      deltaLabel: "par rapport à hier",
      insight:
        todayDelta !== null && todayDelta > 0
          ? "Votre audience progresse rapidement."
          : "Chaque écoute compte — partagez votre musique.",
      trend: trendFromDelta(todayDelta),
      icon: "🎧",
      emptyState:
        streamStats.today_streams === 0
          ? {
              icon: "🎵",
              message: "Votre première écoute vous attend",
              subMessage: "Publiez un morceau pour commencer",
              actionLabel: "Publier maintenant",
              actionHref: "/creator/catalog/tracks",
            }
          : undefined,
    },
    {
      id: "week_streams",
      label: "Écoutes cette semaine",
      value: fmt(streamStats.week_streams),
      numericValue: streamStats.week_streams,
      deltaPercent: streamStats.week_streams > 0 ? weekDelta : null,
      deltaLabel: "vs moyenne quotidienne",
      insight: "Votre rythme hebdomadaire se dessine ici.",
      trend: trendFromDelta(weekDelta),
      icon: "📈",
      emptyState:
        streamStats.week_streams === 0
          ? {
              icon: "📈",
              message: "Chaque grand artiste a commencé par 0",
              subMessage: "La vôtre, c'est pour bientôt.",
            }
          : undefined,
    },
    {
      id: "followers",
      label: "Followers",
      value: fmt(audienceStats.total_followers),
      numericValue: audienceStats.total_followers,
      deltaPercent:
        audienceStats.total_followers > 0
          ? deltaPercent(
              audienceStats.new_followers_7d,
              Math.max(audienceStats.new_followers_30d - audienceStats.new_followers_7d, 0),
            )
          : null,
      deltaLabel: "nouveaux cette semaine",
      insight:
        audienceStats.new_followers_7d > 0
          ? "De nouvelles personnes vous suivent."
          : "Invitez vos fans à vous suivre sur SONAFRIK.",
      trend: audienceStats.new_followers_7d > 0 ? "up" : "flat",
      icon: "💚",
      emptyState:
        audienceStats.total_followers === 0
          ? {
              icon: "💚",
              message: "Vos premiers fans arrivent",
              subMessage: "Partagez votre profil pour les trouver",
              actionLabel: "Copier mon lien profil",
              actionHref: `/listen/artist/${input.context.artistProfile.slug}`,
            }
          : undefined,
    },
    {
      id: "tracks",
      label: "Morceaux publiés",
      value: fmt(catalogCounts.tracksPublished),
      numericValue: catalogCounts.tracksPublished,
      deltaPercent: null,
      deltaLabel: "catalogue actif",
      insight:
        catalogCounts.tracksPublished === 0
          ? "Votre premier morceau vous attend."
          : "Votre catalogue prend vie.",
      trend: "flat",
      icon: "🎵",
      emptyState:
        catalogCounts.tracksPublished === 0
          ? {
              icon: "🎵",
              message: "Votre catalogue vous attend",
              subMessage: "Un seul titre suffit pour commencer",
              actionLabel: "Publier mon premier titre",
              actionHref: "/creator/catalog/tracks",
            }
          : undefined,
    },
    {
      id: "revenue_est",
      label: "Revenus estimés (mois)",
      value: fmtGnf(revenueStats.estimated_monthly_gnf),
      numericValue: revenueStats.estimated_monthly_gnf,
      deltaPercent: null,
      deltaLabel: "projection",
      insight: "Basé sur vos écoutes comptabilisées.",
      trend: revenueStats.estimated_monthly_gnf > 0 ? "up" : "flat",
      icon: "💰",
      emptyState:
        revenueStats.estimated_monthly_gnf === 0
          ? {
              icon: "💰",
              message: "Vos revenus naissent avec vos écoutes",
              subMessage: "65 % de chaque écoute vous revient",
            }
          : undefined,
    },
    {
      id: "wallet",
      label: "Disponible",
      value: fmtGnf(revenueStats.wallet_balance_gnf),
      numericValue: revenueStats.wallet_balance_gnf,
      deltaPercent: null,
      deltaLabel: "wallet",
      insight:
        revenueStats.wallet_balance_gnf > 0
          ? "Vous pouvez planifier un retrait."
          : "Vos revenus s'accumuleront avec les écoutes.",
      trend: revenueStats.wallet_balance_gnf > 0 ? "up" : "flat",
      icon: "👛",
      emptyState:
        revenueStats.wallet_balance_gnf === 0
          ? {
              icon: "👛",
              message: "Configurez où recevoir vos revenus",
              actionLabel: "Préparer mes paiements",
              actionHref: "/wallet/payout",
            }
          : undefined,
    },
  ];
}
