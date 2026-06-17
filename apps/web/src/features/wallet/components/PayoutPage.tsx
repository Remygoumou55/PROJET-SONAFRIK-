"use client";

import { memo, useState } from "react";
import type { AddPayoutAccountInput } from "@sonafrik/api/wallet";
import { PAYOUT_ACCOUNT_LABELS, WITHDRAWAL_STATUS_LABELS } from "@sonafrik/types";
import { usePayoutPageData, useRequestWithdrawal } from "../hooks/useWallet";

export const PayoutPage = memo(function PayoutPage() {
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
    border: "1px solid #333333",
    backgroundColor: "#2A2A2A",
    color: "#FFFFFF",
    fontSize: 14,
    outline: "none",
  } as React.CSSProperties;

  return (
    <div className="space-y-8">
      {/* Comptes de retrait */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: "#FFFFFF" }}>Comptes de retrait</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-sm font-medium px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#1F1F1F", color: "#00D26A", border: "1px solid #333333" }}
          >
            + Ajouter
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddAccount} className="rounded-xl p-4 mb-4 space-y-3" style={{ backgroundColor: "#1F1F1F" }}>
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
            {formError && <p className="text-xs" style={{ color: "#FF6666" }}>{formError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
              >
                {isSubmitting ? "Ajout…" : "Ajouter le compte"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 rounded-xl text-sm" style={{ backgroundColor: "#2A2A2A", color: "#A0A0A0" }}>
                Annuler
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-4 animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 80}ms` }}>
                <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: "#2A2A2A" }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded" style={{ backgroundColor: "#2A2A2A" }} />
                  <div className="h-3 w-20 rounded" style={{ backgroundColor: "#2A2A2A" }} />
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-8 text-center rounded-xl" style={{ backgroundColor: "#1F1F1F" }}>
            <p className="text-2xl mb-2">🏦</p>
            <p className="text-sm" style={{ color: "#A0A0A0" }}>Aucun compte de retrait.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "#1F1F1F" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#2A2A2A", color: "#00D26A" }}>
                    {acc.type === "orange_money" ? "🟠" : acc.type === "mtn_momo" ? "🟡" : acc.type === "wave" ? "🔵" : "🏦"}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>{acc.display_name}</p>
                    <p className="text-xs" style={{ color: "#A0A0A0" }}>
                      {PAYOUT_ACCOUNT_LABELS[acc.type as keyof typeof PAYOUT_ACCOUNT_LABELS]}
                      {acc.phone_number ? ` · ${acc.phone_number}` : ""}
                      {acc.is_default ? " · Principal" : ""}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeAccount(acc.id)} style={{ color: "#555555" }} className="text-lg">×</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Demander un retrait */}
      {accounts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "#FFFFFF" }}>Demander un retrait</h2>
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              className="text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "#1F1F1F", color: "#00D26A", border: "1px solid #333333" }}
            >
              Retirer
            </button>
          </div>

          {showWithdrawForm && (
            <form onSubmit={handleWithdraw} className="rounded-xl p-4 mb-4 space-y-3" style={{ backgroundColor: "#1F1F1F" }}>
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
              {formError && <p className="text-xs" style={{ color: "#FF6666" }}>{formError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "#00D26A", color: "#0D0D0D" }}
                >
                  {isSubmitting ? "Traitement…" : "Demander le retrait"}
                </button>
                <button type="button" onClick={() => setShowWithdrawForm(false)} className="px-4 rounded-xl text-sm" style={{ backgroundColor: "#2A2A2A", color: "#A0A0A0" }}>
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Historique des retraits */}
      <section>
        <h2 className="text-base font-semibold mb-4" style={{ color: "#FFFFFF" }}>Historique des retraits</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl p-4 animate-pulse" style={{ backgroundColor: "#1F1F1F", animationDelay: `${i * 70}ms` }}>
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 rounded" style={{ backgroundColor: "#2A2A2A" }} />
                  <div className="h-3 w-20 rounded" style={{ backgroundColor: "#2A2A2A" }} />
                </div>
                <div className="h-6 w-16 rounded-full" style={{ backgroundColor: "#2A2A2A" }} />
              </div>
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <p className="text-sm" style={{ color: "#A0A0A0" }}>Aucun retrait.</p>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: "#1F1F1F" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>
                    {new Intl.NumberFormat("fr-GN").format(w.amount_gnf)} GNF
                  </p>
                  <p className="text-xs" style={{ color: "#A0A0A0" }}>
                    {new Date(w.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor:
                      w.status === "completed"  ? "#00D26A22" :
                      w.status === "failed"     ? "#FF444422" :
                      w.status === "cancelled"  ? "#55555522" :
                      w.status === "approved"   ? "#3B82F622" :
                                                  "#FFC20E22",
                    color:
                      w.status === "completed"  ? "#00D26A" :
                      w.status === "failed"     ? "#FF6666" :
                      w.status === "cancelled"  ? "#888888" :
                      w.status === "approved"   ? "#60A5FA" :
                                                  "#FFC20E",
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
