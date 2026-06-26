# Vague A — Bloquants lancement (audit forensique 24 juin 2026)

> Ordre d'exécution strict : A1 → A2 → A3 → A4 → A5. Audit après chaque item.

## Statut global (re-audit 24 juin 2026 — 15/15 probes)

| ID | Tâche | Statut | Notes |
|---|---|---|---|
| A1 | Orange Money GN prod + callbacks | ⏸ BLOQUÉ | Code prêt ✅ — credentials opérateur requis (`docs/P0-2-PHASE-2-ORANGE-MONEY.md`) |
| A2 | Tests wallet/payments Vitest | ✅ FAIT | **279/279** API tests — wallet + payments + mapper |
| A3 | `subscription_plans` branché flux abonnement | ✅ FAIT | DB live + RPC + WalletDashboard + SubscriptionModal |
| A4 | E2E chaîne MVP | ✅ FAIT | `apps/web/tests/e2e/mvp-chain.spec.ts` |
| A5 | LIVE CONTROL Performance + Streaming | ⏳ EN ATTENTE | Signature fondateur — docs prêtes |

### Probe automatisé
```bash
pnpm probe:vague-a-launch   # 15/15 checks (statique + live Supabase)
```

---

## A1 — Orange Money (bloqué externe)

### Prêt côté code
- `supabase/functions/_shared/payments.ts` — `initiateOrangeMoney()` structure complète
- Callback URL : `{SUPABASE_URL}/functions/v1/payment-orange-callback`
- Sandbox auto si `ORANGE_MONEY_API_KEY` absent (`isProviderSandbox`)

### Actions requises (Rémy / Orange)
1. Obtenir sandbox : `ORANGE_MONEY_API_KEY`, `ORANGE_MONEY_MERCHANT_KEY`, `ORANGE_MONEY_BASE_URL`
2. Secrets Supabase (jamais dans le repo)
3. Test topup 5 000 GNF sur numéro test
4. Enregistrer callback URL chez Orange

### Critère de succès
Transaction visible dans Orange Money **et** `wallet_ledger` + `payment_intents.status = completed`.

---

## A2 — Tests financiers

Fichiers :
- `packages/api/src/wallet/wallet.service.test.ts`
- `packages/api/src/wallet/subscription-plans.mapper.test.ts`
- `packages/api/src/payments/payments.service.test.ts`

Commande : `pnpm --filter @sonafrik/api test`

---

## A3 — subscription_plans

Migration : `supabase/migrations/20260624140000_vague_a_subscription_plans_rpc.sql`

- Plan `premium-annual` (480 000 GNF) inséré
- RPC `subscribe_premium` lit prix depuis `subscription_plans` (slugs `premium`, `premium-annual`)
- API : `WalletService.getListenerPremiumPlans()`
- UI : `SubscriptionModal` charge tarifs DB via `useSubscriptionPlans`

Validation DB :
```sql
SELECT slug, price_gnf, is_active FROM subscription_plans ORDER BY sort_order;
```

---

## A4 — E2E MVP

`apps/web/tests/e2e/mvp-chain.spec.ts` — session authentifiée, navigation listen → search → wallet.

Prérequis CI local : `SUPABASE_SERVICE_ROLE_KEY` pour `global-setup` auth state.

---

## A5 — LIVE CONTROL (fondateur)

Checklist à signer par Rémy :
- [ ] Performance probes 30/30 (`scripts/probe-performance-certification.ts`)
- [ ] Streaming bridge 262 tests API PASS
- [ ] Africa Mode flags OFF en prod par défaut
- [ ] Signature date dans `docs/performance/LIVE_CONTROL_PERFORMANCE.md`

---

## Prochaine vague

**Vague B** — après audit A validé (build + lint + typecheck + tests).
