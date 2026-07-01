# Paiements production — checklist secrets Supabase

> Dernière mise à jour : 30 juin 2026  
> Projet : `cxjpburiiazzvlczzupy`

## Blocage automatique

`payment-initiate` appelle `assertPaymentOperatorReady()` : en prod (`SONAFRIK_ENV=production`), si les clés opérateur manquent → **HTTP 503** `payment_operator_not_ready`.

Sandbox explicite : `{PROVIDER}_SANDBOX=true` dans Supabase Edge Secrets.

## Secrets obligatoires par opérateur (prod)

| Opérateur | Variables Supabase Secrets |
|---|---|
| Orange Money GN | `ORANGE_MONEY_API_KEY`, `ORANGE_MONEY_MERCHANT_KEY`, `ORANGE_MONEY_CLIENT_ID`, `ORANGE_MONEY_CLIENT_SECRET`, `ORANGE_MONEY_WEBHOOK_SECRET` |
| MTN MoMo GN | `MTN_MOMO_SUBSCRIPTION_KEY`, `MTN_MOMO_API_KEY`, `MTN_MOMO_API_USER` |
| Wave GN | `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET` |
| Soutra Money | `SOUTRA_API_KEY`, `SOUTRA_MERCHANT_ID` |

## Communs

| Variable | Usage |
|---|---|
| `SONAFRIK_WEB_URL` | Callbacks success/error Wave |
| `SONAFRIK_ENV` | `production` pour activer le mode strict |
| `TOPUP_ENABLED` | `false` en prod (topup direct interdit) |

## Validation avant lancement

```bash
# Lireiness (depuis machine avec secrets configurés)
curl -X POST "$SUPABASE_URL/functions/v1/payment-initiate" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "apikey: $ANON_KEY" \
  -d '{"provider":"orange_money_gn","purpose":"topup","amountGnf":5000,"phone":"620000000"}'
```

Attendu prod sans secrets : `503` + `payment_operator_not_ready`.  
Attendu sandbox : `200` + `"sandbox": true`.

## Référence

- `docs/P0-2-PHASE-2-ORANGE-MONEY.md`
- `supabase/functions/_shared/payments.ts` → `getPaymentOperatorsReadiness()`
