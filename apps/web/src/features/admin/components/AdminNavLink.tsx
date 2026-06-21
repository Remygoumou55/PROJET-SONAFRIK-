"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  label: string;
}

export function AdminNavLink({ href, label }: Props) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
      style={{
        borderColor: isActive ? "var(--color-or-solaire)" : "transparent",
        color: isActive ? "var(--color-or-solaire)" : "var(--color-texte-secondaire)",
      }}
    >
      {label}
    </Link>
  );
}
