import { Suspense } from "react";
import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { WalletLayoutClient } from "@/features/wallet/components/WalletLayoutClient";
import WalletLoading from "./loading";

async function WalletGuard({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);
  return <WalletLayoutClient>{children}</WalletLayoutClient>;
}

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<WalletLoading />}>
      <WalletGuard>{children}</WalletGuard>
    </Suspense>
  );
}
