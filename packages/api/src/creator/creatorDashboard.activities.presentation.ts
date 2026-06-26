import type { CreatorDashboardActivity } from "@sonafrik/types";
import type { BuildDashboardInput } from "./creatorDashboard.presentation.shared";
import { fmtGnf, profileCompletionPercent } from "./creatorDashboard.presentation.shared";

const FUTURE_MILESTONES: Omit<CreatorDashboardActivity, "occurredAt">[] = [
  {
    id: "future_track",
    icon: "🎵",
    color: "var(--color-vert-energie)",
    title: "Votre premier morceau",
    subtitle: "À venir",
    tone: "neutral",
    isFuture: true,
  },
  {
    id: "future_listen",
    icon: "👂",
    color: "var(--color-vert-energie)",
    title: "Première écoute",
    subtitle: "À venir",
    tone: "neutral",
    isFuture: true,
  },
  {
    id: "future_revenue",
    icon: "💰",
    color: "var(--color-or-solaire)",
    title: "Premiers revenus",
    subtitle: "À venir",
    tone: "neutral",
    isFuture: true,
  },
];

export function buildActivities(input: BuildDashboardInput): CreatorDashboardActivity[] {
  const { context, catalogCounts, streamStats, revenueStats, audienceStats, topTrack } = input;
  const profilePercent = profileCompletionPercent(context.artistProfile);
  const items: CreatorDashboardActivity[] = [];

  items.push({
    id: "account_created",
    title: "Compte artiste créé",
    subtitle: "Bienvenue sur SONAFRIK",
    occurredAt: context.creator.created_at,
    icon: "✓",
    color: "var(--color-vert-energie)",
    tone: "success",
  });

  items.push({
    id: "profile_progress",
    title: `Profil complété à ${profilePercent} %`,
    subtitle: profilePercent >= 100 ? "Profil complet" : "Continuez pour atteindre 100 %",
    occurredAt: context.artistProfile.updated_at,
    icon: "👤",
    color: "var(--color-or-solaire)",
    tone: "info",
    actionHref: "/creator/identity",
    actionLabel: "Compléter",
  });

  if (catalogCounts.tracksPublished > 0) {
    items.push({
      id: "first_track",
      title: "Premier morceau publié",
      subtitle: topTrack?.title ?? `${catalogCounts.tracksPublished} titre(s) en ligne`,
      occurredAt: context.creator.updated_at,
      icon: "🎵",
      color: "var(--color-vert-energie)",
      tone: "success",
      actionHref: "/creator/catalog/tracks",
      actionLabel: "Voir",
    });
  }

  if (streamStats.total_streams > 0) {
    items.push({
      id: "first_listen",
      title: "Première écoute comptabilisée",
      subtitle: "Quelqu'un a écouté votre musique",
      occurredAt: new Date().toISOString(),
      icon: "👂",
      color: "var(--color-vert-energie)",
      tone: "success",
      actionHref: "/creator/analytics",
      actionLabel: "Statistiques",
    });
  }

  if (audienceStats.total_track_likes > 0) {
    items.push({
      id: "first_like",
      title: "Premier like reçu",
      subtitle: "Un fan aime votre musique",
      occurredAt: new Date().toISOString(),
      icon: "❤️",
      color: "var(--color-erreur)",
      tone: "success",
    });
  }

  if (revenueStats.total_royalties_gnf > 0) {
    items.push({
      id: "royalties",
      title: "Premières royalties générées",
      subtitle: fmtGnf(revenueStats.total_royalties_gnf),
      occurredAt: new Date().toISOString(),
      icon: "💰",
      color: "var(--color-or-solaire)",
      tone: "success",
      actionHref: "/wallet/royalties",
      actionLabel: "Voir",
    });
  }

  if (context.artistProfile.verified) {
    items.push({
      id: "verified",
      title: "Identité vérifiée",
      subtitle: "Badge vérifié actif",
      occurredAt: context.artistProfile.verified_at ?? context.artistProfile.updated_at,
      icon: "✓",
      color: "var(--color-vert-energie)",
      tone: "success",
    });
  }

  const realEvents = items.filter((i) => !i.isFuture);
  const sorted = realEvents.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  if (sorted.length <= 2) {
    const existingIds = new Set(sorted.map((i) => i.id));
    for (const milestone of FUTURE_MILESTONES) {
      const matchKey =
        milestone.id === "future_track"
          ? "first_track"
          : milestone.id === "future_listen"
            ? "first_listen"
            : "royalties";
      if (!existingIds.has(matchKey)) {
        sorted.push({
          ...milestone,
          occurredAt: new Date().toISOString(),
        });
      }
    }
  }

  return sorted.slice(0, 10);
}
