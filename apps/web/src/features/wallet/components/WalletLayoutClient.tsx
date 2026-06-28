"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletServiceProvider } from "../lib/walletServiceContext";

const NAV_ITEMS = [
  { href: "/wallet", label: "Portefeuille", short: "Wallet" },
  { href: "/wallet/payout", label: "Retrait", short: "Retrait" },
  { href: "/wallet/royalties", label: "Royalties", short: "Royalt." },
] as const;

export function WalletLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <WalletServiceProvider>
      <div className="wallet-shell">
        <div className="wallet-shell__inner">
          <h1 className="wallet-shell__title">Mon Wallet</h1>

          <nav className="wallet-nav" aria-label="Navigation wallet">
            {NAV_ITEMS.map(({ href, label, short }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`wallet-nav__link${isActive ? " wallet-nav__link--active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="hidden min-[360px]:inline">{label}</span>
                  <span className="min-[360px]:hidden">{short}</span>
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
