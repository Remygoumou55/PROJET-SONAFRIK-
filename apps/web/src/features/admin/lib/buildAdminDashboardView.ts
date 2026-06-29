import type {
  AdminCockpitAlerts,
  AdminCockpitData,
  AdminCockpitKpis,
  AdminDashboardKpis,
  AdminHealthSnapshot,
  LiveControlSnapshot,
} from "@sonafrik/api/admin";
import { isValidContentName } from "@/lib/content-filter";
import { filterAuditActivity } from "./filterAuditActivity";
import { humanizeAuditAction } from "./humanizeAuditAction";
import {
  LAUNCH_ARTIST_TARGET,
  LAUNCH_LISTENER_TARGET,
  LAUNCH_TRACK_TARGET,
} from "./launchTargets";

export type AdminDashboardTrend = "up" | "down" | "neutral";

export interface AdminPremiumKpiView {
  id: string;
  title: string;
  value: string;
  icon: string;
  href: string;
  todayLabel: string;
  periodLabel: string;
  humanInsight: string;
  trend: AdminDashboardTrend;
  sparkline: number[];
  alert?: boolean;
  alertMessage?: string;
  actionLabel?: string;
}

export interface AdminPriorityItem {
  id: string;
  label: string;
  count: number;
  urgency: "critical" | "warning" | "info";
  href: string;
  actionLabel: string;
}

export interface AdminTimelineItem {
  id: string;
  label: string;
  time: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
}

export interface AdminCoachTip {
  id: string;
  text: string;
  cta: string;
  href: string;
  color: string;
}

export interface AdminCategorizedAlert {
  id: string;
  count: number;
  label: string;
  icon: string;
  severity: "danger" | "warning" | "info" | "neutral";
  href: string;
  cta: string;
}

export interface AdminLaunchTargetView {
  label: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  href: string;
}

export interface AdminHealthServiceView {
  id: string;
  label: string;
  ok: boolean;
  latencyMs?: number;
  detail: string;
}

export interface AdminModuleHumanView {
  href: string;
  icon: string;
  label: string;
  desc: string;
  stat: string;
  activity: string;
  status: "ok" | "attention" | "live";
}

export interface AdminDashboardViewModel {
  hero: {
    greeting: string;
    headline: string;
    narrative: string;
    platformStatus: "excellent" | "stable" | "attention";
    criticalAlerts: number;
    actionsRequired: number;
    healthSummary: string;
  };
  kpis: AdminPremiumKpiView[];
  categorizedAlerts: AdminCategorizedAlert[];
  launchTargets: AdminLaunchTargetView[];
  priorities: AdminPriorityItem[];
  coachTips: AdminCoachTip[];
  timeline: AdminTimelineItem[];
  healthServices: AdminHealthServiceView[];
  modules: AdminModuleHumanView[];
  musical: {
    topTrack: string | null;
    publishedCount: number;
    validListens: number;
    dominantRegion: string;
    narrative: string;
  };
  business: {
    revenueChange: string | null;
    revenuePerUser: string;
    sonafrikShare: string;
    pendingWithdrawals: number;
    ledgerEntries: number;
    narrative: string;
  };
  governance: {
    fraudSessions: number;
    pendingClaims: number;
    pendingVerif: number;
    pendingCatalog: number;
    narrative: string;
  };
  monthlyRevenue: AdminCockpitData["monthlyRevenue"];
}

function fmtGnf(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M GNF`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k GNF`;
  return `${amount.toLocaleString("fr-FR")} GNF`;
}

function firstName(fullName: string): string {
  return fullName.split(/\s+/)[0] ?? fullName;
}

function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function normalizeSparkline(values: number[], points = 7): number[] {
  if (values.length === 0) return Array(points).fill(0);
  const slice = values.slice(-points);
  while (slice.length < points) slice.unshift(0);
  const max = Math.max(...slice, 1);
  return slice.map((v) => Math.round((v / max) * 100));
}

function buildCoachTips(kpis: AdminCockpitKpis, alerts: AdminCockpitAlerts): AdminCoachTip[] {
  const tips: AdminCoachTip[] = [];

  if (kpis.newUsersToday > 0) {
    tips.push({
      id: "users",
      text: `${kpis.newUsersToday} nouveau${kpis.newUsersToday > 1 ? "x" : ""} auditeur${kpis.newUsersToday > 1 ? "s" : ""} aujourd'hui`,
      cta: "Voir les inscriptions →",
      href: "/admin/users?filter=new",
      color: "var(--color-vert-energie)",
    });
  }
  if (alerts.pendingWithdrawals > 0) {
    tips.push({
      id: "withdrawals",
      text: `${alerts.pendingWithdrawals} retrait${alerts.pendingWithdrawals > 1 ? "s" : ""} en attente de validation`,
      cta: "Traiter maintenant →",
      href: "/admin/finance?filter=pending",
      color: "var(--color-admin-warning)",
    });
  }
  if (alerts.pendingArtistVerif > 0) {
    tips.push({
      id: "verif",
      text: `${alerts.pendingArtistVerif} artiste${alerts.pendingArtistVerif > 1 ? "s" : ""} attend${alerts.pendingArtistVerif > 1 ? "ent" : ""} une vérification d'identité`,
      cta: "Vérifier les profils →",
      href: "/admin/artists?filter=pending",
      color: "var(--color-admin-info)",
    });
  }
  if (kpis.revenueChange && parseFloat(kpis.revenueChange) > 0) {
    tips.push({
      id: "revenue",
      text: `Les revenus du mois progressent de ${kpis.revenueChange}% par rapport au mois dernier`,
      cta: "Voir les finances →",
      href: "/admin/finance",
      color: "var(--color-vert-energie)",
    });
  }
  if (alerts.fraudSessions > 0) {
    tips.push({
      id: "fraud",
      text: `${alerts.fraudSessions} écoute${alerts.fraudSessions > 1 ? "s" : ""} suspecte${alerts.fraudSessions > 1 ? "s" : ""} ce mois — score fraude élevé`,
      cta: "Analyser →",
      href: "/admin/fraud?filter=fraud",
      color: "var(--color-rouge-alerte)",
    });
  }
  if (kpis.premiumUsers === 0) {
    tips.push({
      id: "premium",
      text: "Aucun abonnement Premium actif — pensez à communiquer sur les offres",
      cta: "Config tarifs →",
      href: "/admin/settings",
      color: "var(--color-or-solaire)",
    });
  }
  if (tips.length === 0) {
    tips.push({
      id: "calm",
      text: "✅ Tout est en ordre. Bonne journée !",
      cta: "",
      href: "",
      color: "var(--color-vert-energie)",
    });
  }
  return tips.slice(0, 5);
}

function buildCategorizedAlerts(alerts: AdminCockpitAlerts): AdminCategorizedAlert[] {
  const rows: AdminCategorizedAlert[] = [];

  if (alerts.fraudSessions > 0) {
    rows.push({
      id: "fraud",
      count: alerts.fraudSessions,
      label: "écoutes suspectes ce mois",
      icon: "🔴",
      severity: "danger",
      href: "/admin/fraud?filter=fraud",
      cta: "Analyser la fraude →",
    });
  }
  if (alerts.pendingWithdrawals > 0) {
    rows.push({
      id: "withdrawals",
      count: alerts.pendingWithdrawals,
      label: `retrait${alerts.pendingWithdrawals > 1 ? "s" : ""} en attente`,
      icon: "🟠",
      severity: "warning",
      href: "/admin/finance?filter=pending",
      cta: "Traiter les retraits →",
    });
  }
  if (alerts.pendingCatalog > 0) {
    rows.push({
      id: "catalog",
      count: alerts.pendingCatalog,
      label: `contenu${alerts.pendingCatalog > 1 ? "s" : ""} à modérer`,
      icon: "🟡",
      severity: "info",
      href: "/admin/catalog?filter=pending",
      cta: "Modérer le catalogue →",
    });
  }
  if (alerts.pendingArtistVerif > 0) {
    rows.push({
      id: "verif",
      count: alerts.pendingArtistVerif,
      label: `artiste${alerts.pendingArtistVerif > 1 ? "s" : ""} à vérifier`,
      icon: "🔵",
      severity: "neutral",
      href: "/admin/artists?filter=pending",
      cta: "Vérifier les artistes →",
    });
  }

  return rows;
}

function buildPriorities(alerts: AdminCockpitAlerts, fraudSessionsTotal: number): AdminPriorityItem[] {
  const items: AdminPriorityItem[] = [];
  if (alerts.pendingWithdrawals > 0) {
    items.push({
      id: "withdrawals",
      label: "Retraits à valider",
      count: alerts.pendingWithdrawals,
      urgency: "warning",
      href: "/admin/finance",
      actionLabel: "Traiter les retraits",
    });
  }
  if (alerts.pendingRightsClaims > 0) {
    items.push({
      id: "claims",
      label: "Réclamations de droits",
      count: alerts.pendingRightsClaims,
      urgency: "critical",
      href: "/admin/rights",
      actionLabel: "Examiner les réclamations",
    });
  }
  if (alerts.pendingCatalog > 0) {
    items.push({
      id: "catalog",
      label: "Contenus en attente",
      count: alerts.pendingCatalog,
      urgency: "warning",
      href: "/admin/catalog",
      actionLabel: "Modérer le catalogue",
    });
  }
  if (alerts.pendingArtistVerif > 0) {
    items.push({
      id: "artists",
      label: "Artistes à vérifier",
      count: alerts.pendingArtistVerif,
      urgency: "info",
      href: "/admin/artists",
      actionLabel: "Vérifier les profils",
    });
  }
  if (fraudSessionsTotal > 0) {
    items.push({
      id: "fraud",
      label: "Écoutes signalées (SSOT)",
      count: fraudSessionsTotal,
      urgency: "critical",
      href: "/admin/fraud",
      actionLabel: "Analyser la fraude",
    });
  }
  return items;
}

function synthesizeTimeline(
  cockpit: AdminCockpitData,
  alerts: AdminCockpitAlerts,
  live: LiveControlSnapshot | null,
  fraudSessionsTotal: number,
): AdminTimelineItem[] {
  const items: AdminTimelineItem[] = [];
  const cleanActivity = filterAuditActivity(cockpit.recentActivity);

  for (const row of cleanActivity.slice(0, 6)) {
    items.push({
      id: row.id,
      label: humanizeAuditAction(row.action, row.metadata),
      time: row.created_at,
      tone: "neutral",
    });
  }

  const recentTrack = live?.recentTracks.find((track) => isValidContentName(track.title));
  if (recentTrack && items.length < 8) {
    items.unshift({
      id: `track-${recentTrack.id}`,
      label: `Nouveau morceau publié : « ${recentTrack.title} »`,
      time: recentTrack.created_at,
      tone: "success",
    });
  }
  if (alerts.pendingWithdrawals > 0 && items.length < 8) {
    items.unshift({
      id: "syn-withdraw",
      label: `${alerts.pendingWithdrawals} retrait(s) en attente de validation`,
      time: new Date().toISOString(),
      tone: "warning",
    });
  }
  if (fraudSessionsTotal > 0 && items.length < 8) {
    items.unshift({
      id: "syn-fraud",
      label: `${fraudSessionsTotal.toLocaleString("fr-FR")} session(s) signalée(s) — SSOT fraude`,
      time: new Date().toISOString(),
      tone: "danger",
    });
  }

  return items.slice(0, 10);
}

function mapHealthServices(health: AdminHealthSnapshot): AdminHealthServiceView[] {
  const labelMap: Record<string, string> = {
    "Base de données": "Base de données",
    "Supabase Storage": "Stockage des visuels",
    Wallets: "Portefeuilles artistes",
    "Paiements confirmés": "Paiements Mobile Money",
    "Chaîne royalties": "Répartition des revenus",
  };

  const services: AdminHealthServiceView[] = health.checks.map((c, i) => ({
    id: `check-${i}`,
    label: labelMap[c.label] ?? c.label,
    ok: c.ok,
    latencyMs: c.latencyMs,
    detail: c.detail ?? (c.ok ? "Opérationnel" : "À surveiller"),
  }));

  services.push({
    id: "streaming",
    label: "Écoutes & streaming",
    ok: services.some((s) => s.label === "Base de données" && s.ok),
    detail: "Sessions d'écoute actives",
  });
  services.push({
    id: "realtime",
    label: "Synchronisation instantanée",
    ok: true,
    detail: "Flux temps réel actif",
  });

  return services;
}

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
