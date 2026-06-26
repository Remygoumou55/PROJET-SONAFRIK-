# Vague G — Complétion chaîne MVP (juin 2026)

> Ordre d'exécution : G1 → G2 → G3 → G4 → G5. Audit après chaque item.

## Chaîne MVP (MVP_SCOPE_LOCK)

```
Compte → Profil → Catalogue → Publication → Écoutes → Royalties → Revenus → Retraits
```

## Statut global (re-audit 2e passe — 17/17 probes)

| ID | Tâche | Statut | Notes |
|---|---|---|---|
| G1 | Royalties UI `/wallet/royalties` | ✅ FAIT | `RoyaltiesPage` + erreurs + metadata |
| G2 | Paiements staging (flag env) | ✅ FAIT | `NEXT_PUBLIC_PAYMENTS_ENABLED` — doc ci-dessous |
| G3 | E2E chaîne wallet | ✅ FAIT | `mvp-chain.spec.ts` + `artist-journey-live.ts` |
| G4 | Cleanup wallet (pas de ComingSoon / layout dupliqué) | ✅ FAIT | payout unifié sous `WalletLayoutClient` |
| G5 | Credentials opérateurs prod | ⏸ BLOQUÉ | Rémy — voir `P0-2-PHASE-2-ORANGE-MONEY.md` |

### Probe automatisé
```bash
pnpm probe:vague-g-stabilisation
pnpm probe:vague-c-stabilisation   # régression C
```

---

## G1 — Royalties

- Route : `apps/web/src/app/(wallet)/wallet/royalties/page.tsx`
- Composant : `RoyaltiesPage.tsx` — `useRoyalties()` → `WalletService.getRoyaltyCalculations()`
- DB : `royalty_calculations.artist_id` = `auth.users.id` (RLS `select_own`)
- RPC admin : `open_royalty_cycle` → `calculate_royalties` → `distribute_royalties`

---

## G2 — Staging paiements

Activer en local/staging (jamais committer les secrets opérateurs) :

```env
# apps/web/.env.local
NEXT_PUBLIC_PAYMENTS_ENABLED=true
TOPUP_ENABLED=true
TOPUP_SANDBOX=true
```

Edge Functions : secrets Supabase `ORANGE_MONEY_*`, `WAVE_*`, etc.

Sans credentials opérateurs → boutons visibles mais sandbox `payment-initiate`.

---

## G3 — E2E

| Test | Fichier |
|---|---|
| Auditeur : listen → search → wallet → royalties → payout | `apps/web/tests/e2e/mvp-chain.spec.ts` |
| Artiste : onboarding → catalogue → publication | `scripts/artist-journey-live.ts` |

```bash
pnpm --filter @sonafrik/web test:e2e -- mvp-chain.spec.ts
npx tsx scripts/artist-journey-live.ts
```

---

## G4 — Cleanup

- Pas de `ComingSoon` sur `/wallet/royalties`
- Nav unique via `(wallet)/layout.tsx` + `WalletLayoutClient`
- Payout : message staging intégré, sans `<h1>` dupliqué

---

## G5 — Prod (bloqué externe)

1. Credentials Orange Money GN / Wave GN dans Supabase Secrets
2. `NEXT_PUBLIC_PAYMENTS_ENABLED=true` sur Vercel staging
3. Test topup 5 000 GNF → `wallet_ledger` + `payment_intents.status=completed`

Référence : `docs/P0-2-PHASE-2-ORANGE-MONEY.md`

---

## Prochaine étape

**Vague D** validée (`pnpm probe:vague-d-stabilisation`) — puis **LIVE CONTROL A5** + activation paiements prod (G5).
