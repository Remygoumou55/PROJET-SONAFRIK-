"use client";

import { usePathname } from "next/navigation";
import { IdentityShell } from "@/features/identity/components/IdentityShell";

interface IdentityLayoutClientProps {
  unreadNotifications: number;
  children: React.ReactNode;
}

function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith("/settings/account")) return "Mon compte";
  if (pathname.startsWith("/settings/sessions")) return "Sécurité";
  if (pathname.startsWith("/settings/notifications")) return "Notifications";
  if (pathname.startsWith("/settings/payment")) return "Paiements";
  if (pathname.startsWith("/settings/preferences")) return "Préférences";
  if (pathname.startsWith("/settings/help")) return "Aide";
  if (pathname.startsWith("/settings")) return "Paramètres";
  if (pathname.startsWith("/profile/edit")) return "Modifier mon profil";
  return "Mon profil";
}

export function IdentityLayoutClient({
  unreadNotifications,
  children,
}: IdentityLayoutClientProps) {
  const pathname = usePathname();

  return (
    <IdentityShell
      activePath={pathname}
      unreadNotifications={unreadNotifications}
      title={resolvePageTitle(pathname)}
      description="Votre espace personnel — musique, communauté, opportunités."
    >
      {children}
    </IdentityShell>
  );
}
