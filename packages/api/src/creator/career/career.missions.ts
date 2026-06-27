import type { BuildDashboardInput } from "../creatorDashboard.presentation.shared";
import { profileCompletionPercent } from "../creatorDashboard.presentation.shared";

/** Contexte métier normalisé pour le Career Engine */
export interface CareerEngineContext {
  profilePercent: number;
  hasPhoto: boolean;
  hasCover: boolean;
  tracksPublished: number;
  albumsPublished: number;
  playlistsCount: number;
  totalStreams: number;
  totalFollowers: number;
  verified: boolean;
  paymentConfigured: boolean;
  totalRoyaltiesGnf: number;
  weekStreams: number;
  newFollowers7d: number;
  profileSlug: string;
}

export function buildCareerEngineContext(input: BuildDashboardInput): CareerEngineContext {
  const { context, catalogCounts, streamStats, audienceStats, revenueStats, paymentConfigured } =
    input;
  const profile = context.artistProfile;

  return {
    profilePercent: profileCompletionPercent(profile),
    hasPhoto: Boolean(profile.profile_photo ?? profile.cover_path),
    hasCover: Boolean(
      profile.banner_path || profile.cover_images.length > 0 || profile.cover_path,
    ),
    tracksPublished: catalogCounts.tracksPublished,
    albumsPublished: catalogCounts.albumsPublished,
    playlistsCount: input.playlistsCount,
    totalStreams: streamStats.total_streams,
    totalFollowers: audienceStats.total_followers,
    verified: profile.verified,
    paymentConfigured,
    totalRoyaltiesGnf: revenueStats.total_royalties_gnf,
    weekStreams: streamStats.week_streams,
    newFollowers7d: audienceStats.new_followers_7d,
    profileSlug: profile.slug,
  };
}

export type CareerMissionProgress = {
  current: number;
  target: number;
  completed: boolean;
  progressPercent: number;
};

export type CareerMissionDefinition = {
  id: string;
  label: string;
  whyImportant: string;
  icon: string;
  href: string | ((ctx: CareerEngineContext) => string);
  actionLabel: string;
  rewardBadge: string;
  evaluate: (ctx: CareerEngineContext) => CareerMissionProgress;
};

function pct(current: number, target: number): number {
  if (target <= 0) return current > 0 ? 100 : 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function done(current: number, target: number): CareerMissionProgress {
  const completed = current >= target;
  return {
    current: Math.min(current, target),
    target,
    completed,
    progressPercent: completed ? 100 : pct(current, target),
  };
}

export const CAREER_MISSION_DEFINITIONS: CareerMissionDefinition[] = [
  {
    id: "account",
    label: "Créer son compte",
    whyImportant: "Votre espace artiste SONAFRIK est prêt — c'est la base de votre carrière.",
    icon: "✨",
    href: "/creator",
    actionLabel: "Explorer l'espace",
    rewardBadge: "Compte actif",
    evaluate: () => done(1, 1),
  },
  {
    id: "complete_profile",
    label: "Compléter son profil",
    whyImportant: "Un profil complet inspire confiance et augmente vos chances d'être découvert.",
    icon: "👤",
    href: "/creator/identity",
    actionLabel: "Compléter le profil",
    rewardBadge: "Profil soigné",
    evaluate: (ctx) => done(ctx.profilePercent, 80),
  },
  {
    id: "add_photo",
    label: "Ajouter une photo",
    whyImportant: "Une photo de profil rend votre identité artistique reconnaissable partout.",
    icon: "📸",
    href: "/creator/identity",
    actionLabel: "Ajouter une photo",
    rewardBadge: "Visage visible",
    evaluate: (ctx) => done(ctx.hasPhoto ? 1 : 0, 1),
  },
  {
    id: "add_cover",
    label: "Ajouter une couverture",
    whyImportant: "Une couverture soignée donne immédiatement un look professionnel à votre page.",
    icon: "🖼",
    href: "/creator/identity",
    actionLabel: "Ajouter une couverture",
    rewardBadge: "Vitrine premium",
    evaluate: (ctx) => done(ctx.hasCover ? 1 : 0, 1),
  },
  {
    id: "publish_first_track",
    label: "Publier un premier morceau",
    whyImportant:
      "Les artistes ayant publié au moins un morceau reçoivent beaucoup plus de visibilité.",
    icon: "🎵",
    href: "/creator/catalog/tracks",
    actionLabel: "Publier maintenant",
    rewardBadge: "Premier titre",
    evaluate: (ctx) => done(ctx.tracksPublished, 1),
  },
  {
    id: "first_listen",
    label: "Obtenir sa première écoute",
    whyImportant: "Chaque écoute compte — partagez votre musique pour lancer la dynamique.",
    icon: "🎧",
    href: (ctx) => `/listen/artist/${ctx.profileSlug}`,
    actionLabel: "Partager mon profil",
    rewardBadge: "Première écoute",
    evaluate: (ctx) => done(ctx.totalStreams, 1),
  },
  {
    id: "first_follower",
    label: "Obtenir son premier follower",
    whyImportant: "Votre première communauté commence avec une seule personne qui vous suit.",
    icon: "💚",
    href: (ctx) => `/listen/artist/${ctx.profileSlug}`,
    actionLabel: "Inviter des fans",
    rewardBadge: "Premier fan",
    evaluate: (ctx) => done(ctx.totalFollowers, 1),
  },
  {
    id: "verify_identity",
    label: "Faire vérifier son identité",
    whyImportant: "Le badge vérifié rassure les auditeurs et renforce votre crédibilité.",
    icon: "✓",
    href: "/creator/verification",
    actionLabel: "Lancer la vérification",
    rewardBadge: "Identité vérifiée",
    evaluate: (ctx) => done(ctx.verified ? 1 : 0, 1),
  },
  {
    id: "configure_payments",
    label: "Configurer les paiements",
    whyImportant: "Préparez vos revenus dès maintenant pour encaisser sans stress le jour J.",
    icon: "💳",
    href: "/wallet/payout",
    actionLabel: "Configurer",
    rewardBadge: "Paiements prêts",
    evaluate: (ctx) => done(ctx.paymentConfigured ? 1 : 0, 1),
  },
  {
    id: "first_revenue",
    label: "Recevoir son premier revenu",
    whyImportant: "Votre musique génère de la valeur — chaque écoute peut devenir un revenu.",
    icon: "💰",
    href: "/wallet",
    actionLabel: "Voir mon wallet",
    rewardBadge: "Premier revenu",
    evaluate: (ctx) => done(ctx.totalRoyaltiesGnf > 0 ? 1 : 0, 1),
  },
  {
    id: "publish_album",
    label: "Publier un album",
    whyImportant: "Un album montre votre univers complet et fidélise votre audience.",
    icon: "💿",
    href: "/creator/catalog/releases",
    actionLabel: "Créer un album",
    rewardBadge: "Album publié",
    evaluate: (ctx) => done(ctx.albumsPublished, 1),
  },
  {
    id: "create_playlist",
    label: "Créer une playlist",
    whyImportant: "Les playlists aident vos fans à découvrir plus de titres en une seule session.",
    icon: "📋",
    href: "/library",
    actionLabel: "Créer une playlist",
    rewardBadge: "Curateur",
    evaluate: (ctx) => done(ctx.playlistsCount, 1),
  },
  {
    id: "reach_100_listens",
    label: "Atteindre 100 écoutes",
    whyImportant: "Cent écoutes, c'est le signe que votre musique trouve déjà son public.",
    icon: "🔥",
    href: "/creator/analytics",
    actionLabel: "Voir les stats",
    rewardBadge: "100 écoutes",
    evaluate: (ctx) => done(ctx.totalStreams, 100),
  },
  {
    id: "reach_1000_listens",
    label: "Atteindre 1 000 écoutes",
    whyImportant: "Vous entrez dans une dynamique de croissance — continuez sur cette lancée.",
    icon: "⭐",
    href: "/creator/analytics",
    actionLabel: "Analyser la croissance",
    rewardBadge: "1 000 écoutes",
    evaluate: (ctx) => done(ctx.totalStreams, 1000),
  },
  {
    id: "grow_community",
    label: "Développer sa communauté",
    whyImportant: "Une communauté engagée transforme des auditeurs en ambassadeurs de votre musique.",
    icon: "🌍",
    href: (ctx) => `/listen/artist/${ctx.profileSlug}`,
    actionLabel: "Animer ma communauté",
    rewardBadge: "Communauté active",
    evaluate: (ctx) => done(ctx.totalFollowers, 10),
  },
];

export function resolveMissionHref(
  def: CareerMissionDefinition,
  ctx: CareerEngineContext,
): string {
  return typeof def.href === "function" ? def.href(ctx) : def.href;
}
