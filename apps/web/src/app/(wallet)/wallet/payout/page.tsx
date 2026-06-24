import { isPaymentsEnabled } from "@/features/wallet/lib/paymentsEnabled";
import { ComingSoon } from "@/components/ComingSoon";
import { PayoutPage } from "@/features/wallet/components/PayoutPage";

export const metadata = { title: "Retrait — SONAFRIK" };

export default function WalletPayoutPage() {
  if (!isPaymentsEnabled()) {
    return (
      <ComingSoon
        emoji="💸"
        title="Retrait des fonds"
        description="La fonctionnalité de retrait vers Orange Money, MTN MoMo et Wave sera disponible lors du lancement des paiements."
      />
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-texte-principal)" }}>
        Retrait des fonds
      </h1>
      <PayoutPage />
    </div>
  );
}
