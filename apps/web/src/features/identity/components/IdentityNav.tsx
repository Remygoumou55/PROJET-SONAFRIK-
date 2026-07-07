"use client";

import {
  MusicSidebar,
  MusicNavBackLink,
  MusicNavFromSections,
  isListenerNavActive,
} from "@/features/shared/navigation";
import { IDENTITY_NAV_ENTRIES, isIdentityNavActive } from "../lib/identityNavConfig";

interface IdentityNavProps {
  activePath: string;
  unreadNotifications?: number;
}

export function IdentityNav({ activePath, unreadNotifications = 0 }: IdentityNavProps) {
  const sections = [
    {
      title: "Profil & compte",
      items: IDENTITY_NAV_ENTRIES.map((item) => ({
        href: item.href,
        label: item.label,
        icon: item.icon,
        exact: item.exact,
        badge:
          item.href === "/settings/notifications" && unreadNotifications > 0
            ? unreadNotifications
            : undefined,
      })),
    },
  ];

  return (
    <MusicSidebar role="listener" ariaLabel="Navigation profil" className="music-sidebar--identity">
      <MusicNavBackLink href="/listen" label="Retour à l'écoute" />
      <MusicNavFromSections
        sections={sections}
        pathname={activePath}
        ariaLabel="Menu profil et paramètres"
        isActive={(href, path, exact) =>
          href === "/listen" ? isListenerNavActive(href, path) : isIdentityNavActive(href, path, exact)
        }
      />
    </MusicSidebar>
  );
}
