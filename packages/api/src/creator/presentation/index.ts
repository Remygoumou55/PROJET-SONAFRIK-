/** Exports client-safe — fonctions pures, sans Supabase ni repository. */
export { buildGlanceKpis, type GlanceKpiView, type GlanceKpiId } from "../creatorDashboard.glance.presentation";
export {
  buildDashboardKpiBand,
  type DashboardKpiTileView,
  type DashboardKpiId,
} from "../creatorDashboard.kpiBand.presentation";
export {
  buildStatCards,
  resolveNextCareerLevel,
  resolveCareerLevelNumber,
  type StatCardView,
} from "../creatorDashboard.stats-cards.presentation";
export {
  buildHeroVitrineBadges,
  formatMemberSince,
  resolveArtistTypeLabel,
  type HeroVitrineBadge,
} from "../creatorDashboard.vitrine.presentation";
