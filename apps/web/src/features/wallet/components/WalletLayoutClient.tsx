"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MusicHeader } from "@/features/shared/navigation";
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
      <div className="enterprise-shell enterprise-shell--single wallet-shell">
        <MusicHeader
          className="wallet-shell__header"
          title="Mon Wallet"
          eyebrow="ESPACE AUDITEUR"
          right={
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
          }
        />

        <div className="enterprise-content-card wallet-shell__content">
          <div className="enterprise-content-card__inner wallet-shell__inner">{children}</div>
        </div>
      </div>
    </WalletServiceProvider>
  );
}
