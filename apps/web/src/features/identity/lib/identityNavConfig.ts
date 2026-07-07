import type { MusicNavIconName } from "@/features/shared/navigation";

export interface IdentityNavEntry {
  href: string;
  label: string;
  shortLabel: string;
  icon: MusicNavIconName;
  exact?: boolean;
}

export const IDENTITY_NAV_ENTRIES: IdentityNavEntry[] = [
  { href: "/profile", label: "Mon profil", shortLabel: "Profil", icon: "profile", exact: true },
  { href: "/profile/edit", label: "Modifier le profil", shortLabel: "Modifier", icon: "account" },
  { href: "/settings/account", label: "Mon compte", shortLabel: "Compte", icon: "account" },
  { href: "/settings/sessions", label: "Sécurité", shortLabel: "Sécurité", icon: "security" },
  { href: "/settings/notifications", label: "Notifications", shortLabel: "Notifs", icon: "notifications" },
  { href: "/settings/payment", label: "Paiements", shortLabel: "Paiem.", icon: "payment" },
  { href: "/settings/preferences", label: "Préférences", shortLabel: "Préfs", icon: "preferences" },
  { href: "/settings/help", label: "Aide", shortLabel: "Aide", icon: "help" },
];

export function isIdentityNavActive(href: string, activePath: string, exact?: boolean): boolean {
  if (exact) return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}
