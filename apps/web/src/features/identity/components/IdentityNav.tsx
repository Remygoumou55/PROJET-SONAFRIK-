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
    { href: "/settings/account", label: "Compte" },
    { href: "/settings/payment", label: "Paiement" },
    { href: "/settings/sessions", label: "Sécurité et confidentialité" },
    { href: "/settings/notifications", label: "Notifications", badge: unreadNotifications },
    { href: "/settings/preferences", label: "Préférences" },
    { href: "/settings/help", label: "Aide" },
  ];

  return (
    <SidebarNav
      title="Paramètres"
      items={items}
      activePath={activePath}
      backHref="/"
      backLabel="Retour à l'accueil"
    />
  );
}
