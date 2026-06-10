"use client";

import { usePathname } from "next/navigation";
import { IdentityShell } from "@/features/identity/components/IdentityShell";

interface IdentityLayoutClientProps {
  unreadNotifications: number;
  children: React.ReactNode;
}

export function IdentityLayoutClient({
  unreadNotifications,
  children,
}: IdentityLayoutClientProps) {
  const pathname = usePathname();

  const title =
    pathname.startsWith("/settings/account")
      ? "Compte"
      : pathname.startsWith("/settings/sessions")
        ? "Sessions actives"
        : pathname.startsWith("/settings/notifications")
          ? "Notifications"
          : pathname.startsWith("/settings/preferences")
            ? "Préférences"
            : pathname.startsWith("/settings")
              ? "Paramètres"
              : pathname.startsWith("/profile/edit")
                ? "Modifier le profil"
                : "Mon profil";

  return (
    <IdentityShell
      activePath={pathname}
      unreadNotifications={unreadNotifications}
      title={title}
      description="Identity OS — NOTRE BIEN COMMUN"
    >
      {children}
    </IdentityShell>
  );
}
