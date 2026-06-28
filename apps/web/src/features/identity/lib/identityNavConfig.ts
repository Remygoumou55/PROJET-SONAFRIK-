export interface IdentityNavEntry {
  href: string;
  label: string;
  shortLabel: string;
  exact?: boolean;
}

export const IDENTITY_NAV_ENTRIES: IdentityNavEntry[] = [
  { href: "/profile", label: "Mon profil", shortLabel: "Profil", exact: true },
  { href: "/profile/edit", label: "Modifier le profil", shortLabel: "Modifier" },
  { href: "/settings/account", label: "Mon compte", shortLabel: "Compte" },
  { href: "/settings/sessions", label: "Sécurité", shortLabel: "Sécurité" },
  { href: "/settings/notifications", label: "Notifications", shortLabel: "Notifs" },
  { href: "/settings/payment", label: "Paiements", shortLabel: "Paiem." },
  { href: "/settings/preferences", label: "Préférences", shortLabel: "Préfs" },
  { href: "/settings/help", label: "Aide", shortLabel: "Aide" },
];

export function isIdentityNavActive(href: string, activePath: string, exact?: boolean): boolean {
  if (exact) return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}
