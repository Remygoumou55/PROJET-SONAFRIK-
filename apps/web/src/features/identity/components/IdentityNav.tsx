import Link from "next/link";
import { Badge } from "@sonafrik/ui";

const NAV_ITEMS: {
  href: string;
  label: string;
  exact?: boolean;
}[] = [
  { href: "/profile", label: "Profil", exact: true },
  { href: "/settings", label: "Paramètres", exact: true },
  { href: "/settings/preferences", label: "Préférences" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/sessions", label: "Sessions" },
  { href: "/settings/account", label: "Compte" },
];

interface IdentityNavProps {
  activePath: string;
  unreadNotifications?: number;
}

export function IdentityNav({ activePath, unreadNotifications = 0 }: IdentityNavProps) {
  return (
    <nav className="flex flex-col gap-1">
      <p className="text-texte-desactive mb-2 px-3 text-xs font-semibold uppercase tracking-wider">
        Identity OS
      </p>
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? activePath === item.href
          : activePath === item.href || activePath.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-elevated text-vert-energie font-medium"
                : "text-texte-secondaire hover:bg-elevated hover:text-texte-principal"
            }`}
          >
            <span>{item.label}</span>
            {item.href === "/settings/notifications" && unreadNotifications > 0 ? (
              <Badge variant="primary">{unreadNotifications}</Badge>
            ) : null}
          </Link>
        );
      })}
      <Link
        href="/"
        className="text-texte-desactive mt-4 px-3 text-xs hover:text-texte-secondaire"
      >
        ← Retour à l&apos;accueil
      </Link>
    </nav>
  );
}
