import Link from "next/link";
import { Badge } from "@sonafrik/ui";

const NAV = [
  { href: "/creator", label: "Dashboard", exact: true },
  { href: "/creator/catalog", label: "Catalogue", exact: true },
  { href: "/creator/catalog/releases", label: "Albums & Singles" },
  { href: "/creator/catalog/tracks", label: "Morceaux" },
  { href: "/creator/identity", label: "Identité artiste" },
  { href: "/creator/verification", label: "Vérification" },
  { href: "/creator/labels", label: "Labels" },
  { href: "/creator/team", label: "Équipe" },
];

export function CreatorNav({ activePath, pendingVerifications = 0 }: {
  activePath: string;
  pendingVerifications?: number;
}) {
  return (
    <nav className="flex flex-col gap-1">
      <p className="text-texte-desactive mb-2 px-3 text-xs font-semibold uppercase tracking-wider">
        Creator OS
      </p>
      {NAV.map((item) => {
        const active = item.exact
          ? activePath === item.href
          : activePath.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              active
                ? "bg-elevated font-medium text-vert-energie"
                : "text-texte-secondaire hover:bg-elevated hover:text-texte-principal"
            }`}
          >
            {item.label}
            {item.href === "/creator/verification" && pendingVerifications > 0 ? (
              <Badge variant="primary">{pendingVerifications}</Badge>
            ) : null}
          </Link>
        );
      })}
      <Link href="/profile" className="text-texte-desactive mt-4 px-3 text-xs hover:text-texte-secondaire">
        ← Retour au profil
      </Link>
    </nav>
  );
}
