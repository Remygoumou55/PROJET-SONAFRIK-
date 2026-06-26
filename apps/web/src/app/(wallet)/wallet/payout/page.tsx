import { isWithdrawalEnabled } from "@/features/wallet/lib/paymentsEnabled";
import { PayoutPage } from "@/features/wallet/components/PayoutPage";

export const metadata = { title: "Retrait — SONAFRIK" };

export default function WalletPayoutPage() {
  const withdrawalEnabled = isWithdrawalEnabled();

  return (
    <div className="space-y-4">
      {!withdrawalEnabled && (
        <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>
          Configurez votre compte Orange Money en avance. Les retraits seront activés dès
          l&apos;intégration des opérateurs mobiles (
          <code className="text-xs">NEXT_PUBLIC_PAYMENTS_ENABLED=true</code> en staging).
        </p>
      )}
      <PayoutPage withdrawalEnabled={withdrawalEnabled} />
    </div>
  );
}
