import type { MusicNavIconName } from "@/features/shared/navigation";

export type AdminNavBadgeKind = "alert" | "pending" | "live";

export interface AdminNavItem {
  href: string;
  icon: MusicNavIconName;
  label: string;
  badge: AdminNavBadgeKind | null;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export interface AdminNavFeatureFlags {
  beatStoreAdmin?: boolean;
  awardsAdmin?: boolean;
}

/** Filtre les entrées post-MVP (Beat Store, Awards) selon les feature flags admin. */
export function buildAdminNavSections(flags: AdminNavFeatureFlags = {}): AdminNavSection[] {
  return ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.href === "/admin/beatstore") return flags.beatStoreAdmin === true;
      if (item.href === "/admin/awards") return flags.awardsAdmin === true;
      return true;
    }),
  })).filter((section) => section.items.length > 0);
}

export function buildAdminModuleCards(flags: AdminNavFeatureFlags = {}) {
  return ADMIN_MODULE_CARDS.filter((card) => {
    if (card.href === "/admin/beatstore") return flags.beatStoreAdmin === true;
    if (card.href === "/admin/awards") return flags.awardsAdmin === true;
    return true;
  });
}

/** Navigation principale — 12 modules + section MVP existante (zéro régression). */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Piloter",
    items: [
      { href: "/admin", icon: "dashboard", label: "Dashboard", badge: null },
      { href: "/admin/analytics", icon: "analytics", label: "Analytiques", badge: "live" },
    ],
  },
  {
    title: "Écosystème",
    items: [
      { href: "/admin/users", icon: "users", label: "Utilisateurs", badge: null },
      { href: "/admin/artists", icon: "artists", label: "Artistes", badge: null },
      { href: "/admin/catalog", icon: "catalog", label: "Contenus", badge: "pending" },
      { href: "/admin/rights", icon: "rights", label: "Modération", badge: "alert" },
    ],
  },
  {
    title: "Flux financiers",
    items: [
      { href: "/admin/revenue", icon: "revenue", label: "Revenus", badge: null },
      { href: "/admin/withdrawals", icon: "withdrawals", label: "Retraits", badge: "pending" },
      { href: "/admin/beatstore", icon: "beatstore", label: "Beat Store", badge: null },
    ],
  },
  {
    title: "Programme",
    items: [
      { href: "/admin/awards", icon: "awards", label: "Awards", badge: null },
    ],
  },
  {
    title: "Gouvernance",
    items: [
      { href: "/admin/settings", icon: "settings", label: "Config Règles", badge: null },
      { href: "/admin/audit", icon: "audit", label: "Journal Audit", badge: null },
      { href: "/admin/health", icon: "health", label: "Santé système", badge: null },
    ],
  },
  {
    title: "Temps réel",
    items: [
      { href: "/admin/live-control", icon: "live", label: "Live Control", badge: "live" },
      { href: "/admin/fraud", icon: "fraud", label: "Fraude", badge: "alert" },
      { href: "/admin/flags", icon: "flags", label: "Flags", badge: null },
    ],
  },
];

export const ADMIN_MODULE_CARDS = [
  { href: "/admin/users", icon: "👥", label: "Utilisateurs", desc: "Gérer les comptes auditeurs" },
  { href: "/admin/artists", icon: "🎤", label: "Artistes", desc: "Gérer les artistes inscrits" },
  { href: "/admin/revenue", icon: "💰", label: "Revenus", desc: "Historique financier complet" },
  { href: "/admin/catalog", icon: "🎵", label: "Contenus", desc: "Modérer le catalogue" },
  { href: "/admin/awards", icon: "🏆", label: "Awards", desc: "Programme récompenses" },
  { href: "/admin/rights", icon: "⚖️", label: "Modération", desc: "Réclamations droits et litiges" },
  { href: "/admin/withdrawals", icon: "💳", label: "Retraits", desc: "Traiter les demandes" },
  { href: "/admin/beatstore", icon: "🎹", label: "Beat Store", desc: "Gérer les beats" },
  { href: "/admin/analytics", icon: "📊", label: "Analytiques", desc: "Données temps réel" },
  { href: "/admin/settings", icon: "⚙️", label: "Config Règles", desc: "Paramètres métiers" },
] as const;

/** Titres breadcrumb par segment de route. */
export const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin": "Centre de Commandement",
  "/admin/analytics": "Analytiques",
  "/admin/users": "Utilisateurs",
  "/admin/artists": "Artistes",
  "/admin/catalog": "Contenus",
  "/admin/moderation": "Modération",
  "/admin/finance": "Revenus",
  "/admin/withdrawals": "Retraits",
  "/admin/beatstore": "Beat Store",
  "/admin/awards": "Awards",
  "/admin/revenue": "Revenus",
  "/admin/content": "Contenus",
  "/admin/config": "Config Règles",
  "/admin/settings": "Config Règles",
  "/admin/audit": "Journal Audit",
  "/admin/health": "Santé système",
  "/admin/live-control": "Live Control",
  "/admin/fraud": "Fraude",
  "/admin/rights": "Modération",
  "/admin/flags": "Flags",
};
