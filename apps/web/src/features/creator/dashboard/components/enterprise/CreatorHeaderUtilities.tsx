"use client";

import { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/features/shared/notifications/components/NotificationBell";
import { useAuthService } from "@/features/identity/auth/hooks/useAuth";

interface CreatorHeaderUtilitiesProps {
  userId: string;
  initialUnreadCount: number;
}

const MENU_LINKS = [
  { label: "Mon Profil",    href: "/creator/identity" },
  { label: "Mon Catalogue", href: "/creator/catalog" },
  { label: "Followers",     href: "/creator/analytics" },
  { label: "Revenus",       href: "/wallet/royalties" },
  { label: "Paramètres",    href: "/settings/account" },
  { label: "Aide",          href: "/settings/help" },
] as const;

function CreatorHeaderUtilitiesView({
  userId,
  initialUnreadCount,
}: CreatorHeaderUtilitiesProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const auth = useAuthService();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await auth.signOut();
    router.push("/auth/connexion");
  }

  return (
    <div className="creator-header-utils">
      <NotificationBell initialCount={initialUnreadCount} userId={userId} />
      <div className="ch-menu" ref={menuRef}>
        <button
          type="button"
          className="ch-menu__btn"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="ch-menu__icon" aria-hidden="true">☰</span>
        </button>

        {open && (
          <div className="ch-menu__dropdown" role="menu" aria-label="Menu utilisateur">
            {MENU_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="ch-menu__item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="ch-menu__sep" role="separator" />
            <button
              type="button"
              className="ch-menu__item ch-menu__item--danger"
              role="menuitem"
              onClick={handleSignOut}
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const CreatorHeaderUtilities = memo(CreatorHeaderUtilitiesView);
