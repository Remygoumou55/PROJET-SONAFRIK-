"use client";

import { usePathname } from "next/navigation";
import { SonafrikLogo } from "@/components/shared/SonafrikLogo";
import { CreatorNav } from "./CreatorNav";

export function CreatorLayoutClient({
  pendingVerifications,
  children,
}: {
  pendingVerifications: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = pathname.startsWith("/creator/catalog/tracks")
    ? "Uploader un morceau"
    : pathname.startsWith("/creator/catalog/releases")
      ? "Albums et morceaux"
      : pathname.startsWith("/creator/catalog")
        ? "Tout mon catalogue"
        : pathname.startsWith("/creator/analytics")
          ? "Mes statistiques"
          : pathname.startsWith("/creator/identity")
            ? "Identité artiste"
            : pathname.startsWith("/creator/verification")
              ? "Vérification"
              : pathname.startsWith("/creator/labels")
                ? "Labels"
                : pathname.startsWith("/creator/rights")
                  ? "Droits et contrats"
                  : pathname.startsWith("/creator/team")
                    ? "Équipe"
                    : "Mon espace artiste";

  return (
    <div className="min-h-dvh bg-noir-profond">
      <header className="creator-header border-b border-bordure px-6 py-4">
        <div className="creator-breadcrumb">
          <SonafrikLogo size="nav" />
          <span className="creator-breadcrumb__sep" aria-hidden="true">
            ·
          </span>
          <span className="creator-breadcrumb__section">Espace Artiste</span>
        </div>
        <h1 className="creator-page-title">{title}</h1>
        <p className="creator-page-sub">
          Publiez, suivez vos écoutes et développez votre carrière musicale.
        </p>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <aside className="creator-sidebar lg:w-[200px] lg:shrink-0">
          <CreatorNav activePath={pathname} pendingVerifications={pendingVerifications} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
