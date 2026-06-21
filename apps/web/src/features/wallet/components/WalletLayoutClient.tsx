"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletServiceProvider } from "../lib/walletServiceContext";

const NAV_ITEMS = [
  { href: "/wallet", label: "Portefeuille" },
  { href: "/wallet/payout", label: "Retrait" },
  { href: "/wallet/royalties", label: "Royalties" },
] as const;

export function WalletLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <WalletServiceProvider>
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-noir-profond)" }}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-texte-principal)" }}>Mon Wallet</h1>

          <nav className="flex gap-1 mb-8 rounded-xl p-1" style={{ backgroundColor: "var(--color-surface)" }}>
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isActive ? "var(--color-elevated)" : "transparent",
                    color: isActive ? "var(--color-texte-principal)" : "var(--color-texte-secondaire)",
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
    </WalletServiceProvider>
  );
}
