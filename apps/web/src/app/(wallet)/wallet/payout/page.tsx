import { isWithdrawalEnabled } from "@/features/wallet/lib/paymentsEnabled";
import { PayoutPage } from "@/features/wallet/components/PayoutPage";

export const metadata = { title: "Retrait — SONAFRIK" };

export default function WalletPayoutPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-texte-principal)" }}>
        Retrait des fonds
      </h1>
      {!isWithdrawalEnabled() && (
        <p className="text-sm mb-6" style={{ color: "var(--color-texte-secondaire)" }}>
          Configurez votre compte Orange Money en avance. Les retraits seront activés dès l&apos;intégration
          des opérateurs mobiles.
        </p>
      )}
      <PayoutPage withdrawalEnabled={isWithdrawalEnabled()} />
    </div>
  );
}
