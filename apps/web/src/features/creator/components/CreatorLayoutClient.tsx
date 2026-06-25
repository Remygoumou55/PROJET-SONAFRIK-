"use client";

import { usePathname } from "next/navigation";
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
    ? "Morceaux"
    : pathname.startsWith("/creator/catalog/releases")
      ? "Albums et morceaux seuls"
      : pathname.startsWith("/creator/catalog")
        ? "Mon catalogue"
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
    <div className="min-h-screen bg-noir-profond">
      <header className="border-b border-bordure px-6 py-4">
        <p className="text-or-solaire text-xs font-semibold uppercase tracking-wider">
          NOTRE BIEN COMMUN · Espace artiste
        </p>
        <h1 className="text-texte-principal mt-1 text-2xl font-bold">{title}</h1>
        <p className="text-texte-secondaire mt-1 text-sm">
          Publiez, suivez vos écoutes et développez votre carrière musicale.
        </p>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <CreatorNav activePath={pathname} pendingVerifications={pendingVerifications} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
