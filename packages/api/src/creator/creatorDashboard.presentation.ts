import type {
  ArtistProfile,
  Creator,
  CreatorAudienceStats,
  CreatorContext,
  CreatorDashboardActivity,
  CreatorDashboardAssistantTip,
  CreatorDashboardCareerStep,
  CreatorDashboardData,
  CreatorDashboardGoal,
  CreatorDashboardHero,
  CreatorDashboardKpi,
  CreatorDashboardQuickAction,
  CreatorInspirationArtist,
  CreatorMonthlyRevenuePoint,
  CreatorRevenueStats,
  CreatorStreamStats,
  CreatorTopTrack,
  StreamTimelineEntry,
} from "@sonafrik/types";
import type { CreatorCatalogCounts } from "./creatorDashboard.repository";

const INSPIRATIONAL_QUOTES = [
  "Chaque écoute rapproche votre musique de ceux qui en ont besoin.",
  "La constance bat le talent quand le talent ne travaille pas.",
  "Votre prochain morceau peut changer votre trajectoire.",
  "Publiez, écoutez, progressez — SONAFRIK avance avec vous.",
  "Les fans d'aujourd'hui sont les ambassadeurs de demain.",
] as const;

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

interface BuildDashboardInput {
  context: CreatorContext;
  streamStats: CreatorStreamStats;
  timeline: StreamTimelineEntry[];
  audienceStats: CreatorAudienceStats;
  revenueStats: CreatorRevenueStats;
  topTrack: CreatorTopTrack | null;
  catalogCounts: CreatorCatalogCounts;
  paymentConfigured: boolean;
  inspirationArtists: CreatorInspirationArtist[];
  monthlyRevenue: CreatorMonthlyRevenuePoint[];
  revenueProjectionGnf: number | null;
}

export function computeRevenueProjection(
  weeklyStreams: number,
  revenueStats: CreatorRevenueStats,
): number | null {
  if (weeklyStreams <= 0) return null;

  let perStream = revenueStats.avg_gnf_per_listen;
  if (perStream <= 0 && revenueStats.month_valid_streams > 0 && revenueStats.estimated_monthly_gnf > 0) {
    perStream = revenueStats.estimated_monthly_gnf / revenueStats.month_valid_streams;
  }
  if (perStream <= 0) return null;

  return Math.round(weeklyStreams * 4 * perStream);
}

export function buildCreatorDashboardData(input: BuildDashboardInput): CreatorDashboardData {
  const hero = buildHero(input);
  return {
    context: input.context,
    hero,
    kpis: buildKpis(input),
    activities: buildActivities(input),
    goals: buildGoals(input),
    careerSteps: buildCareerSteps(input),
    assistantTips: buildAssistantTips(input, hero.profilePercent),
    quickActions: buildQuickActions(input),
    streamStats: input.streamStats,
    timeline: input.timeline,
    topTrack: input.topTrack,
    revenueStats: input.revenueStats,
    catalogCounts: input.catalogCounts,
    paymentConfigured: input.paymentConfigured,
    profileSlug: input.context.artistProfile.slug,
    inspirationArtists: input.inspirationArtists,
    monthlyRevenue: input.monthlyRevenue,
    revenueProjectionGnf: input.revenueProjectionGnf,
    profileCreatedAt: input.context.creator.created_at,
  };
}

function profileCompletionPercent(profile: ArtistProfile): number {
  const checks = [
    Boolean(profile.stage_name?.trim()),
    Boolean(profile.bio?.trim()),
    profile.genres.length > 0,
    Boolean(profile.profile_photo ?? profile.cover_path),
    Boolean(profile.banner_path),
    Object.keys(profile.social_links ?? {}).length > 0,
    profile.is_public,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function quoteForToday(): string {
  const day = new Date().getDate();
  return INSPIRATIONAL_QUOTES[day % INSPIRATIONAL_QUOTES.length] ?? INSPIRATIONAL_QUOTES[0];
}

function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function buildHero(input: BuildDashboardInput): CreatorDashboardHero {
  const { artistProfile, creator } = input.context;
  const profilePercent = profileCompletionPercent(artistProfile);
  const { tracksPublished, albumsPublished } = input.catalogCounts;
  const streams = input.streamStats.total_streams;

  let headline = "Bienvenue sur SONAFRIK.";
  let subline = "Votre univers musical prend forme ici.";
  let currentGoal = "Compléter votre profil artiste.";
  let nextStep = "Ajoutez une bio et une photo pour inspirer confiance.";

  if (tracksPublished === 0) {
    headline = "Votre scène vous attend.";
    subline = "Publiez votre premier morceau pour être découvert.";
    currentGoal = "Publier votre premier morceau.";
    nextStep = "Un titre suffit pour lancer votre présence.";
  } else if (albumsPublished === 0 && tracksPublished > 0) {
    headline = "Votre musique commence à exister.";
    subline = "Encore une sortie pour structurer votre catalogue.";
    currentGoal = "Publier votre premier EP ou album.";
    nextStep = "Regroupez vos titres en projet cohérent.";
  } else if (streams > 0 && streams < 1000) {
    headline = "Votre musique est en mouvement.";
    subline = "Les premières écoutes arrivent — continuez.";
    currentGoal = "Atteindre 1 000 écoutes.";
    nextStep = "Partagez votre lien public cette semaine.";
  } else if (streams >= 1000) {
    headline = "Votre audience grandit.";
    subline = "Vos écoutes construisent votre carrière sur SONAFRIK.";
    currentGoal = "Consolider votre croissance.";
    nextStep = "Analysez vos statistiques et préparez la suite.";
  }

  if (profilePercent < 100 && tracksPublished > 0) {
    nextStep = `Profil à ${profilePercent} % — une photo peut faire la différence.`;
  }

  return {
    greeting: `${greetingForHour()} ${artistProfile.stage_name} 🎵`,
    headline,
    subline,
    quote: quoteForToday(),
    profilePercent,
    currentGoal,
    nextStep,
    tierLabel: tierLabel(creator.tier),
    levelLabel: levelFromStreams(streams),
  };
}

function tierLabel(tier: Creator["tier"]): string {
  const map = { emergent: "Émergent", croissance: "En croissance", etabli: "Établi" } as const;
  return map[tier] ?? "Artiste";
}

function levelFromStreams(streams: number): string {
  if (streams >= 1_000_000) return "Niveau Légende";
  if (streams >= 100_000) return "Niveau Star";
  if (streams >= 10_000) return "Niveau Confirmé";
  if (streams >= 1_000) return "Niveau Montée";
  if (streams > 0) return "Niveau Départ";
  return "Niveau Débutant";
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

function fmtGnf(n: number): string {
  return `${fmt(Math.round(n))} GNF`;
}

function buildKpis(input: BuildDashboardInput): CreatorDashboardKpi[] {
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

function trendFromDelta(delta: number | null): "up" | "down" | "flat" {
  if (delta === null || delta === 0) return "flat";
  return delta > 0 ? "up" : "down";
}

function buildActivities(input: BuildDashboardInput): CreatorDashboardActivity[] {
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

function buildGoals(input: BuildDashboardInput): CreatorDashboardGoal[] {
  const { context, catalogCounts, paymentConfigured } = input;
  const profileDone = profileCompletionPercent(context.artistProfile) >= 80;

  return [
    {
      id: "publish_track",
      label: "Publier un morceau",
      completed: catalogCounts.tracksPublished > 0,
      progressPercent: catalogCounts.tracksPublished > 0 ? 100 : 0,
      rewardLabel: "Visibilité catalogue",
      href: "/creator/catalog/tracks",
      category: "weekly",
    },
    {
      id: "complete_profile",
      label: "Compléter votre profil",
      completed: profileDone,
      progressPercent: profileCompletionPercent(context.artistProfile),
      rewardLabel: "Confiance audience",
      href: "/creator/identity",
      category: "daily",
    },
    {
      id: "add_photo",
      label: "Ajouter une photo",
      completed: Boolean(context.artistProfile.cover_path),
      progressPercent: context.artistProfile.cover_path ? 100 : 0,
      rewardLabel: "Profil premium",
      href: "/creator/identity",
      category: "daily",
    },
    {
      id: "verify_identity",
      label: "Vérifier votre identité",
      completed: context.artistProfile.verified,
      progressPercent: context.artistProfile.verified ? 100 : context.pendingVerifications > 0 ? 50 : 0,
      rewardLabel: "Badge vérifié",
      href: "/creator/verification",
      category: "monthly",
    },
    {
      id: "configure_payment",
      label: "Configurer vos revenus",
      completed: paymentConfigured,
      progressPercent: paymentConfigured ? 100 : 0,
      rewardLabel: "Paiements prêts",
      href: "/wallet/payout",
      category: "monthly",
    },
  ];
}

function buildCareerSteps(input: BuildDashboardInput): CreatorDashboardCareerStep[] {
  const { context, catalogCounts, streamStats, revenueStats, audienceStats, paymentConfigured } = input;

  return [
    { id: "profile", label: "Profil", completed: profileCompletionPercent(context.artistProfile) >= 60, progressPercent: profileCompletionPercent(context.artistProfile), icon: "👤" },
    { id: "catalog", label: "Catalogue", completed: catalogCounts.tracksPublished > 0, progressPercent: catalogCounts.tracksPublished > 0 ? 100 : 0, icon: "📀" },
    { id: "identity", label: "Identité", completed: context.artistProfile.verified, progressPercent: context.artistProfile.verified ? 100 : 0, icon: "🪪" },
    { id: "payment", label: "Paiement", completed: paymentConfigured, progressPercent: paymentConfigured ? 100 : 0, icon: "💳" },
    { id: "first_track", label: "Premier morceau", completed: catalogCounts.tracksPublished > 0, progressPercent: catalogCounts.tracksPublished > 0 ? 100 : 0, icon: "🎵" },
    { id: "first_album", label: "Premier album", completed: catalogCounts.albumsPublished > 0, progressPercent: catalogCounts.albumsPublished > 0 ? 100 : 0, icon: "💿" },
    { id: "first_revenue", label: "Premier revenu", completed: revenueStats.total_royalties_gnf > 0, progressPercent: revenueStats.total_royalties_gnf > 0 ? 100 : 0, icon: "💰" },
    { id: "first_fan", label: "Premier fan", completed: audienceStats.total_followers > 0, progressPercent: audienceStats.total_followers > 0 ? 100 : 0, icon: "💚" },
    { id: "million", label: "Million d'écoutes", completed: streamStats.total_streams >= 1_000_000, progressPercent: Math.min(100, Math.round((streamStats.total_streams / 1_000_000) * 100)), icon: "🏆" },
  ];
}

function buildAssistantTips(
  input: BuildDashboardInput,
  profilePercent: number,
): CreatorDashboardAssistantTip[] {
  const tips: CreatorDashboardAssistantTip[] = [];
  const { catalogCounts, streamStats, paymentConfigured, context } = input;

  if (profilePercent < 100) {
    tips.push({
      id: "profile",
      icon: "👤",
      title: "Complétez votre profil",
      time: "2 min",
      message: `Votre profil est complété à ${profilePercent} %. Une photo et une bio inspirent confiance.`,
      actionHref: "/creator/identity",
      actionLabel: "Compléter",
      priority: "high",
    });
  }

  if (catalogCounts.tracksPublished === 0) {
    tips.push({
      id: "publish",
      icon: "🎵",
      title: "Publiez votre premier morceau",
      time: "5 min",
      message: "C'est le meilleur moyen d'être découvert. Un seul titre suffit pour commencer.",
      actionHref: "/creator/catalog/tracks",
      actionLabel: "Publier",
      priority: "high",
    });
  }

  if (!paymentConfigured) {
    tips.push({
      id: "payment",
      icon: "💰",
      title: "Configurez où recevoir vos revenus",
      time: "3 min",
      message: "Pour être prêt le jour J — Orange Money ou MTN Mobile Money.",
      actionHref: "/wallet/payout",
      actionLabel: "Configurer",
      priority: "medium",
    });
  }

  if (!context.artistProfile.verified && context.pendingVerifications === 0) {
    tips.push({
      id: "verify",
      icon: "✓",
      title: "Faites vérifier votre identité",
      time: "10 min",
      message: "Le badge vérifié rassure vos auditeurs et booste votre visibilité.",
      actionHref: "/creator/verification",
      actionLabel: "Vérifier",
      priority: "low",
    });
  }

  if (catalogCounts.tracksPublished > 0 && streamStats.week_streams === 0) {
    tips.push({
      id: "share",
      icon: "📱",
      title: "Partagez votre musique",
      time: "1 min",
      message: "Copiez le lien de votre profil et partagez-le sur WhatsApp et Facebook.",
      actionLabel: "Copier le lien",
      actionType: "copy_profile",
      priority: "medium",
    });
  }

  return tips.slice(0, 4);
}

function buildQuickActions(input: BuildDashboardInput): CreatorDashboardQuickAction[] {
  const { catalogCounts, paymentConfigured, context, revenueStats } = input;
  const profilePercent = profileCompletionPercent(context.artistProfile);
  const actions: CreatorDashboardQuickAction[] = [];

  if (catalogCounts.tracksPublished === 0) {
    actions.push({
      id: "publish",
      label: "Publier un morceau",
      description: "Lancez votre présence musicale",
      href: "/creator/catalog/tracks",
      icon: "🎵",
      variant: "primary",
    });
  } else {
    actions.push({
      id: "stats",
      label: "Voir les statistiques",
      description: "Comprenez vos écoutes",
      href: "/creator/analytics",
      icon: "📊",
      variant: "primary",
    });
  }

  if (!paymentConfigured) {
    actions.push({
      id: "payment",
      label: "Configurer paiement",
      description: "Préparez vos revenus",
      href: "/wallet/payout",
      icon: "💰",
      variant: "outline",
    });
  }

  if (profilePercent < 90) {
    actions.push({
      id: "profile",
      label: "Compléter le profil",
      description: `${profilePercent} % complété`,
      href: "/creator/identity",
      icon: "✨",
      variant: "outline",
    });
  }

  if (revenueStats.wallet_balance_gnf >= 1000) {
    actions.push({
      id: "withdraw",
      label: "Retirer mes revenus",
      description: fmtGnf(revenueStats.wallet_balance_gnf),
      href: "/wallet/payout",
      icon: "👛",
      variant: "outline",
    });
  }

  actions.push({
    id: "catalog",
    label: "Mon catalogue",
    description: "Gérer titres et albums",
    href: "/creator/catalog",
    icon: "📀",
    variant: "outline",
  });

  return actions.slice(0, 4);
}
