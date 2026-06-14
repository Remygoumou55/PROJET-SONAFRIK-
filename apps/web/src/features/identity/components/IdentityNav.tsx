import { SidebarNav } from "@/components/SidebarNav";
import type { SidebarNavItem } from "@/components/SidebarNav";

interface IdentityNavProps {
  activePath: string;
  unreadNotifications?: number;
}

export function IdentityNav({ activePath, unreadNotifications = 0 }: IdentityNavProps) {
  const items: SidebarNavItem[] = [
    { href: "/profile", label: "Profil", exact: true },
    { href: "/settings", label: "Paramètres", exact: true },
    { href: "/settings/preferences", label: "Préférences" },
    { href: "/settings/notifications", label: "Notifications", badge: unreadNotifications },
    { href: "/settings/sessions", label: "Sessions" },
    { href: "/settings/account", label: "Compte" },
  ];

  return (
    <SidebarNav
      title="Identity OS"
      items={items}
      activePath={activePath}
      backHref="/"
      backLabel="Retour à l'accueil"
    />
  );
}
