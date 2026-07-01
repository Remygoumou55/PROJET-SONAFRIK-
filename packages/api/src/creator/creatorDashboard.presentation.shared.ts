import type {
  CreatorAudienceStats,
  CreatorContext,
  CreatorInspirationArtist,
  CreatorMonthlyRevenuePoint,
  CreatorRevenueStats,
  CreatorStreamStats,
  CreatorTopTrack,
  StreamTimelineEntry,
} from "@sonafrik/types";
import type { CreatorCatalogCounts } from "./creatorDashboard.repository";

export interface BuildDashboardInput {
  context: CreatorContext;
  streamStats: CreatorStreamStats;
  timeline: StreamTimelineEntry[];
  audienceStats: CreatorAudienceStats;
  revenueStats: CreatorRevenueStats;
  topTrack: CreatorTopTrack | null;
  catalogCounts: CreatorCatalogCounts;
  playlistsCount: number;
  paymentConfigured: boolean;
  inspirationArtists: CreatorInspirationArtist[];
  monthlyRevenue: CreatorMonthlyRevenuePoint[];
  revenueProjectionGnf: number | null;
}

export function profileCompletionPercent(profile: {
  stage_name?: string;
  bio?: string | null;
  genres: string[];
  profile_photo?: string | null;
  cover_path?: string | null;
  banner_path?: string | null;
  social_links?: Record<string, string>;
  is_public: boolean;
}): number {
  const checks = [
    Boolean(profile.stage_name?.trim()),
    Boolean(profile.bio?.trim()),
    (profile.genres?.length ?? 0) > 0,
    Boolean(profile.profile_photo ?? profile.cover_path),
    Boolean(profile.banner_path),
    Object.keys(profile.social_links ?? {}).length > 0,
    profile.is_public,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function fmtGnf(n: number): string {
  return `${fmt(Math.round(n))} GNF`;
}

export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function trendFromDelta(delta: number | null): "up" | "down" | "flat" {
  if (delta === null || delta === 0) return "flat";
  return delta > 0 ? "up" : "down";
}
