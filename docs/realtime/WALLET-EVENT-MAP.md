# Wallet Hub — SRTSP Event Consumption (Phase 3.6)

## Événements actifs (registry + alias forward-compat)

| Événement | Effet Wallet |
|---|---|
| `wallet.balance.updated` | Solde + contexte |
| `wallet.withdrawal.updated` | Retraits + statuts |
| `wallet.transaction.created` | Historique transactions |
| `wallet.transaction.completed` | Ledger / transactions |
| `wallet.transaction.failed` | Statuts échec |
| `withdrawal.requested` | Demande retrait |
| `withdrawal.approved` | Retrait validé |
| `withdrawal.rejected` | Retrait rejeté |
| `payment.completed` | Recharge / paiement OK |
| `payment.failed` | Paiement échoué |
| `wallet.topup.completed` | LDSE → bridge SRTSP |
| `wallet.withdrawal.requested` | LDSE → bridge SRTSP |
| `wallet.subscription.changed` | Premium / abonnement |

`wallet.invalidate` (LDSE) → mappé `wallet.balance.updated` via bridge.

## Préparation (sans consommation active)

| Événement | Statut |
|---|---|
| `wallet.royalty.generated` | Phase royalties |
| `royalty.adjusted` | Registry futur |
| `stream.play.recorded` | Phase streaming |

## Ignorés

- `publication.draft.*` · upload wizard · metadata form

**Hooks :** `useWalletSrtspLiveQuery` · `useWalletPageData` · `usePayoutPageData` · `useRoyalties` · `usePaymentHistory`  
**Adaptateur :** `wallet-hub-consumer.ts` — `shouldRefreshWalletHub(userId)`
