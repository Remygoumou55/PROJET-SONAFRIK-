import { requireIdentityContext, redirectIfOnboardingIncomplete } from "@/features/identity/lib/requireIdentity";
import { WalletLayoutClient } from "@/features/wallet/components/WalletLayoutClient";

export default async function WalletLayout({ children }: { children: React.ReactNode }) {
  const context = await requireIdentityContext();
  redirectIfOnboardingIncomplete(context.profile);
  return <WalletLayoutClient>{children}</WalletLayoutClient>;
}
