"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AccountType } from "@sonafrik/types";
import { MusicHeader, MusicNavBackLink } from "@/features/shared/navigation";
import { WalletServiceProvider } from "../lib/walletServiceContext";
import { WalletSessionProvider } from "../lib/walletSessionContext";
import { resolveWalletBackNav } from "../lib/walletBackNav";

const NAV_ITEMS = [
  { href: "/wallet", label: "Portefeuille", short: "Wallet" },
  { href: "/wallet/payout", label: "Retrait", short: "Retrait" },
  { href: "/wallet/royalties", label: "Royalties", short: "Royalt." },
  { href: "/wallet/recharges", label: "Historique recharges", short: "Recharges" },
] as const;

export function WalletLayoutClient({
  userId,
  accountType,
  children,
}: {
  userId: string;
  accountType: AccountType | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const backNav = resolveWalletBackNav(accountType);

  return (
    <WalletSessionProvider userId={userId}>
      <WalletServiceProvider>
        <div className="enterprise-shell enterprise-shell--single wallet-shell">
          <div className="wallet-shell__back">
            <MusicNavBackLink href={backNav.href} label={backNav.label} />
          </div>
          <div className="wallet-shell__header-band">
            <MusicHeader
              className="wallet-shell__header"
              title="Mon Wallet"
              eyebrow={backNav.eyebrow}
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
          </div>

          <div className="enterprise-content-card wallet-shell__content">
            <div className="enterprise-content-card__inner wallet-shell__inner">{children}</div>
          </div>
        </div>
      </WalletServiceProvider>
    </WalletSessionProvider>
  );
}
