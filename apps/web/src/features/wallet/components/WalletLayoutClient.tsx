"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/wallet", label: "Portefeuille" },
  { href: "/wallet/payout", label: "Retrait" },
  { href: "/wallet/royalties", label: "Royalties" },
] as const;

export function WalletLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0D0D0D" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#FFFFFF" }}>Mon Wallet</h1>

        <nav className="flex gap-1 mb-8 rounded-xl p-1" style={{ backgroundColor: "#1A1A1A" }}>
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? "#2A2A2A" : "transparent",
                  color: isActive ? "#FFFFFF" : "#A0A0A0",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
