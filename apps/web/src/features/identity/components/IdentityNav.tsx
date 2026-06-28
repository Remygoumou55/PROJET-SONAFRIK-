import { SidebarNav } from "@/components/SidebarNav";
import type { SidebarNavItem } from "@/components/SidebarNav";
import { IDENTITY_NAV_ENTRIES } from "../lib/identityNavConfig";

interface IdentityNavProps {
  activePath: string;
  unreadNotifications?: number;
}

export function IdentityNav({ activePath, unreadNotifications = 0 }: IdentityNavProps) {
  const items: SidebarNavItem[] = IDENTITY_NAV_ENTRIES.map((item) => ({
    href: item.href,
    label: item.label,
    exact: item.exact,
    badge: item.href === "/settings/notifications" ? unreadNotifications : undefined,
  }));

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
