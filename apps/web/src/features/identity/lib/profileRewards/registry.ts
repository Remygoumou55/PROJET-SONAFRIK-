import type { RewardDefinition } from "./types";

/**
 * Registre central des récompenses SONAFRIK.
 * Ajouter une entrée ici — aucun changement composant requis.
 */
export const PROFILE_REWARD_DEFINITIONS: RewardDefinition[] = [
  {
    id: "new_member",
    icon: "🌱",
    title: "Nouveau membre",
    description: "Bienvenue dans la maison de la musique guinéenne.",
    category: "loyalty",
    rarity: "common",
    audience: "all",
    order: 10,
    evaluate: () => true,
    resolveUnlockedAt: (ctx) => ctx.profile.created_at,
    unlockMessage: "Félicitations — votre aventure SONAFRIK commence ici.",
  },
  {
    id: "profile_completed",
    icon: "📝",
    title: "Profil complété",
    description: "Votre identité musicale est claire et inspirante.",
    category: "progression",
    rarity: "common",
    audience: "all",
    order: 20,
    prerequisiteRewardIds: ["new_member"],
    evaluate: (ctx) => {
      if (ctx.isArtist) {
        return !!(ctx.profile.stage_name?.trim() || ctx.profile.full_name?.trim()) &&
          !!ctx.profile.city?.trim() &&
          !!ctx.profile.bio?.trim();
      }
      return (
        !!ctx.profile.full_name?.trim() &&
        !!ctx.profile.city?.trim() &&
        !!ctx.profile.bio?.trim()
      );
    },
    resolveUnlockedAt: (ctx) => ctx.profile.updated_at,
    unlockMessage: "Vous avez franchi une nouvelle étape — votre profil raconte une histoire.",
    progressHint: "Complétez votre nom, ville et bio pour débloquer cette récompense.",
  },
  {
    id: "first_photo",
    icon: "📸",
    title: "Première photo",
    description: "Votre visage rejoint la scène SONAFRIK.",
    category: "progression",
    rarity: "common",
    audience: "all",
    order: 30,
    prerequisiteRewardIds: ["new_member"],
    evaluate: (ctx) => !!(ctx.profile.avatar_url || ctx.profile.avatar_path),
    resolveUnlockedAt: (ctx) => ctx.profile.updated_at,
    unlockMessage: "Une image vaut mille mélodies — bravo pour cette première photo.",
    progressHint: "Ajoutez une photo de profil pour humaniser votre présence.",
  },
  {
    id: "first_track",
    icon: "🎵",
    title: "Premier morceau",
    description: "Votre première œuvre est en ligne pour le monde entier.",
    category: "creation",
    rarity: "common",
    audience: "artist",
    order: 40,
    prerequisiteRewardIds: ["profile_completed"],
    evaluate: (ctx) => (ctx.activity.publishedTracks ?? 0) > 0,
    resolveUnlockedAt: (ctx) => ctx.profile.updated_at,
    unlockMessage: "Chaque grand artiste a commencé par un morceau — le vôtre est publié.",
    progressHint: "Publiez votre premier morceau depuis l'espace créateur.",
  },
  {
    id: "first_listen",
    icon: "🎧",
    title: "Première écoute",
    description: "Votre musique a trouvé ses premières oreilles.",
    category: "activity",
    rarity: "common",
    audience: "all",
    order: 50,
    prerequisiteRewardIds: ["new_member"],
    evaluate: () => false,
    unlockMessage: "La scène vous écoute — votre première écoute est enregistrée.",
    progressHint: "Continuez — votre prochaine écoute rapproche cette récompense.",
  },
  {
    id: "first_fan",
    icon: "❤️",
    title: "Premier fan",
    description: "Quelqu'un croit en votre musique — c'est le début d'une communauté.",
    category: "community",
    rarity: "rare",
    audience: "artist",
    order: 60,
    prerequisiteRewardIds: ["first_track"],
    evaluate: () => false,
    unlockMessage: "Votre premier fan est arrivé — cultivez ce lien précieux.",
    progressHint: "Partagez votre profil pour attirer vos premiers supporters.",
  },
  {
    id: "first_album",
    icon: "📀",
    title: "Premier album",
    description: "Un projet complet rejoint le catalogue SONAFRIK.",
    category: "creation",
    rarity: "rare",
    audience: "artist",
    order: 70,
    prerequisiteRewardIds: ["first_track"],
    evaluate: (ctx) => (ctx.activity.publishedAlbums ?? 0) > 0,
    resolveUnlockedAt: (ctx) => ctx.profile.updated_at,
    unlockMessage: "Un album, une empreinte — votre catalogue s'enrichit.",
    progressHint: "Publiez votre première sortie album ou EP.",
  },
  {
    id: "first_revenue",
    icon: "💰",
    title: "Premier revenu",
    description: "Vos écoutes se transforment en revenus concrets.",
    category: "activity",
    rarity: "rare",
    audience: "artist",
    order: 80,
    prerequisiteRewardIds: ["first_track"],
    evaluate: () => false,
    unlockMessage: "Votre talent se rémunère — premier revenu enregistré.",
    progressHint: "Les revenus apparaîtront après vos premières écoutes qualifiées.",
  },
  {
    id: "first_reward_trophy",
    icon: "🏆",
    title: "Première récompense",
    description: "Vous avez débloqué votre premier badge SONAFRIK.",
    category: "special",
    rarity: "special",
    audience: "all",
    order: 90,
    evaluate: (ctx) => {
      const baseCtx = ctx;
      const others = PROFILE_REWARD_DEFINITIONS.filter(
        (r) => r.id !== "first_reward_trophy" && r.id !== "new_member",
      );
      return others.some((r) => {
        if (r.audience === "artist" && !ctx.isArtist) return false;
        if (r.audience === "listener" && ctx.isArtist) return false;
        return r.evaluate(baseCtx);
      });
    },
    resolveUnlockedAt: (ctx) => ctx.profile.updated_at,
    unlockMessage: "Félicitations — vous entrez dans le cercle des membres actifs SONAFRIK.",
    progressHint: "Débloquez une récompense pour obtenir ce trophée.",
  },
  {
    id: "international_broadcast",
    icon: "🌍",
    title: "Première diffusion internationale",
    description: "Votre musique guinéenne traverse les frontières.",
    category: "special",
    rarity: "legendary",
    audience: "artist",
    order: 100,
    prerequisiteRewardIds: ["first_album"],
    evaluate: () => false,
    unlockMessage: "Guinée → Afrique → Monde — votre voix voyage.",
    progressHint: "Continuez à publier — la scène internationale vous attend.",
  },
];
