# SONAFRIK — Guide Paiements Mobiles Africains

Sprint G-4 · Orange Money GN · MTN MoMo · Wave · Soutra Money

---

## Architecture

```
Client (browser)
  └─ TopupModal (4 étapes)
       └─ usePaymentService → createPaymentsService
            └─ Edge Function payment-initiate
                 ├─ INSERT payment_intents (status = initiated → pending)
                 └─ TODO: push USSD vers l'opérateur (credentials production requis)

Opérateur (webhook POST)
  └─ Edge Function payment-{orange|mtn|wave|soutra}-callback
       └─ RPC confirm_payment_intent (SECURITY DEFINER, service_role only)
            ├─ UPDATE payment_intents (status = confirmed)
            ├─ INSERT transactions (topup, completed)
            ├─ UPDATE wallets (balance_gnf += amount)
            ├─ INSERT wallet_ledger (credit, immuable)
            └─ log_audit_event

Client (polling)
  └─ usePaymentService.getIntent(intentId) toutes les 3s
       └─ Dès status = confirmed → afficher succès + reload wallet
```

**Règle financière absolue** : le crédit wallet n'a lieu QU'APRÈS la confirmation webhook de l'opérateur via `confirm_payment_intent`. Jamais de crédit optimiste.

---

## Cycle de vie d'un payment_intent

```
initiated  →  pending  →  confirmed   (paiement réussi)
                       →  failed      (rejeté par l'opérateur)
                       →  expired     (30 min écoulées sans confirmation)
confirmed  →  refunded (futur Sprint G-5)
```

---

## Edge Functions déployées

| Fonction | Déclencheur | Rôle |
|---|---|---|
| `payment-initiate` | Client authentifié (POST) | Crée l'intent + push opérateur |
| `payment-orange-callback` | Webhook Orange Money | Confirme ou échoue l'intent |
| `payment-mtn-callback` | Webhook MTN MoMo | Confirme ou échoue l'intent |
| `payment-wave-callback` | Webhook Wave | Confirme (HMAC-SHA256 vérifié) |
| `payment-soutra-callback` | Webhook Soutra Money | Confirme ou échoue l'intent |

Toutes les Edge Functions callback retournent **toujours HTTP 200** pour éviter les retries opérateur.

---

## Déploiement des Edge Functions

```bash
supabase functions deploy payment-initiate
supabase functions deploy payment-orange-callback
supabase functions deploy payment-mtn-callback
supabase functions deploy payment-wave-callback
supabase functions deploy payment-soutra-callback
```

Configurer les secrets dans Supabase Dashboard → Edge Functions → Secrets :

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
ORANGE_MONEY_BASE_URL / ORANGE_MONEY_API_KEY / ORANGE_MONEY_WEBHOOK_SECRET
MTN_MOMO_BASE_URL / MTN_MOMO_SUBSCRIPTION_KEY / MTN_MOMO_API_KEY / MTN_MOMO_CALLBACK_API_KEY
WAVE_BASE_URL / WAVE_API_KEY / WAVE_WEBHOOK_SECRET
SOUTRA_BASE_URL / SOUTRA_API_KEY / SOUTRA_WEBHOOK_SECRET
```

---

## URLs de callback à enregistrer chez les opérateurs

```
Orange Money :  https://<project>.supabase.co/functions/v1/payment-orange-callback
MTN MoMo :     https://<project>.supabase.co/functions/v1/payment-mtn-callback
Wave :          https://<project>.supabase.co/functions/v1/payment-wave-callback
Soutra Money :  https://<project>.supabase.co/functions/v1/payment-soutra-callback
```

---

## Mode sandbox (développement)

En l'absence de credentials opérateurs réels, la variable `{PROVIDER}_SANDBOX=true` (ex: `ORANGE_MONEY_GN_SANDBOX=true`) fait passer l'intent directement en `pending` sans appel opérateur.

Pour tester un paiement complet en sandbox, appeler manuellement `confirm_payment_intent` depuis le SQL Editor :

```sql
SELECT public.confirm_payment_intent(
  '<intent-id-uuid>',
  'SANDBOX-TEST-REF-001'
);
-- Retourne : { "wallet_id": "...", "new_balance": 10000, "idempotent": false }
```

---

## Intégrations opérateurs à finaliser (TODO)

Chaque opérateur nécessite un accès commercial avant de pouvoir utiliser leur API en production :

| Opérateur | Ressource | Statut |
|---|---|---|
| Orange Money GN | [developer.orange.com](https://developer.orange.com) — accès commercial requis | TODO |
| MTN MoMo | [momodeveloper.mtn.com](https://momodeveloper.mtn.com) | TODO |
| Wave | Contacter Wave Business GN | TODO |
| Soutra Money | Contacter support@soutra.money | TODO |

Les stubs d'intégration (corps TODO commentés) se trouvent dans `supabase/functions/payment-initiate/index.ts`.

---

## Sécurité

- `confirm_payment_intent` : `GRANT TO service_role` uniquement — impossible à appeler depuis le client
- `payment-initiate` : requiert un JWT utilisateur valide dans le header `Authorization`
- Webhooks : vérification de signature (secret partagé ou HMAC-SHA256 selon l'opérateur)
- Idempotence : `payment_reference = intent_id` dans `transactions` → un intent = un seul crédit
- Verrou `FOR UPDATE` sur `payment_intents` lors de la confirmation → pas de double crédit concurrent

---

## Comptabilité (Rule #5)

Aucun texte visible à l'utilisateur ne mentionne de frais, commission, ou taux. Les frais opérateurs sont absorbés en dehors de l'interface.
