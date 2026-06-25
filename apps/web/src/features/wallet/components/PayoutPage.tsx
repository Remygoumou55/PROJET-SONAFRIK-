"use client";

import { memo, useState } from "react";
import type { AddPayoutAccountInput } from "@sonafrik/api/wallet";
import { PAYOUT_ACCOUNT_LABELS, WITHDRAWAL_STATUS_LABELS } from "@sonafrik/types";
import { usePayoutPageData, useRequestWithdrawal } from "../hooks/useWallet";

export const PayoutPage = memo(function PayoutPage({
  withdrawalEnabled = true,
}: {
  withdrawalEnabled?: boolean;
}) {
  const { accounts, withdrawals, isLoading, addAccount, removeAccount } = usePayoutPageData();
  const requestWithdrawal = useRequestWithdrawal();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [accountForm, setAccountForm] = useState<Omit<AddPayoutAccountInput, "isDefault">>({
    type: "orange_money",
    displayName: "",
    accountHolderName: "",
    phoneNumber: "",
  });

  const [withdrawalForm, setWithdrawalForm] = useState({ payoutAccountId: "", amountGnf: 5000 });

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await addAccount({ ...accountForm, isDefault: accounts.length === 0 });
      setShowAddForm(false);
      setAccountForm({ type: "orange_money", displayName: "", accountHolderName: "", phoneNumber: "" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await requestWithdrawal(withdrawalForm);
      setShowWithdrawForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--color-bordure)",
    backgroundColor: "var(--color-elevated)",
    color: "var(--color-texte-principal)",
    fontSize: 14,
    outline: "none",
  } as React.CSSProperties;

  return (
    <div className="space-y-8">
      {/* Comptes de retrait */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-texte-principal)" }}>Comptes de retrait</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-sm font-medium px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "var(--color-card)", color: "var(--color-vert-energie)", border: "1px solid var(--color-bordure)" }}
          >
            + Ajouter
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddAccount} className="rounded-xl p-4 mb-4 space-y-3" style={{ backgroundColor: "var(--color-card)" }}>
            <select
              value={accountForm.type}
              onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value as AddPayoutAccountInput["type"] })}
              style={{ ...inputStyle }}
            >
              {Object.entries(PAYOUT_ACCOUNT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              style={inputStyle}
              placeholder="Nom du compte (ex: Mon Orange Money)"
              value={accountForm.displayName}
              onChange={(e) => setAccountForm({ ...accountForm, displayName: e.target.value })}
              required
            />
            <input
              style={inputStyle}
              placeholder="Titulaire du compte"
              value={accountForm.accountHolderName}
              onChange={(e) => setAccountForm({ ...accountForm, accountHolderName: e.target.value })}
              required
            />
            {["orange_money", "mtn_momo", "wave"].includes(accountForm.type) && (
              <input
                style={inputStyle}
                placeholder="Numéro de téléphone (+224…)"
                value={accountForm.phoneNumber ?? ""}
                onChange={(e) => setAccountForm({ ...accountForm, phoneNumber: e.target.value })}
              />
            )}
            {formError && <p className="text-xs" style={{ color: "var(--color-erreur)" }}>{formError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
              >
                {isSubmitting ? "Ajout…" : "Ajouter le compte"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 rounded-xl text-sm" style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}>
                Annuler
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-4 animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 80}ms` }}>
                <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-elevated)" }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
                  <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-8 text-center rounded-xl" style={{ backgroundColor: "var(--color-card)" }}>
            <p className="text-2xl mb-2">🏦</p>
            <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>Aucun compte de retrait.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "var(--color-card)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-vert-energie)" }}>
                    {acc.type === "orange_money" ? "🟠" : acc.type === "mtn_momo" ? "🟡" : acc.type === "wave" ? "🔵" : "🏦"}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-texte-principal)" }}>{acc.display_name}</p>
                    <p className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>
                      {PAYOUT_ACCOUNT_LABELS[acc.type as keyof typeof PAYOUT_ACCOUNT_LABELS]}
                      {acc.phone_number ? ` · ${acc.phone_number}` : ""}
                      {acc.is_default ? " · Principal" : ""}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeAccount(acc.id)} style={{ color: "var(--color-texte-desactive)" }} className="text-lg">×</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Demander un retrait */}
      {accounts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "var(--color-texte-principal)" }}>Demander un retrait</h2>
            <button
              type="button"
              onClick={() => withdrawalEnabled && setShowWithdrawForm(!showWithdrawForm)}
              disabled={!withdrawalEnabled}
              className="text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ backgroundColor: "var(--color-card)", color: "var(--color-vert-energie)", border: "1px solid var(--color-bordure)" }}
            >
              {withdrawalEnabled ? "Retirer" : "Retrait bientôt"}
            </button>
          </div>
          {!withdrawalEnabled && (
            <p className="text-xs mb-3" style={{ color: "var(--color-texte-secondaire)" }}>
              Les retraits seront disponibles avec Orange Money GN très prochainement.
            </p>
          )}

          {showWithdrawForm && withdrawalEnabled && (
            <form onSubmit={handleWithdraw} className="rounded-xl p-4 mb-4 space-y-3" style={{ backgroundColor: "var(--color-card)" }}>
              <select
                value={withdrawalForm.payoutAccountId}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, payoutAccountId: e.target.value })}
                style={inputStyle}
                required
              >
                <option value="">Sélectionner un compte</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.display_name}</option>
                ))}
              </select>
              <input
                type="number"
                min={5000}
                step={1000}
                style={inputStyle}
                placeholder="Montant (min. 5 000 GNF)"
                value={withdrawalForm.amountGnf}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amountGnf: Number(e.target.value) })}
                required
              />
              {formError && <p className="text-xs" style={{ color: "var(--color-erreur)" }}>{formError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-vert-energie)", color: "var(--color-noir-profond)" }}
                >
                  {isSubmitting ? "Traitement…" : "Demander le retrait"}
                </button>
                <button type="button" onClick={() => setShowWithdrawForm(false)} className="px-4 rounded-xl text-sm" style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-texte-secondaire)" }}>
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Historique des retraits */}
      <section>
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-texte-principal)" }}>Historique des retraits</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl p-4 animate-pulse" style={{ backgroundColor: "var(--color-card)", animationDelay: `${i * 70}ms` }}>
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
                  <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--color-elevated)" }} />
                </div>
                <div className="h-6 w-16 rounded-full" style={{ backgroundColor: "var(--color-elevated)" }} />
              </div>
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-texte-secondaire)" }}>Aucun retrait.</p>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "var(--color-card)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-texte-principal)" }}>
                    {new Intl.NumberFormat("fr-GN").format(w.amount_gnf)} GNF
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-texte-secondaire)" }}>
                    {new Date(w.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor:
                      w.status === "completed"  ? "rgba(0,210,106,0.13)" :
                      w.status === "failed"     ? "rgba(255,68,68,0.13)" :
                      w.status === "cancelled"  ? "rgba(85,85,85,0.13)" :
                      w.status === "approved"   ? "rgba(59,130,246,0.13)" :
                                                  "rgba(255,194,14,0.13)",
                    color:
                      w.status === "completed"  ? "var(--color-vert-energie)" :
                      w.status === "failed"     ? "var(--color-erreur)" :
                      w.status === "cancelled"  ? "var(--color-texte-secondaire)" :
                      w.status === "approved"   ? "var(--color-accent-bleu-clair)" :
                                                  "var(--color-or-solaire)",
                  }}
                >
                  {WITHDRAWAL_STATUS_LABELS[w.status as keyof typeof WITHDRAWAL_STATUS_LABELS] ?? w.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
});
