import type {
  AdminCockpitData,
  AdminDashboardKpis,
  AdminHealthSnapshot,
  LiveControlSnapshot,
} from "@sonafrik/api/admin";
import { isValidContentName } from "@/lib/content-filter";
import {
  LAUNCH_ARTIST_TARGET,
  LAUNCH_LISTENER_TARGET,
  LAUNCH_TRACK_TARGET,
} from "./launchTargets";
import {
  buildCategorizedAlerts,
  buildCoachTips,
  buildPriorities,
  firstName,
  fmtGnf,
  greetingForHour,
  mapHealthServices,
  normalizeSparkline,
  synthesizeTimeline,
} from "./adminDashboardView.helpers";
import type {
  AdminDashboardViewModel,
  AdminLaunchTargetView,
  AdminModuleHumanView,
  AdminPremiumKpiView,
} from "./adminDashboardView.types";

export type {
  AdminCategorizedAlert,
  AdminCoachTip,
  AdminDashboardTrend,
  AdminDashboardViewModel,
  AdminHealthServiceView,
  AdminLaunchTargetView,
  AdminModuleHumanView,
  AdminPremiumKpiView,
  AdminPriorityItem,
  AdminTimelineItem,
} from "./adminDashboardView.types";

export function buildAdminDashboardView(input: {
  adminName: string;
  cockpit: AdminCockpitData;
  extended: AdminDashboardKpis;
  health: AdminHealthSnapshot;
  live: LiveControlSnapshot | null;
}): AdminDashboardViewModel {
  const { cockpit, extended, health, live } = input;
  const { kpis, alerts } = cockpit;
  const first = firstName(input.adminName);
  /** SSOT fraude — aligné sidebar + page fraude (totalFlagged). */
  const fraudTotal = extended.fraudSessions;

  const categorizedAlerts = buildCategorizedAlerts(alerts);
  const criticalAlerts = categorizedAlerts.length;
  const actionsRequired =
    alerts.pendingWithdrawals +
    alerts.pendingArtistVerif +
    alerts.pendingCatalog +
    alerts.pendingRightsClaims;

  const platformStatus: AdminDashboardViewModel["hero"]["platformStatus"] =
    criticalAlerts > 0 ? "attention" : actionsRequired > 0 ? "stable" : "excellent";

  const healthOk = health.checks.filter((c) => c.ok).length;
  const healthTotal = Math.max(health.checks.length, 1);

  const revenueSpark = normalizeSparkline(cockpit.monthlyRevenue.map((m) => m.totalGnf));
  const usersSpark = normalizeSparkline([
    Math.max(0, kpis.totalUsers - kpis.newUsersToday * 6),
    kpis.totalUsers - kpis.newUsersToday * 5,
    kpis.totalUsers - kpis.newUsersToday * 4,
    kpis.totalUsers - kpis.newUsersToday * 3,
    kpis.totalUsers - kpis.newUsersToday * 2,
    kpis.totalUsers - kpis.newUsersToday,
    kpis.totalUsers,
  ]);

  const premiumRate =
    kpis.totalUsers > 0 ? ((kpis.premiumUsers / kpis.totalUsers) * 100).toFixed(1) : "0";

  const kpisView: AdminPremiumKpiView[] = [
    {
      id: "users",
      title: "Auditeurs",
      value: kpis.totalUsers.toLocaleString("fr-FR"),
      icon: "👥",
      href: "/admin/users",
      todayLabel: kpis.newUsersToday > 0 ? `+${kpis.newUsersToday} aujourd'hui` : "Stable aujourd'hui",
      periodLabel: `${kpis.totalUsers.toLocaleString("fr-FR")} comptes actifs`,
      humanInsight: kpis.newUsersToday > 0 ? "La communauté grandit" : "Progression normale",
      trend: kpis.newUsersToday > 0 ? "up" : "neutral",
      sparkline: usersSpark,
    },
    {
      id: "artists",
      title: "Artistes",
      value: kpis.activeArtists.toLocaleString("fr-FR"),
      icon: "🎤",
      href: "/admin/artists",
      todayLabel:
        kpis.newArtistsThisWeek > 0
          ? `+${kpis.newArtistsThisWeek} cette semaine`
          : "Pas de nouveau cette semaine",
      periodLabel: "Profils publics actifs",
      humanInsight: kpis.newArtistsThisWeek > 0 ? "Scène locale en mouvement" : "Catalogue stable",
      trend: kpis.newArtistsThisWeek > 0 ? "up" : "neutral",
      sparkline: normalizeSparkline([kpis.activeArtists - kpis.newArtistsThisWeek, kpis.activeArtists]),
    },
    {
      id: "works",
      title: "Œuvres publiées",
      value: (live?.publishedTracks ?? 0).toLocaleString("fr-FR"),
      icon: "🎵",
      href: "/admin/catalog",
      todayLabel: alerts.pendingCatalog > 0 ? `${alerts.pendingCatalog} en modération` : "Catalogue à jour",
      periodLabel: "Morceaux disponibles à l'écoute",
      humanInsight: alerts.pendingCatalog > 0 ? "Des publications attendent votre feu vert" : "La musique circule",
      trend: alerts.pendingCatalog > 0 ? "neutral" : "up",
      sparkline: normalizeSparkline([live?.publishedTracks ?? 0]),
    },
    {
      id: "revenue",
      title: "Revenus du mois",
      value: fmtGnf(kpis.revenueThisMonth),
      icon: "💰",
      href: "/admin/finance",
      todayLabel: kpis.revenueChange
        ? `${parseFloat(kpis.revenueChange) >= 0 ? "+" : ""}${kpis.revenueChange}% vs mois dernier`
        : "Premier mois de référence",
      periodLabel: "Crédits artistes ce mois",
      humanInsight:
        kpis.revenueChange && parseFloat(kpis.revenueChange) >= 0
          ? "L'économie musicale progresse"
          : "À accompagner avec de nouvelles sorties",
      trend: kpis.revenueChange && parseFloat(kpis.revenueChange) >= 0 ? "up" : "down",
      sparkline: revenueSpark,
    },
    {
      id: "wallet",
      title: "Portefeuilles",
      value: (live?.ledgerEntries ?? 0).toLocaleString("fr-FR"),
      icon: "👛",
      href: "/admin/finance",
      todayLabel: `${live?.ledgerEntries ?? 0} mouvements enregistrés`,
      periodLabel: "Historique des crédits artistes",
      humanInsight: "Transparence financière pour les créateurs",
      trend: "neutral",
      sparkline: normalizeSparkline([live?.ledgerEntries ?? 0]),
    },
    {
      id: "streams",
      title: "Écoutes aujourd'hui",
      value: extended.streamsToday.toLocaleString("fr-FR"),
      icon: "🎧",
      href: "/admin/analytics",
      todayLabel: `${extended.streamsToday.toLocaleString("fr-FR")} sessions`,
      periodLabel: `${extended.streamsTotal.toLocaleString("fr-FR")} écoutes au total`,
      humanInsight: extended.streamsToday > 0 ? "La Guinée écoute" : "Encouragez le partage",
      trend: extended.streamsToday > 0 ? "up" : "neutral",
      sparkline: normalizeSparkline([extended.streamsToday]),
    },
    {
      id: "withdrawals",
      title: "Retraits",
      value: alerts.pendingWithdrawals.toLocaleString("fr-FR"),
      icon: "💳",
      href: "/admin/finance",
      todayLabel: alerts.pendingWithdrawals > 0 ? "Action requise" : "Aucun en attente",
      periodLabel: "Demandes en attente de validation",
      humanInsight: alerts.pendingWithdrawals > 0 ? "Des artistes attendent leur paiement" : "File d'attente vide",
      trend: alerts.pendingWithdrawals > 0 ? "down" : "neutral",
      sparkline: normalizeSparkline([alerts.pendingWithdrawals]),
    },
    {
      id: "premium",
      title: "Abonnements Premium",
      value: kpis.premiumUsers.toLocaleString("fr-FR"),
      icon: "⭐",
      href: "/admin/settings",
      todayLabel:
        kpis.premiumUsers === 0
          ? "⚠️ Aucun abonnement actif"
          : `${premiumRate}% des auditeurs`,
      periodLabel: "Membres payants actifs",
      humanInsight:
        kpis.premiumUsers === 0
          ? "Alerte business — configurez et communiquez les offres"
          : parseFloat(premiumRate) > 5
            ? "Base premium solide"
            : "Potentiel de conversion",
      trend: kpis.premiumUsers === 0 ? "down" : parseFloat(premiumRate) > 0 ? "up" : "neutral",
      sparkline: normalizeSparkline([kpis.premiumUsers]),
      alert: kpis.premiumUsers === 0,
      alertMessage: "⚠️ Aucun abonnement actif",
      actionLabel: "Configurer les tarifs →",
    },
  ];

  const modules: AdminModuleHumanView[] = [
    {
      href: "/admin/users",
      icon: "👥",
      label: "Auditeurs",
      desc: "Comptes, abonnements et modération",
      stat: `${kpis.totalUsers.toLocaleString("fr-FR")} comptes`,
      activity: kpis.newUsersToday > 0 ? `+${kpis.newUsersToday} aujourd'hui` : "Stable",
      status: kpis.newUsersToday > 0 ? "live" : "ok",
    },
    {
      href: "/admin/artists",
      icon: "🎤",
      label: "Artistes",
      desc: "Vérification, tiers et carrière",
      stat: `${kpis.activeArtists.toLocaleString("fr-FR")} profils`,
      activity: alerts.pendingArtistVerif > 0 ? `${alerts.pendingArtistVerif} à vérifier` : "À jour",
      status: alerts.pendingArtistVerif > 0 ? "attention" : "ok",
    },
    {
      href: "/admin/catalog",
      icon: "🎵",
      label: "Catalogue",
      desc: "Albums, singles et modération",
      stat: `${(live?.publishedTracks ?? 0).toLocaleString("fr-FR")} morceaux`,
      activity: alerts.pendingCatalog > 0 ? `${alerts.pendingCatalog} en attente` : "Publié",
      status: alerts.pendingCatalog > 0 ? "attention" : "ok",
    },
    {
      href: "/admin/finance",
      icon: "💰",
      label: "Finances",
      desc: "Revenus, wallet et retraits",
      stat:
        alerts.pendingWithdrawals > 0
          ? `${alerts.pendingWithdrawals} retrait(s) en attente`
          : `${live?.royaltyCycles ?? 0} cycle(s) royalties`,
      activity: alerts.pendingWithdrawals > 0 ? "Action requise" : "Flux normal",
      status: alerts.pendingWithdrawals > 0 ? "attention" : "ok",
    },
    {
      href: "/admin/rights",
      icon: "⚖️",
      label: "Droits & litiges",
      desc: "Réclamations et copyright",
      stat: `${alerts.pendingRightsClaims} ouvert${alerts.pendingRightsClaims > 1 ? "s" : ""}`,
      activity: "Gouvernance créative",
      status: alerts.pendingRightsClaims > 0 ? "attention" : "ok",
    },
    {
      href: "/admin/fraud",
      icon: "🛡️",
      label: "Sécurité",
      desc: "Fraude et écoutes invalides",
      stat: `${fraudTotal.toLocaleString("fr-FR")} signalée${fraudTotal > 1 ? "s" : ""}`,
      activity: "Protection de la chaîne d'écoute",
      status: fraudTotal > 0 ? "attention" : "ok",
    },
    {
      href: "/admin/live-control",
      icon: "🎛️",
      label: "Centre live",
      desc: "Pulse de la plateforme en direct",
      stat: `${(live?.validListens ?? 0).toLocaleString("fr-FR")} écoutes valides`,
      activity: "Temps réel",
      status: "live",
    },
    {
      href: "/admin/settings",
      icon: "⚙️",
      label: "Règles métier",
      desc: "Paramètres de la plateforme",
      stat: "Configuration",
      activity: "Gouvernance SONAFRIK",
      status: "ok",
    },
  ];

  const listenerTarget = extended.launchTarget > 0 ? extended.launchTarget : LAUNCH_LISTENER_TARGET;
  const validRecentTrack = live?.recentTracks.find((track) => isValidContentName(track.title)) ?? null;

  const launchTargets: AdminLaunchTargetView[] = [
    {
      label: "Auditeurs inscrits",
      current: kpis.totalUsers,
      target: listenerTarget,
      unit: "auditeurs",
      icon: "👥",
      href: "/admin/users",
    },
    {
      label: "Artistes actifs",
      current: kpis.activeArtists,
      target: LAUNCH_ARTIST_TARGET,
      unit: "artistes",
      icon: "🎤",
      href: "/admin/artists",
    },
    {
      label: "Morceaux publiés",
      current: live?.publishedTracks ?? 0,
      target: LAUNCH_TRACK_TARGET,
      unit: "morceaux",
      icon: "🎵",
      href: "/admin/catalog",
    },
  ];

  return {
    hero: {
      greeting: `${greetingForHour()} ${first}.`,
      headline: "Bienvenue dans le Centre de Commandement SONAFRIK.",
      narrative:
        platformStatus === "excellent"
          ? "Aujourd'hui, la plateforme avance sereinement. La musique guinéenne respire à travers chaque écoute."
          : platformStatus === "stable"
            ? "Quelques actions méritent votre attention, mais l'ensemble de la plateforme reste sous contrôle."
            : "Des signaux importants demandent votre vigilance immédiate pour protéger artistes et auditeurs.",
      platformStatus,
      criticalAlerts,
      actionsRequired,
      healthSummary: `${healthOk}/${healthTotal} services opérationnels`,
    },
    kpis: kpisView,
    categorizedAlerts,
    launchTargets,
    priorities: buildPriorities(alerts, fraudTotal),
    coachTips: buildCoachTips(kpis, alerts),
    timeline: synthesizeTimeline(cockpit, alerts, live, fraudTotal),
    healthServices: mapHealthServices(health),
    modules,
    musical: {
      topTrack: validRecentTrack?.title ?? null,
      publishedCount: live?.publishedTracks ?? 0,
      validListens: live?.validListens ?? 0,
      dominantRegion: "Guinée · Conakry",
      narrative: validRecentTrack
        ? `« ${validRecentTrack.title} » vient d'entrer dans le catalogue. La scène locale pulse.`
        : "Aucun morceau valide récent — la scène guinéenne s'apprête à briller.",
    },
    business: {
      revenueChange: kpis.revenueChange,
      revenuePerUser:
        kpis.totalUsers > 0
          ? `${Math.floor(kpis.revenueThisMonth / kpis.totalUsers).toLocaleString("fr-FR")} GNF`
          : "—",
      sonafrikShare: `${Math.floor(kpis.revenueThisMonth * 0.3).toLocaleString("fr-FR")} GNF`,
      pendingWithdrawals: alerts.pendingWithdrawals,
      ledgerEntries: live?.ledgerEntries ?? 0,
      narrative:
        kpis.revenueChange && parseFloat(kpis.revenueChange) > 0
          ? "L'économie de la plateforme dépasse le mois précédent. Les artistes sont rémunérés en toute transparence."
          : "Consolidez les sorties et les abonnements Premium pour accélérer la croissance.",
    },
    governance: {
      fraudSessions: fraudTotal,
      pendingClaims: alerts.pendingRightsClaims,
      pendingVerif: alerts.pendingArtistVerif,
      pendingCatalog: alerts.pendingCatalog,
      narrative:
        criticalAlerts > 0
          ? "La gouvernance est active : traitez les signaux avant qu'ils n'impactent la confiance."
          : "Plateforme sous contrôle — continuez à protéger les droits et la qualité des écoutes.",
    },
    monthlyRevenue: cockpit.monthlyRevenue,
  };
}
