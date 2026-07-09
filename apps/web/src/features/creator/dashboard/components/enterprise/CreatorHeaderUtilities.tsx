"use client";

import { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/features/shared/notifications/components/NotificationBell";
import { useAuthService } from "@/features/identity/auth/hooks/useAuth";

interface CreatorHeaderUtilitiesProps {
  userId: string;
  initialUnreadCount: number;
  pendingVerifications?: number;
}

const MENU_LINKS = [
  { label: "Paramètres", href: "/creator/identity", showVerificationBadge: true },
  { label: "Aide & Support", href: "/settings/help" },
  { label: "Mon Catalogue", href: "/creator/catalog" },
  { label: "Revenus", href: "/wallet/royalties" },
] as const;

function CreatorHeaderUtilitiesView({
  userId,
  initialUnreadCount,
  pendingVerifications = 0,
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
                <span className="ch-menu__item-label">{item.label}</span>
                {"showVerificationBadge" in item && item.showVerificationBadge && pendingVerifications > 0 ? (
                  <span className="ch-menu__badge" aria-label={`${pendingVerifications} vérification(s) en attente`}>
                    {pendingVerifications}
                  </span>
                ) : null}
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
