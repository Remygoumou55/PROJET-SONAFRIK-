import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { WalletLayoutClient } from "@/features/wallet/components/WalletLayoutClient";
import { RealtimeShell } from "@/features/shared/rendering/RealtimeShell";

/** Layout async sans Suspense manuel — loading.tsx du segment gère le skeleton. */
export default async function WalletLayout({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);
  return (
    <RealtimeShell>
      <WalletLayoutClient>{children}</WalletLayoutClient>
    </RealtimeShell>
  );
}
