# SPRINT 8 — Wallet OS

**Date :** 11 Juin 2026  
**Statut :** ✅ LIVRÉ — `pnpm build` · `pnpm lint` · `pnpm typecheck` = **0 erreur**

---

## Résumé exécutif

Sprint 8 implémente le Wallet OS complet de SONAFRIK : portefeuille utilisateur, abonnements premium, retraits artistes, pool de royalties 65% et cycle de distribution. Les règles CDC #2 (Premium J1 / Essai 7 jours), #3 (65% Revenue Pool), #5 (5% commission pourboire) sont codées dans les RPCs et le service.

---

## Livraisons

### 1. Migration `20250610150000_sprint8_wallet_os.sql`

**Colonnes ajoutées à `profiles` :**

| Colonne | Type | Description |
|---------|------|-------------|
| `is_premium` | BOOLEAN DEFAULT false | Statut abonnement actif |
| `premium_expires_at` | TIMESTAMPTZ | Date d'expiration premium |

**7 tables créées :**

| Table | Clé | Particularité |
|-------|-----|---------------|
| `wallets` | UUID | Un par utilisateur — trigger auto-création à l'inscription |
| `wallet_ledger` | UUID | **INSERT ONLY** — trigger `prevent_wallet_ledger_mutation` |
| `transactions` | UUID | Top-ups, abonnements, royalties, retraits |
| `withdrawals` | UUID | Demandes de retrait artistes (min. 5 000 GNF) |
| `payout_accounts` | UUID | Orange Money, MTN MoMo, Wave, virement |
| `royalty_cycles` | UUID | Cycles de distribution mensuels (65% Revenue Pool) |
| `royalty_calculations` | UUID | Calculs par artiste par cycle (UNIQUE cycle×artiste) |

**6 RPC functions :**

| Fonction | Description |
|----------|-------------|
| `get_wallet_balance` | Solde courant |
| `subscribe_premium` | Débit portefeuille + activation premium |
| `add_payout_account` | Ajout compte de retrait (default unique) |
| `request_withdrawal` | Réservation solde + création withdrawal |
| `is_premium_user` | **Remplace** la version MVP — vérifie `is_premium` + expiry |
| `has_streaming_permission` | **Remplace** la version MVP — 7j essai OU premium actif |
| `create_wallet_for_new_profile` | Trigger AFTER INSERT sur profiles |

---

### 2. Migration `20250610150001_sprint8_wallet_rls.sql`

**RLS sur 7 tables** :

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `wallets` | Own ou admin | Trigger uniquement | RPC uniquement | — |
| `wallet_ledger` | Own ou admin | RPC uniquement | **BLOQUÉ (trigger)** | **BLOQUÉ (trigger)** |
| `transactions` | Own ou admin | service_role | Admin uniquement | — |
| `withdrawals` | Own ou admin | RPC uniquement | Admin uniquement | — |
| `payout_accounts` | Own | RPC uniquement | Own | Soft delete |
| `royalty_cycles` | Tous auth | Admin | Admin | — |
| `royalty_calculations` | Own ou admin | Admin | Admin | — |

**8 nouvelles permissions Wallet OS :**
```
wallet:view, wallet:topup, wallet:subscribe, wallet:withdraw
wallet:payout:manage, royalty:view:own
admin:wallet:manage, admin:royalty:distribute
```

---

### 3. Edge Functions

**`wallet-topup`** — Recharge portefeuille :
- Auth JWT → vérification utilisateur
- Calcul nouveau solde + insertion transaction
- Mise à jour `wallets.balance_gnf` + entrée `wallet_ledger`

**`wallet-request-withdrawal`** — Retrait artiste :
- Délègue au RPC `request_withdrawal` (SECURITY DEFINER)
- Retourne `withdrawal_id`

---

### 4. @sonafrik/api — Module Wallet

```
packages/api/src/wallet/
  errors.ts          WalletError (8 codes d'erreur typés)
  schemas.ts         4 schémas Zod (subscribe, addAccount, withdrawal, topup)
  wallet.repository.ts  Accès DB (wallets, ledger, transactions, withdrawals, payout_accounts, royalties)
  wallet.service.ts  WalletService + createWalletService()
  index.ts           Exports publics
```

**Méthodes principales :**
- `getWalletContext()` — Solde + statut premium + transactions récentes
- `subscribePremium(planType)` — Via RPC
- `addPayoutAccount(input)` — Via RPC
- `requestWithdrawal(input)` — Via RPC
- `getRoyaltyCalculations()` — Historique royalties artiste

---

### 5. @sonafrik/types — Wallet OS

**Constantes :**
```typescript
PREMIUM_GRACE_PERIOD_DAYS = 7   // CDC Règle #2
REVENUE_POOL_PERCENT = 65       // CDC Règle #3
TIP_COMMISSION_PERCENT = 5      // CDC Règle #5

SUBSCRIPTION_PLANS = {
  MONTHLY: { price_gnf: 50_000, duration_days: 30 }
  ANNUAL:  { price_gnf: 480_000, duration_days: 365 }
}
```

**Interfaces :** `Wallet`, `WalletLedgerEntry`, `Transaction`, `Withdrawal`, `PayoutAccount`, `RoyaltyCycle`, `RoyaltyCalculation`, `WalletContext`

---

### 6. Web — Wallet OS UI

**Routes :**
- `/wallet` — Dashboard : solde, statut premium, transactions récentes, plans
- `/wallet/payout` — Comptes de retrait + historique withdrawals
- `/wallet/royalties` — Revenue Pool 65% + historique calculs

**Composants :**
- `WalletDashboard` — Carte solde dégradée vert, statut premium, stats, plans
- `SubscriptionModal` — Choix plan monthly/annual avec débit wallet
- `PayoutPage` — CRUD comptes de retrait + formulaire retrait
- `RoyaltiesPage` — Visualisation pool + historique par cycle
- `WalletLayoutClient` — Navigation tabs wallet

---

### 7. Mobile — Wallet Tab

**Nouvel onglet** `wallet` dans la barre de navigation (5 tabs : Accueil, Explorer, Bibliothèque, Wallet, Profil)

**Écran wallet.tsx :**
- Carte solde (fond vert énergie)
- Statut premium + bouton souscription
- Sélecteur plans mensuel/annuel
- Bloc Revenue Pool 65% (fond or)
- Transactions récentes

**Hook `features/wallet/useWallet.ts`** — `useWallet`, `usePayoutAccounts`, `useRoyalties`

---

### 8. CDC Règle #2 — Premium J1 · Gratuit 7 jours

La fonction `has_streaming_permission()` est désormais réelle :
```sql
-- Streaming autorisé si :
-- 1. Utilisateur premium actif (is_premium = true ET expiry dans le futur)
-- 2. OU compte créé il y a moins de 7 jours (essai gratuit)
SELECT (is_premium AND premium_expires_at > now())
    OR (created_at + INTERVAL '7 days' > now())
FROM profiles WHERE id = p_user_id;
```

---

## Validation finale

```
pnpm typecheck   ✅  12/12  — 0 erreur
pnpm lint        ✅  12/12  — 0 erreur
pnpm build       ✅   7/7   — 0 erreur
```

---

## Prérequis déploiement

```bash
# Migrations
supabase db push

# Edge Functions
supabase functions deploy wallet-topup
supabase functions deploy wallet-request-withdrawal

# Variables d'environnement
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<votre_clé>
```

---

## Notes pour Sprint 9

- **Rights OS** : `works`, `contributors`, `ownerships`, `ownership_versions`, `contracts`, `rights_claims`
- **CDC Règle #4** : Beat Store commission = 0 GNF (à implémenter avec les transactions de type `beat_purchase`)
- **Admin OS** : `system_settings`, `feature_flags`, `fraud_flags` (audit_logs et notifications déjà en place)
- Mise à jour `total_credited_gnf` dans wallet-topup (actuellement seul le solde est mis à jour)

---

*SONAFRIK · Notre Bien Commun · Sprint 8 livré le 11 Juin 2026*
