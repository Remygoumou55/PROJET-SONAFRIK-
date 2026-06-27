# P0-2 Phase 2 — Intégration Orange Money GN

## En attente des credentials opérateur

### Ce qui est prêt (Phase 1 complétée)

- UI wallet débloquée (solde + historique visibles sans `ComingSoon`)
- Boutons recharge/retrait grisés tant que `NEXT_PUBLIC_PAYMENTS_ENABLED=false`
- Edge `wallet-topup` : message pré-lancement (423) + mode sandbox `TOPUP_SANDBOX`
- Cycle royalties déclenchable depuis `/admin/finance`
- Migration `get_launch_progress` documentée dans le repo

### Ce qui manque pour Phase 2

1. Credentials Orange Money Guinée sandbox :
   - API Key sandbox
   - API Secret sandbox
   - Merchant ID
   - Callback URL enregistrée chez Orange

2. Une fois les credentials obtenus :
   - Ajouter dans Supabase Secrets (jamais dans le code)
   - Vérifier `supabase/functions/_shared/payments.ts` (sandbox → production)
   - Passer `TOPUP_ENABLED=true` en **staging uniquement**
   - Tester un topup réel de 5 000 GNF sur numéro test

3. Contact Orange Money Guinée :
   - Programme développeur : https://developers.orange.com/
   - Documentation API Orange Money GN spécifique à obtenir

### Validation automatisée (avant credentials prod)

```powershell
pnpm probe:payment-credentials   # sandbox OK = clés prod absentes (attendu)
pnpm run:finance-sandbox-e2e     # chaîne topup → payout_account → withdrawal
```

### Critère de succès Phase 2

Un artiste reçoit des GNF sur son numéro Orange Money guinéen depuis SONAFRIK — prouvé par une transaction visible dans l'historique Orange Money **et** dans `wallet_ledger`.

### Validation Phase 1 (manuelle)

```sql
-- Après déclenchement cycle admin :
SELECT COUNT(*) FROM royalty_cycles;
SELECT COUNT(*) FROM wallet_ledger;
```

Les deux compteurs doivent être > 0.
