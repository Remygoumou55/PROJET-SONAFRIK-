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
      <div className="min-h-dvh bg-noir-profond">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="mb-6 text-2xl font-bold text-texte-principal">Mon Wallet</h1>

          <nav className="mb-8 flex gap-1 rounded-xl bg-surface p-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-all ${
                    isActive
                      ? "bg-elevated text-texte-principal"
                      : "bg-transparent text-texte-secondaire"
                  }`}
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
