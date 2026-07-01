"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ArtistTier } from "@sonafrik/types";
import { CreatorAssetImage } from "../dashboard/components/CreatorAssetImage";

const CREATOR_NAV = [
  { href: "/creator",           icon: "📊", label: "Vue d'ensemble", exact: true  },
  { href: "/creator/catalog",   icon: "🎵", label: "Mon catalogue",  exact: true  },
  { href: "/creator/analytics", icon: "📈", label: "Statistiques",   exact: true  },
  { href: "/creator/identity",  icon: "👤", label: "Mon profil",     exact: false },
] as const;

const TIER_COLOR: Record<ArtistTier, string> = {
  etabli:     "var(--color-or-solaire)",
  croissance: "var(--color-feature-azure)",
  emergent:   "var(--color-vert-energie)",
};

const TIER_LABEL: Record<ArtistTier, string> = {
  etabli:     "Établi",
  croissance: "Croissance",
  emergent:   "Émergent",
};

interface CreatorSidebarProps {
  stageName: string;
  creatorId: string;
  avatarPath: string | null;
  tier: ArtistTier;
}

function isNavActive(href: string, exact: boolean, pathname: string): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CreatorSidebar({ stageName, creatorId, avatarPath, tier }: CreatorSidebarProps) {
  const pathname = usePathname();
  const initials = stageName.slice(0, 2).toUpperCase();

  return (
    <aside className="cs-sidebar" role="navigation" aria-label="Navigation artiste">
      <div className="cs-logo">
        <span className="cs-logo-brand">
          SON<span className="cs-logo-accent">A</span>FRIK
        </span>
        <span className="cs-logo-sub">Espace Artiste</span>
      </div>

      <div className="cs-profile">
        <div className="cs-avatar">
          {avatarPath ? (
            <CreatorAssetImage
              creatorId={creatorId}
              path={avatarPath}
              assetKind="cover"
              alt={stageName}
              layout="bounded"
              className="cs-avatar-img"
            />
          ) : (
            <span className="cs-avatar-initials">{initials}</span>
          )}
        </div>
        <div className="cs-profile-info">
          <p className="cs-profile-name">{stageName}</p>
          <span className="cs-profile-tier" style={{ color: TIER_COLOR[tier] }}>
            {TIER_LABEL[tier]}
          </span>
        </div>
      </div>

      <nav className="cs-nav" aria-label="Menu artiste">
        {CREATOR_NAV.map((item) => {
          const active = isNavActive(item.href, item.exact, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`cs-nav-item${active ? " cs-nav-item--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="cs-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="cs-spacer" />

      <div className="cs-upload-wrap">
        <Link href="/creator/catalog/tracks" className="cs-upload-btn">
          <span className="cs-upload-plus">+</span>
          <span>Uploader un morceau</span>
        </Link>
      </div>
    </aside>
  );
}
