import type {
  AdminCockpitAlerts,
  AdminCockpitData,
  AdminCockpitKpis,
  AdminDashboardKpis,
  AdminHealthSnapshot,
  LiveControlSnapshot,
} from "@sonafrik/api/admin";
import { humanizeAuditAction } from "./humanizeAuditAction";

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
    revenueMonth: string;
    revenueChange: string | null;
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
      text: `Les inscriptions avancent bien — ${kpis.newUsersToday} nouvel${kpis.newUsersToday > 1 ? "s" : ""} auditeur${kpis.newUsersToday > 1 ? "s" : ""} aujourd'hui.`,
    });
  }
  if (alerts.pendingWithdrawals > 0) {
    tips.push({
      id: "withdrawals",
      text: `${alerts.pendingWithdrawals} demande${alerts.pendingWithdrawals > 1 ? "s" : ""} de retrait attend${alerts.pendingWithdrawals > 1 ? "ent" : ""} votre validation.`,
    });
  }
  if (alerts.pendingArtistVerif > 0) {
    tips.push({
      id: "verif",
      text: `${alerts.pendingArtistVerif} artiste${alerts.pendingArtistVerif > 1 ? "s" : ""} attend${alerts.pendingArtistVerif > 1 ? "ent" : ""} une vérification d'identité.`,
    });
  }
  if (kpis.revenueChange && parseFloat(kpis.revenueChange) > 0) {
    tips.push({
      id: "revenue",
      text: `Les revenus du mois progressent de ${kpis.revenueChange}% par rapport au mois dernier.`,
    });
  }
  if (alerts.fraudSessions > 0) {
    tips.push({
      id: "fraud",
      text: `${alerts.fraudSessions} écoute${alerts.fraudSessions > 1 ? "s" : ""} suspecte${alerts.fraudSessions > 1 ? "s" : ""} — un coup d'œil sur la fraude est recommandé.`,
    });
  }
  if (tips.length === 0) {
    tips.push({
      id: "calm",
      text: "La plateforme respire calmement. C'est le bon moment pour valider le catalogue et accompagner les nouveaux artistes.",
    });
  }
  return tips.slice(0, 4);
}

function buildPriorities(alerts: AdminCockpitAlerts, extended: AdminDashboardKpis): AdminPriorityItem[] {
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
  if (extended.pendingCatalog > 0) {
    items.push({
      id: "catalog",
      label: "Contenus en attente",
      count: extended.pendingCatalog,
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
  if (alerts.fraudSessions > 0) {
    items.push({
      id: "fraud",
      label: "Écoutes suspectes",
      count: alerts.fraudSessions,
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
): AdminTimelineItem[] {
  const items: AdminTimelineItem[] = [];

  for (const row of cockpit.recentActivity.slice(0, 6)) {
    items.push({
      id: row.id,
      label: humanizeAuditAction(row.action, row.metadata),
      time: row.created_at,
      tone: "neutral",
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
  if (live?.recentTracks[0] && items.length < 8) {
    items.unshift({
      id: `track-${live.recentTracks[0].id}`,
      label: `Nouveau morceau publié : « ${live.recentTracks[0].title} »`,
      time: live.recentTracks[0].created_at,
      tone: "success",
    });
  }
  if (alerts.fraudSessions > 0 && items.length < 8) {
    items.unshift({
      id: "syn-fraud",
      label: "Activité d'écoute suspecte détectée",
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

  const criticalAlerts =
    alerts.pendingRightsClaims + alerts.fraudSessions;
  const actionsRequired =
    alerts.pendingWithdrawals +
    alerts.pendingArtistVerif +
    extended.pendingCatalog +
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
      todayLabel: extended.pendingCatalog > 0 ? `${extended.pendingCatalog} en modération` : "Catalogue à jour",
      periodLabel: "Morceaux disponibles à l'écoute",
      humanInsight: extended.pendingCatalog > 0 ? "Des publications attendent votre feu vert" : "La musique circule",
      trend: extended.pendingCatalog > 0 ? "neutral" : "up",
      sparkline: normalizeSparkline([live?.publishedTracks ?? 0]),
    },
    {
      id: "revenue",
      title: "Revenus du mois",
      value: fmtGnf(kpis.revenueThisMonth),
      icon: "💰",
      href: "/admin/finance",
      todayLabel: fmtGnf(kpis.revenueThisMonth),
      periodLabel: kpis.revenueChange
        ? `${parseFloat(kpis.revenueChange) >= 0 ? "+" : ""}${kpis.revenueChange}% vs mois dernier`
        : "Premier mois de référence",
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
      href: "/admin/users",
      todayLabel: `${premiumRate}% des auditeurs`,
      periodLabel: "Membres payants actifs",
      humanInsight: parseFloat(premiumRate) > 5 ? "Base premium solide" : "Potentiel de conversion",
      trend: parseFloat(premiumRate) > 0 ? "up" : "neutral",
      sparkline: normalizeSparkline([kpis.premiumUsers]),
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
      activity: extended.pendingCatalog > 0 ? `${extended.pendingCatalog} en attente` : "Publié",
      status: extended.pendingCatalog > 0 ? "attention" : "ok",
    },
    {
      href: "/admin/finance",
      icon: "💰",
      label: "Finances",
      desc: "Revenus, wallet et retraits",
      stat: fmtGnf(kpis.revenueThisMonth),
      activity: alerts.pendingWithdrawals > 0 ? `${alerts.pendingWithdrawals} retrait(s)` : "Flux normal",
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
      stat: `${alerts.fraudSessions} alerte${alerts.fraudSessions > 1 ? "s" : ""}`,
      activity: "Protection de la chaîne d'écoute",
      status: alerts.fraudSessions > 0 ? "attention" : "ok",
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
    priorities: buildPriorities(alerts, extended),
    coachTips: buildCoachTips(kpis, alerts),
    timeline: synthesizeTimeline(cockpit, alerts, live),
    healthServices: mapHealthServices(health),
    modules,
    musical: {
      topTrack: live?.recentTracks[0]?.title ?? null,
      publishedCount: live?.publishedTracks ?? 0,
      validListens: live?.validListens ?? 0,
      dominantRegion: "Guinée · Conakry",
      narrative:
        live?.recentTracks[0]
          ? `« ${live.recentTracks[0].title} » vient d'entrer dans le catalogue. La scène locale pulse.`
          : "La scène guinéenne s'apprête à briller — publiez, écoutez, partagez.",
    },
    business: {
      revenueMonth: fmtGnf(kpis.revenueThisMonth),
      revenueChange: kpis.revenueChange,
      pendingWithdrawals: alerts.pendingWithdrawals,
      ledgerEntries: live?.ledgerEntries ?? 0,
      narrative:
        kpis.revenueChange && parseFloat(kpis.revenueChange) > 0
          ? "L'économie de la plateforme dépasse le mois précédent. Les artistes sont rémunérés en toute transparence."
          : "Consolidez les sorties et les abonnements Premium pour accélérer la croissance.",
    },
    governance: {
      fraudSessions: alerts.fraudSessions,
      pendingClaims: alerts.pendingRightsClaims,
      pendingVerif: alerts.pendingArtistVerif,
      pendingCatalog: extended.pendingCatalog,
      narrative:
        criticalAlerts > 0
          ? "La gouvernance est active : traitez les signaux avant qu'ils n'impactent la confiance."
          : "Plateforme sous contrôle — continuez à protéger les droits et la qualité des écoutes.",
    },
    monthlyRevenue: cockpit.monthlyRevenue,
  };
}
