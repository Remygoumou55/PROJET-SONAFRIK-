import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { AdminNavLink } from "@/features/admin/components/AdminNavLink";
import AdminLoading from "./loading";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/catalog", label: "Catalogue" },
  { href: "/admin/finance", label: "Finances" },
  { href: "/admin/fraud", label: "Fraude" },
  { href: "/admin/rights", label: "Droits" },
  { href: "/admin/flags", label: "Flags" },
  { href: "/admin/settings", label: "Paramètres" },
  { href: "/admin/health", label: "Santé" },
] as const;

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-noir-profond)" }}>
      <div style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-elevated)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between py-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-or-solaire)" }}>
              Admin SONAFRIK
            </p>
            <Link href="/listen" className="text-xs transition-colors" style={{ color: "var(--color-texte-desactive)" }}>
              ← Retour à l&apos;app
            </Link>
          </div>
          <nav className="flex gap-1" aria-label="Navigation admin">
            {NAV_LINKS.map(({ href, label }) => (
              <AdminNavLink key={href} href={href} label={label} />
            ))}
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
