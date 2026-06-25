import { SidebarNav } from "@/components/SidebarNav";
import type { SidebarNavItem } from "@/components/SidebarNav";

interface IdentityNavProps {
  activePath: string;
  unreadNotifications?: number;
}

export function IdentityNav({ activePath, unreadNotifications = 0 }: IdentityNavProps) {
  const items: SidebarNavItem[] = [
    { href: "/profile", label: "Mon profil", exact: true },
    { href: "/settings/account", label: "Mon compte" },
    { href: "/settings/sessions", label: "Sécurité" },
    { href: "/settings/notifications", label: "Notifications", badge: unreadNotifications },
    { href: "/settings/payment", label: "Paiements" },
    { href: "/settings/preferences", label: "Préférences" },
    { href: "/settings/help", label: "Aide" },
  ];

  return (
    <SidebarNav
      title="Navigation"
      items={items}
      activePath={activePath}
      backHref="/listen"
      backLabel="Retour à l'écoute"
    />
  );
}
