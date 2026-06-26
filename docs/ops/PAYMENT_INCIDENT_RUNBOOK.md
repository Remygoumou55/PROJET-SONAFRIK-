# Runbook — Incident paiement (staging / prod)

## Symptômes

- Topup reste `pending` > 15 min
- Webhook callback 4xx/5xx dans logs Supabase Edge
- Solde wallet non crédité après succès opérateur

## Vérifications immédiates

1. **Edge logs** : `payment-initiate`, `payment-*-callback`
2. **DB** : `SELECT id, status, provider, updated_at FROM payment_intents ORDER BY created_at DESC LIMIT 20`
3. **RPC** : `confirm_payment_intent` réservé service_role uniquement
4. **Flags** : `NEXT_PUBLIC_PAYMENTS_ENABLED` côté web

## Actions par statut intent

| Statut | Action |
|---|---|
| `pending` | Vérifier webhook reçu · relancer callback sandbox si applicable |
| `failed` | Lire `failure_reason` · ne pas re-créditer manuellement sans audit |
| `completed` | Vérifier `wallet_ledger` entrée `credit` liée |

## Escalade

- **Staging** : logs Supabase + `docs/PAIEMENTS.md`
- **Prod** : bloqué sans credentials opérateurs (`docs/ROADMAP_BLOCKERS.md` A1)

## Interdictions

- Jamais `topup_wallet` RPC côté client
- Jamais UPDATE manuel `wallet_ledger` sans trace `audit_logs`
