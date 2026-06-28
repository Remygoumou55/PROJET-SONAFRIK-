import type { GoalDefinition } from "./types";

/**
 * Registre central des objectifs SONAFRIK.
 * Ajouter un objectif ici suffit — aucun changement UI requis.
 */
export const PROFILE_GOAL_DEFINITIONS: GoalDefinition[] = [
  /* ── Profil & identité (tous) ── */
  {
    id: "profile_essentials",
    icon: "✨",
    title: "Finaliser votre profil essentiel",
    shortTitle: "Profil essentiel",
    description:
      "Un profil soigné inspire confiance et ouvre les portes de la communauté SONAFRIK.",
    cadence: "personal",
    category: "personal",
    audience: "all",
    order: 10,
    priority: 100,
    resolveProgress: (ctx) => ctx.profileCompletionPercent,
    isCompleted: (ctx) => ctx.profileCompletionPercent >= 100,
    benefits: [
      "Meilleure visibilité dans les recherches",
      "Confiance renforcée auprès de la communauté",
    ],
    nextStepHint: (ctx) =>
      ctx.profileCompletionPercent >= 80
        ? "Plus qu'un détail pour un profil complet."
        : "Ajoutez votre bio, votre ville et votre photo.",
    action: { label: "Compléter mon profil", href: "/profile/edit" },
    completionMessage: "Votre profil est prêt à briller sur SONAFRIK.",
  },
  {
    id: "musical_story",
    icon: "📖",
    title: "Raconter votre histoire musicale",
    shortTitle: "Histoire musicale",
    description:
      "Votre récit crée une connexion émotionnelle durable avec vos auditeurs.",
    cadence: "career",
    category: "career",
    audience: "all",
    order: 20,
    priority: 85,
    prerequisiteGoalIds: ["profile_essentials"],
    resolveProgress: (ctx) => (ctx.profile.bio?.trim() ? 100 : 0),
    isCompleted: (ctx) => !!ctx.profile.bio?.trim(),
    benefits: ["Connexion émotionnelle", "Différenciation sur la scène"],
    nextStepHint: () => "Partagez ce qui vous anime — vos racines, vos influences.",
    action: { label: "Rédiger mon histoire", href: "/profile/edit" },
    completionMessage: "Votre histoire inspire déjà la communauté.",
  },

  /* ── Auditeur — découverte & communauté ── */
  {
    id: "discover_guinean_music",
    icon: "🌍",
    title: "Explorer la musique guinéenne",
    shortTitle: "Découverte locale",
    description:
      "Chaque écoute nourrit l'écosystème musical guinéen et révèle de nouveaux talents.",
    cadence: "weekly",
    category: "discovery",
    audience: "listener",
    order: 30,
    priority: 90,
    prerequisiteGoalIds: ["profile_essentials"],
    resolveProgress: (ctx) => Math.min(ctx.journeyPercent, 50),
    isCompleted: (ctx) => ctx.journeyPercent >= 70,
    benefits: [
      "Découverte de nouveaux artistes",
      "Historique d'écoute personnalisé",
    ],
    nextStepHint: () => "Lancez une session d'écoute sur la page Accueil.",
    action: { label: "Explorer la musique", href: "/listen" },
    completionMessage: "Vous faites vivre la scène guinéenne.",
  },
  {
    id: "build_personal_library",
    icon: "📚",
    title: "Construire votre bibliothèque",
    shortTitle: "Bibliothèque",
    description:
      "Organisez vos morceaux préférés pour une expérience d'écoute sur mesure.",
    cadence: "monthly",
    category: "community",
    audience: "listener",
    order: 40,
    priority: 70,
    prerequisiteGoalIds: ["discover_guinean_music"],
    resolveProgress: (ctx) => Math.min(Math.max(ctx.journeyPercent - 40, 0) * 2, 100),
    isCompleted: (ctx) => ctx.journeyPercent >= 85,
    benefits: ["Accès rapide à vos favoris", "Playlists partageables"],
    nextStepHint: () => "Ajoutez vos premiers favoris depuis le lecteur.",
    action: { label: "Ouvrir ma bibliothèque", href: "/library" },
    completionMessage: "Votre bibliothèque prend forme.",
  },
  {
    id: "support_local_artists",
    icon: "💛",
    title: "Soutenir un artiste local",
    shortTitle: "Soutien direct",
    description:
      "Un pourboire ou un partage renforce directement la carrière d'un artiste guinéen.",
    cadence: "special",
    category: "community",
    audience: "listener",
    order: 50,
    priority: 60,
    prerequisiteGoalIds: ["discover_guinean_music"],
    resolveProgress: () => 0,
    isCompleted: () => false,
    benefits: [
      "Impact direct sur la carrière des artistes",
      "Relation privilégiée avec vos créateurs préférés",
    ],
    nextStepHint: () => "Utilisez « Soutenir » depuis le lecteur musical.",
    action: { label: "Découvrir des artistes", href: "/listen" },
  },

  /* ── Artiste — création & carrière ── */
  {
    id: "artist_identity",
    icon: "🎤",
    title: "Affirmer votre identité d'artiste",
    shortTitle: "Identité artiste",
    description:
      "Nom de scène, genre et région d'origine — les fondations de votre présence SONAFRIK.",
    cadence: "career",
    category: "career",
    audience: "artist",
    order: 30,
    priority: 95,
    prerequisiteGoalIds: ["profile_essentials"],
    resolveProgress: (ctx) => {
      const checks = [
        !!(ctx.profile.stage_name?.trim() || ctx.profile.full_name?.trim()),
        !!ctx.profile.main_genre?.trim(),
        !!ctx.profile.origin_region?.trim(),
      ];
      return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    },
    isCompleted: (ctx) => {
      const checks = [
        !!(ctx.profile.stage_name?.trim() || ctx.profile.full_name?.trim()),
        !!ctx.profile.main_genre?.trim(),
        !!ctx.profile.origin_region?.trim(),
      ];
      return checks.every(Boolean);
    },
    benefits: ["Page artiste crédible", "Meilleur référencement dans Explorer"],
    nextStepHint: () => "Complétez votre genre musical et votre région d'origine.",
    action: { label: "Personnaliser mon profil", href: "/profile/edit" },
    completionMessage: "Votre identité artistique est affirmée.",
  },
  {
    id: "publish_first_track",
    icon: "🎵",
    title: "Publier votre premier morceau",
    shortTitle: "Premier morceau",
    description:
      "Votre première publication vous rend visible dans le catalogue SONAFRIK.",
    cadence: "creation",
    category: "creation",
    audience: "artist",
    order: 40,
    priority: 100,
    prerequisiteGoalIds: ["artist_identity"],
    resolveProgress: (ctx) =>
      ctx.publishedTracks > 0 ? 100 : Math.min(ctx.journeyPercent, 30),
    isCompleted: (ctx) => ctx.publishedTracks > 0,
    benefits: [
      "Apparition dans le catalogue",
      "Début du comptage des écoutes",
    ],
    nextStepHint: () => "Préparez votre fichier audio et votre pochette.",
    action: { label: "Publier maintenant", href: "/creator/catalog/tracks" },
    completionMessage: "Votre musique est en ligne — bravo !",
  },
  {
    id: "grow_catalog",
    icon: "📀",
    title: "Enrichir votre catalogue",
    shortTitle: "Catalogue (5 morceaux)",
    description:
      "Un catalogue varié fidélise vos auditeurs et renforce votre présence.",
    cadence: "monthly",
    category: "creation",
    audience: "artist",
    order: 50,
    priority: 80,
    prerequisiteGoalIds: ["publish_first_track"],
    resolveProgress: (ctx) =>
      Math.min(Math.round((ctx.publishedTracks / 5) * 100), 100),
    isCompleted: (ctx) => ctx.publishedTracks >= 5,
    benefits: ["Profil artiste plus complet", "Meilleure recommandation"],
    nextStepHint: (ctx) =>
      ctx.publishedTracks >= 3
        ? `Plus que ${5 - ctx.publishedTracks} morceau(x) pour cet objectif.`
        : "Publiez régulièrement pour maintenir l'engagement.",
    action: { label: "Ajouter un morceau", href: "/creator/catalog/tracks" },
    completionMessage: "Votre catalogue prend une vraie ampleur.",
  },
  {
    id: "publish_first_album",
    icon: "💿",
    title: "Sortir votre premier album",
    shortTitle: "Premier album",
    description:
      "Un album marque une étape majeure et offre une expérience d'écoute immersive.",
    cadence: "yearly",
    category: "creation",
    audience: "artist",
    order: 60,
    priority: 75,
    prerequisiteGoalIds: ["publish_first_track"],
    resolveProgress: (ctx) => (ctx.publishedAlbums > 0 ? 100 : 0),
    isCompleted: (ctx) => ctx.publishedAlbums > 0,
    benefits: ["Présence renforcée", "Expérience album complète"],
    nextStepHint: () => "Rassemblez vos morceaux en une release cohérente.",
    action: { label: "Créer un album", href: "/creator/catalog/releases" },
    completionMessage: "Votre premier album est disponible.",
  },
  {
    id: "wallet_ready",
    icon: "💰",
    title: "Préparer votre wallet artiste",
    shortTitle: "Wallet prêt",
    description:
      "Configurez votre portefeuille pour recevoir vos revenus en toute transparence.",
    cadence: "career",
    category: "career",
    audience: "artist",
    order: 70,
    priority: 65,
    prerequisiteGoalIds: ["publish_first_track"],
    resolveProgress: (ctx) => Math.min(ctx.rewardsUnlockedCount * 25, 100),
    isCompleted: (ctx) => ctx.rewardsUnlockedCount >= 4,
    benefits: ["Suivi financier en temps réel", "Retraits sécurisés"],
    nextStepHint: () => "Consultez votre wallet et configurez vos retraits.",
    action: { label: "Voir mon wallet", href: "/wallet" },
  },

  /* ── Spécial SONAFRIK — tous profils ── */
  {
    id: "journey_milestone",
    icon: "🏆",
    title: "Atteindre 50 % de votre parcours",
    shortTitle: "Mi-parcours",
    description:
      "La moitié du chemin — votre engagement construit durablement votre présence SONAFRIK.",
    cadence: "special",
    category: "special",
    audience: "all",
    order: 80,
    priority: 50,
    prerequisiteGoalIds: ["profile_essentials"],
    resolveProgress: (ctx) => Math.min(ctx.journeyPercent * 2, 100),
    isCompleted: (ctx) => ctx.journeyPercent >= 50,
    benefits: ["Récompenses débloquées", "Visibilité accrue"],
    nextStepHint: (ctx) =>
      ctx.journeyPercent >= 40
        ? "Vous y êtes presque — continuez sur votre lancée."
        : "Chaque action compte pour avancer.",
    completionMessage: "Mi-parcours atteint — votre progression est régulière.",
  },
  {
    id: "rewards_collector",
    icon: "🎖️",
    title: "Collectionner vos premières récompenses",
    shortTitle: "Récompenses",
    description:
      "Les récompenses SONAFRIK célèbrent chaque étape de votre évolution musicale.",
    cadence: "special",
    category: "special",
    audience: "all",
    order: 90,
    priority: 45,
    prerequisiteGoalIds: ["profile_essentials"],
    resolveProgress: (ctx) => Math.min(ctx.rewardsUnlockedCount * 20, 100),
    isCompleted: (ctx) => ctx.rewardsUnlockedCount >= 5,
    benefits: ["Badges exclusifs", "Motivation renforcée"],
    nextStepHint: () => "Explorez vos récompenses disponibles sur ce profil.",
    completionMessage: "Votre collection de récompenses grandit.",
  },
];
