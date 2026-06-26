import type {
  CreatorDashboardAssistantTip,
  CreatorDashboardCareerStep,
  CreatorDashboardGoal,
  CreatorDashboardQuickAction,
} from "@sonafrik/types";
import type { BuildDashboardInput } from "./creatorDashboard.presentation.shared";
import { fmtGnf, profileCompletionPercent } from "./creatorDashboard.presentation.shared";

export function buildGoals(input: BuildDashboardInput): CreatorDashboardGoal[] {
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

export function buildCareerSteps(input: BuildDashboardInput): CreatorDashboardCareerStep[] {
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

export function buildAssistantTips(
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

export function buildQuickActions(input: BuildDashboardInput): CreatorDashboardQuickAction[] {
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
