import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { WalletLayoutClient } from "@/features/wallet/components/WalletLayoutClient";
import { RealtimeShell } from "@/features/shared/rendering/RealtimeShell";
import { PerformanceProvider } from "@/lib/performance";
import { getCachedPerformanceFlags } from "@/lib/performance/server";
import "@/app/styles/wallet.css";
import "@/app/styles/revenue.css";

/** Layout async sans Suspense manuel — loading.tsx du segment gère le skeleton. */
export default async function WalletLayout({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);
  const performanceFlags = await getCachedPerformanceFlags();
  return (
    <RealtimeShell>
      <PerformanceProvider flags={performanceFlags}>
        <WalletLayoutClient>{children}</WalletLayoutClient>
      </PerformanceProvider>
    </RealtimeShell>
  );
}
