import Link from "next/link";
import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { AdminNavLink } from "@/features/admin/components/AdminNavLink";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/catalog", label: "Catalogue" },
  { href: "/admin/finance", label: "Finances" },
  { href: "/admin/fraud", label: "Fraude" },
  { href: "/admin/flags", label: "Flags" },
  { href: "/admin/settings", label: "Paramètres" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0D0D0D" }}>
      <div style={{ backgroundColor: "#1A1A1A", borderBottom: "1px solid #2A2A2A" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between py-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFC20E" }}>
              Admin SONAFRIK
            </p>
            <Link href="/listen" className="text-xs transition-colors" style={{ color: "#555555" }}>
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
