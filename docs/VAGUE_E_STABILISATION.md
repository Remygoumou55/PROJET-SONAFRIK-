# Vague E — Paiements mobiles & sécurité financière (juin 2026)

> Ordre d'exécution : E1 → E2 → E3 → E4 → E5 → E6 → E7 → E8 → E9 → E10 → E11. Audit après chaque item.

## Statut global (re-audit 2e passe — 26/26 probes)

| ID | Tâche | Statut | Notes |
|---|---|---|---|
| E1 | Opérateurs partagés (`_shared/payments.ts`) | ✅ FAIT | Orange · MTN · Wave · Soutra + sandbox |
| E2 | Callbacks DRY (`_shared/payment-callback.ts`) | ✅ FAIT | `confirmPaymentIntent` + `markPaymentIntentFailed` |
| E3 | 4 Edge Functions webhook | ✅ FAIT | orange · mtn · wave · soutra |
| E4 | Auth webhooks (HMAC / API key) | ✅ FAIT | Wave/Soutra HMAC · Orange HMAC · MTN API key |
| E5 | `payment-initiate` (sandbox + prod) | ✅ FAIT | Pas de crédit optimiste |
| E6 | Edge functions typées | ✅ FAIT | 0 `as never` |
| E7 | API `packages/api/payments` | ✅ FAIT | Zod min 1000 GNF · erreurs edge · `intent_list_failed` |
| E8 | UI wallet (TopupModal + gates) | ✅ FAIT | `NEXT_PUBLIC_PAYMENTS_ENABLED` · historique erreurs |
| E9 | Retraits + audit `requested` | ✅ FAIT | `request_withdrawal` + `payout_audit_logs` |
| E10 | Sécurité financière | ✅ FAIT | `confirm_payment_intent` service_role · `topup_wallet` bloqué |
| E11 | Régression D / G | ✅ FAIT | probes stabilisation |

### Probes automatisés
```bash
pnpm probe:vague-e-stabilisation   # re-audit forensique Vague E
pnpm probe:vague-e                 # certification E++ historique (22 checks)
pnpm probe:vague-d-stabilisation   # régression typage
pnpm probe:vague-g-stabilisation   # régression chaîne MVP
```

---

## E1 — Opérateurs

Fichier : `supabase/functions/_shared/payments.ts`

| Provider | Initiation | Webhook |
|---|---|---|
| `wave_gn` | Checkout session | HMAC `Wave-Signature` |
| `orange_money_gn` | WebPay API | HMAC `X-Orange-Signature` |
| `mtn_momo_gn` | requestToPay | `X-Callback-Api-Key` |
| `soutra_money` | REST initiate | HMAC `X-Soutra-Signature` |

Sandbox : `isProviderSandbox()` — clé API absente ou `{PROVIDER}_SANDBOX=true`.

---

## E2–E3 — Callbacks

**Règle absolue CDC** : crédit wallet **uniquement** via `confirm_payment_intent` (service_role), jamais côté client.

Tous les callbacks retournent **HTTP 200** (éviter retries opérateur).

---

## E5 — payment-initiate

```
Client auth → INSERT payment_intents (initiated)
  → sandbox ? pending + return
  → prod ? appel opérateur → pending + checkoutUrl/ussdPush
  → échec opérateur ? status failed (pas de crédit)
```

---

## E7 — API payments

- `initiatePaymentSchema` : min **1 000 GNF**
- `listUserIntents` : propage `PaymentError("intent_list_failed")` (pas de swallow)
- `getIntent` : polling client TopupModal (3s / 5 min max)

---

## E8 — UI wallet

| Flag env | Effet |
|---|---|
| `NEXT_PUBLIC_PAYMENTS_ENABLED=false` | Topup + retrait masqués (staging) |
| `NEXT_PUBLIC_PAYMENTS_ENABLED=true` | TopupModal + payout actifs |

`PaymentHistory` : état erreur visible (`role="alert"`), pas de silence sur échec DB.

---

## E9 — Retraits

Migration : `20260624200000_vague_e_payout_audit_request.sql`  
Action audit : `requested` dans `payout_audit_logs` à la création du retrait.

---

## E10 — Garde-fous live

| RPC / Edge | Listener | Attendu |
|---|---|---|
| `confirm_payment_intent` | auditeur | **refusé** |
| `topup_wallet` | auditeur | **refusé** |
| `request_withdrawal` | sans compte payout | **erreur** |

---

## Prod bloquée (externe)

Credentials opérateurs Rémy → `docs/P0-2-PHASE-2-ORANGE-MONEY.md`  
Sans secrets : sandbox `payment-initiate` OK, pas de flux réel opérateur.

---

## Prochaine vague

**A5 — LIVE CONTROL** (signature Rémy) — validation fondateur avant lancement public.
