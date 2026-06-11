import { requireIdentityContext } from "@/features/identity/lib/requireIdentity";
import { WalletLayoutClient } from "@/features/wallet/components/WalletLayoutClient";

export default async function WalletLayout({ children }: { children: React.ReactNode }) {
  await requireIdentityContext();
  return <WalletLayoutClient>{children}</WalletLayoutClient>;
}
