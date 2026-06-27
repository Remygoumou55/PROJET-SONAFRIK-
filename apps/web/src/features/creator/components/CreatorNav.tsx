import { SidebarNav, type SidebarNavEntry } from "@/components/SidebarNav";

interface CreatorNavProps {
  activePath: string;
  pendingVerifications?: number;
}

export function CreatorNav({ activePath, pendingVerifications = 0 }: CreatorNavProps) {
  const items: SidebarNavEntry[] = [
    { type: "section", label: "Espace artiste" },
    { href: "/creator", label: "Vue d'ensemble", icon: "📊", exact: true },
    { href: "/creator/analytics", label: "Mes statistiques", icon: "📈", exact: true },
    { type: "section", label: "Mon catalogue" },
    { href: "/creator/catalog", label: "Tout mon catalogue", icon: "💿", exact: true },
    { href: "/creator/catalog/tracks", label: "Uploader un morceau", icon: "🎵" },
    { type: "section", label: "Mon profil" },
    { href: "/creator/identity", label: "Identité artiste", icon: "👤" },
    { href: "/creator/verification", label: "Vérification", icon: "✓", badge: pendingVerifications },
    { href: "/creator/rights", label: "Droits et contrats", icon: "⚖️" },
    { href: "/creator/labels", label: "Labels", icon: "🏷" },
    { href: "/creator/team", label: "Équipe", icon: "👥" },
  ];

  return (
    <SidebarNav
      title="Espace artiste"
      items={items}
      activePath={activePath}
      backHref="/profile"
      backLabel="Retour au profil"
      variant="creator"
    />
  );
}
