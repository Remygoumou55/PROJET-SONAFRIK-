export type AdminNavBadgeKind = "alert" | "pending" | "live";

export interface AdminNavItem {
  href: string;
  icon: string;
  label: string;
  badge: AdminNavBadgeKind | null;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

/** Navigation principale — 12 modules + section MVP existante (zéro régression). */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "VUE D'ENSEMBLE",
    items: [
      { href: "/admin", icon: "📊", label: "Dashboard", badge: null },
      { href: "/admin/analytics", icon: "📈", label: "Analytiques", badge: "live" },
    ],
  },
  {
    title: "GESTION",
    items: [
      { href: "/admin/users", icon: "👥", label: "Utilisateurs", badge: null },
      { href: "/admin/artists", icon: "🎤", label: "Artistes", badge: null },
      { href: "/admin/catalog", icon: "🎵", label: "Contenus", badge: "pending" },
      { href: "/admin/rights", icon: "⚖️", label: "Modération", badge: "alert" },
    ],
  },
  {
    title: "FINANCIER",
    items: [
      { href: "/admin/finance", icon: "💰", label: "Revenus", badge: null },
      { href: "/admin/withdrawals", icon: "💳", label: "Retraits", badge: "pending" },
      { href: "/admin/beatstore", icon: "🎹", label: "Beat Store", badge: null },
    ],
  },
  {
    title: "PROGRAMME",
    items: [
      { href: "/admin/awards", icon: "🏆", label: "Awards", badge: null },
    ],
  },
  {
    title: "SYSTÈME",
    items: [
      { href: "/admin/settings", icon: "⚙️", label: "Config Règles", badge: null },
      { href: "/admin/audit", icon: "📋", label: "Journal Audit", badge: null },
      { href: "/admin/health", icon: "🩺", label: "Santé système", badge: null },
    ],
  },
  {
    title: "MVP EXISTANT",
    items: [
      { href: "/admin/live-control", icon: "🎛️", label: "Live Control", badge: "live" },
      { href: "/admin/fraud", icon: "🛡️", label: "Fraude", badge: "alert" },
      { href: "/admin/rights", icon: "©️", label: "Droits", badge: null },
      { href: "/admin/flags", icon: "🚩", label: "Flags", badge: null },
    ],
  },
];

export const ADMIN_MODULE_CARDS = [
  { href: "/admin/users", icon: "👥", label: "Utilisateurs", desc: "Gérer les comptes auditeurs" },
  { href: "/admin/artists", icon: "🎤", label: "Artistes", desc: "Gérer les artistes inscrits" },
  { href: "/admin/finance", icon: "💰", label: "Revenus", desc: "Historique financier complet" },
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
  "/admin": "Dashboard",
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
