# Orange Money GN — Phase 2 validation

> Dernière mise à jour : 30 juin 2026  
> Statut : **bloqué credentials opérateur** — code prêt, E2E sandbox validé

## Prérequis prod

1. Secrets Supabase configurés (voir `docs/PAYMENTS_PROD_SECRETS.md`)
2. `SONAFRIK_ENV=production`
3. `ORANGE_MONEY_SANDBOX` absent ou `false`

## Scénario E2E (1 transaction réelle)

| Étape | Attendu |
|---|---|
| POST `payment-initiate` (orange_money_gn, topup 5000 GNF) | 200 + `intentId` |
| Push USSD Orange sur téléphone test | Confirmation utilisateur |
| Callback `payment-orange-callback` | HMAC validé → `payment_intents.status=completed` |
| `wallet_ledger` | Entrée crédit + solde wallet mis à jour |
| Admin finance | Intent visible, statut completed |

## Validation automatisée (sans credentials prod)

```bash
pnpm exec vitest run packages/api/src/payments/payments.service.test.ts
pnpm exec playwright test apps/web/tests/e2e/finance-chain.spec.ts -g "sandbox payment-initiate"
```

Attendu sans secrets prod : **503** `payment_operator_not_ready` OU **200** `sandbox: true`.

## Références

- `docs/P0-2-PHASE-2-ORANGE-MONEY.md`
- `supabase/functions/payment-orange-callback/index.ts`
- `supabase/functions/_shared/payments.ts`
