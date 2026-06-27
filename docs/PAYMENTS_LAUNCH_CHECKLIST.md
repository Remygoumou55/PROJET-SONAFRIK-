# Checklist lancement paiements SONAFRIK

> **Problèmes audit #1–3** — Credentials prod, chaîne E2E, Orange Money Phase 2  
> **Responsable secrets :** Rémy Goumou (Supabase Dashboard → Project Settings → Edge Functions → Secrets)  
> **Code :** sandbox opérationnel ; prod bloquée tant que secrets absents (`*_credentials_missing`)

---

## Ordre d'exécution (ne pas inverser)

### Étape 0 — Prérequis code (✅ fait)

- [x] Edge `payment-initiate` + callbacks Orange/MTN/Wave/Soutra
- [x] `_shared/payments.ts` — détection sandbox si clé API absente
- [x] Tests unitaires `payments.service.test.ts`, `wallet.service.test.ts`
- [x] UI wallet + payout (grisé si `NEXT_PUBLIC_PAYMENTS_ENABLED=false`)

### Étape 1 — Secrets Supabase (staging)

| Secret | Opérateur |
|---|---|
| `ORANGE_MONEY_BASE_URL` | Orange GN |
| `ORANGE_MONEY_API_KEY` | Orange GN |
| `ORANGE_MONEY_MERCHANT_KEY` | Orange GN |
| `MTN_MOMO_BASE_URL` | MTN MoMo |
| `MTN_MOMO_SUBSCRIPTION_KEY` | MTN MoMo |
| `MTN_MOMO_API_KEY` | MTN MoMo |
| `MTN_MOMO_TARGET_ENV` | `sandbox` puis `production` |
| `WAVE_*` / `SOUTRA_*` | Selon contrats |

Callbacks enregistrés chez chaque opérateur :

- `https://cxjpburiiazzvlczzupy.supabase.co/functions/v1/payment-orange-callback`
- `https://cxjpburiiazzvlczzupy.supabase.co/functions/v1/payment-mtn-callback`
- (idem wave, soutra)

### Étape 2 — Sandbox staging

1. `TOPUP_SANDBOX=true` (staging uniquement)
2. Topup **5 000 GNF** numéro test → vérifier `payment_intents.status = confirmed`
3. Vérifier entrée `wallet_ledger`
4. Demande retrait test → vérifier `withdrawals` + `payout_audit_logs.action = requested`

```sql
SELECT id, status, amount_gnf, provider FROM payment_intents ORDER BY created_at DESC LIMIT 5;
SELECT COUNT(*) FROM wallet_ledger;
SELECT * FROM payout_audit_logs ORDER BY created_at DESC LIMIT 5;
```

### Étape 3 — Orange Money Phase 2 (prod)

Voir `docs/P0-2-PHASE-2-ORANGE-MONEY.md`.

**Critère succès :** artiste reçoit GNF sur numéro Orange GN + trace dans `wallet_ledger`.

### Étape 4 — Production

1. Secrets prod (jamais dans le repo)
2. `NEXT_PUBLIC_PAYMENTS_ENABLED=true` sur Vercel
3. `TOPUP_SANDBOX=false`
4. 1 transaction réelle contrôlée par Rémy
5. `pnpm test:e2e:smoke` + validation manuelle `/wallet/payout`

---

## Validation automatisée locale

```powershell
pnpm test --filter @sonafrik/api
pnpm probe:certification
npx tsx scripts/probe-withdrawal-sandbox.ts
```

## En cas d'échec

`docs/ops/PAYMENT_INCIDENT_RUNBOOK.md`
