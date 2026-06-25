import { SidebarNav } from "@/components/SidebarNav";
import type { SidebarNavItem } from "@/components/SidebarNav";

interface CreatorNavProps {
  activePath: string;
  pendingVerifications?: number;
}

export function CreatorNav({ activePath, pendingVerifications = 0 }: CreatorNavProps) {
  const items: SidebarNavItem[] = [
    { href: "/creator", label: "Vue d'ensemble", exact: true },
    { href: "/creator/analytics", label: "Mes statistiques", exact: true },
    { href: "/creator/catalog", label: "Mon catalogue", exact: true },
    { href: "/creator/catalog/releases", label: "Albums et morceaux seuls" },
    { href: "/creator/catalog/tracks", label: "Morceaux" },
    { href: "/creator/identity", label: "Identité artiste" },
    { href: "/creator/verification", label: "Vérification", badge: pendingVerifications },
    { href: "/creator/rights", label: "Droits et contrats" },
    { href: "/creator/labels", label: "Labels" },
    { href: "/creator/team", label: "Équipe" },
  ];

  return (
    <SidebarNav
      title="Espace artiste"
      items={items}
      activePath={activePath}
      backHref="/profile"
      backLabel="Retour au profil"
    />
  );
}
