import { SidebarNav } from "@/components/SidebarNav";
import type { SidebarNavItem } from "@/components/SidebarNav";

interface CreatorNavProps {
  activePath: string;
  pendingVerifications?: number;
}

export function CreatorNav({ activePath, pendingVerifications = 0 }: CreatorNavProps) {
  const items: SidebarNavItem[] = [
    { href: "/creator", label: "Dashboard", exact: true },
    { href: "/creator/analytics", label: "Analytics Pro", exact: true },
    { href: "/creator/catalog", label: "Catalogue", exact: true },
    { href: "/creator/catalog/releases", label: "Albums & Singles" },
    { href: "/creator/catalog/tracks", label: "Morceaux" },
    { href: "/creator/identity", label: "Identité artiste" },
    { href: "/creator/verification", label: "Vérification", badge: pendingVerifications },
    { href: "/creator/rights", label: "Droits & Contrats" },
    { href: "/creator/labels", label: "Labels" },
    { href: "/creator/team", label: "Équipe" },
  ];

  return (
    <SidebarNav
      title="Creator OS"
      items={items}
      activePath={activePath}
      backHref="/profile"
      backLabel="Retour au profil"
    />
  );
}
