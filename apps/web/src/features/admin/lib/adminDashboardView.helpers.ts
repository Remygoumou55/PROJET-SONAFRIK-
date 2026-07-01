import type {
  AdminCockpitAlerts,
  AdminCockpitData,
  AdminCockpitKpis,
  AdminHealthSnapshot,
  LiveControlSnapshot,
} from "@sonafrik/api/admin";
import { isValidContentName } from "@/lib/content-filter";
import { filterAuditActivity } from "./filterAuditActivity";
import { humanizeAuditAction } from "./humanizeAuditAction";
import type {
  AdminCategorizedAlert,
  AdminCoachTip,
  AdminHealthServiceView,
  AdminPriorityItem,
  AdminTimelineItem,
} from "./adminDashboardView.types";

export function fmtGnf(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M GNF`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k GNF`;
  return `${amount.toLocaleString("fr-FR")} GNF`;
}

export function firstName(fullName: string): string {
  return fullName.split(/\s+/)[0] ?? fullName;
}

export function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function normalizeSparkline(values: number[], points = 7): number[] {
  if (values.length === 0) return Array(points).fill(0);
  const slice = values.slice(-points);
  while (slice.length < points) slice.unshift(0);
  const max = Math.max(...slice, 1);
  return slice.map((v) => Math.round((v / max) * 100));
}

export function buildCoachTips(kpis: AdminCockpitKpis, alerts: AdminCockpitAlerts): AdminCoachTip[] {
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
      text: `${alerts.fraudSessions} session${alerts.fraudSessions > 1 ? "s" : ""} signalée${alerts.fraudSessions > 1 ? "s" : ""} — supervision fraude`,
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

export function buildCategorizedAlerts(alerts: AdminCockpitAlerts): AdminCategorizedAlert[] {
  const rows: AdminCategorizedAlert[] = [];

  if (alerts.fraudSessions > 0) {
    rows.push({
      id: "fraud",
      count: alerts.fraudSessions,
      label: "sessions signalées (SSOT)",
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

export function buildPriorities(
  alerts: AdminCockpitAlerts,
  fraudSessionsTotal: number,
): AdminPriorityItem[] {
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

export function synthesizeTimeline(
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

export function mapHealthServices(health: AdminHealthSnapshot): AdminHealthServiceView[] {
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
