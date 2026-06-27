import { SidebarNav } from "@/components/SidebarNav";
import { buildCreatorNavEntries } from "../lib/creatorNavConfig";

interface CreatorNavProps {
  activePath: string;
  pendingVerifications?: number;
}

export function CreatorNav({ activePath, pendingVerifications = 0 }: CreatorNavProps) {
  const items = buildCreatorNavEntries(pendingVerifications);

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
