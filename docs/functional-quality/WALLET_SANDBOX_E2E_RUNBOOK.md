# Wallet Sandbox E2E — Runbook EFQ R1

**Objectif :** Valider la chaîne financière staging avant activation prod (`WALLET-P0-03`).

## Prérequis

1. `apps/web/.env.local` avec :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Compte artiste test (défaut Sprint 12B) ou variables :
   - `SANDBOX_FINANCE_EMAIL`
   - `SANDBOX_FINANCE_PASSWORD`
3. **Staging uniquement** pour activer les boutons UI :
   ```env
   NEXT_PUBLIC_PAYMENTS_ENABLED=true
   TOPUP_SANDBOX=true
   ```

## Exécution script sandbox

```powershell
cd "e:\PROJET SONAFRIK"
npx tsx scripts/run-finance-sandbox-e2e.ts
```

**Chaîne validée :**
- Connexion artiste test
- Topup sandbox via `confirm_payment_intent` RPC
- Création `payout_account`
- Demande retrait 5 000 GNF

## Orange Money prod (`WALLET-P0-01`)

Credentials à configurer dans **Supabase Secrets** (Dashboard → Edge Functions) :

| Secret | Description |
|---|---|
| `ORANGE_MONEY_GN_*` | Voir `docs/P0-2-PHASE-2-ORANGE-MONEY.md` |
| `SONAFRIK_WEB_URL` | URL callback prod |

Sans ces secrets, `payment-initiate` retourne `payment_operator_not_ready` (503).

## Activation progressive

| Environnement | `NEXT_PUBLIC_PAYMENTS_ENABLED` | Action |
|---|---|---|
| Dev local | `false` | UI visible, boutons « bientôt » |
| Staging | `true` + sandbox | Script E2E + tests manuels topup |
| Production | `true` + creds OM | Retrait réel validé par ops |

## Tests Playwright associés

- `apps/web/tests/e2e/wallet.spec.ts` — pages wallet
- `apps/web/tests/e2e/finance-chain.spec.ts` — API `payment-initiate` sandbox/503

## Critère de clôture R1 Wallet

- [x] Script sandbox exécuté avec succès en local (6 juil. 2026 — solde 10811 GNF, withdrawal 5000 GNF)
- [ ] Credentials Orange Money GN Phase 2 en secrets prod
- [ ] Job CI `finance-sandbox` vert sur main (secrets `SANDBOX_FINANCE_*` optionnels)
- [ ] Un retrait staging documenté dans `docs/EXECUTION_LOG.md`
