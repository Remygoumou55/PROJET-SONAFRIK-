# Vague A — Certification (Urgence Prod + Finance)

**Date :** 5 juillet 2026  
**Statut :** ✅ CERTIFIÉE (3 cycles complétés)  
**Prochaine vague :** Vague B (Navigation + Rendering)

---

## Périmètre Vague A

| ID | Tâche | Résultat |
|---|---|---|
| A1 | CSP/nonce — écran noir `/creator` prod | ✅ Corrigé localement |
| A2 | Credentials paiements prod (Supabase Secrets) | ⏸ BLOQUÉ — action Rémy |
| A3 | Probe chaîne finance E2E | ✅ 13/13 |
| A4 | Tests Vitest wallet/payments/payout | ✅ 37/37 |
| A5 | Build routes `/creator`, `/listen`, `/wallet` | ✅ Dynamic (ƒ) |

---

## Cycle 1 — Correction initiale

### Livraisons
- `middleware.ts` — CSP sur requête + réponse, nonce `x-nonce`, exclusion prefetch matcher
- `layout.tsx` — `connection()` + `headers()` pour injection nonce Next.js
- `lib/security/csp.ts` + `csp.test.ts` — builder CSP + 4 tests unitaires
- `scripts/vitest.web-navigation.config.ts` — inclut tests CSP
- `package.json` — script `test:finance`

### Validation cycle 1
| Check | Résultat |
|---|---|
| typecheck | ✅ |
| lint | ✅ |
| test:web-navigation | ✅ 13/13 |
| test:finance | ✅ 37/37 |
| test:srtsp | ✅ 100/100 |
| web build | ✅ 50 pages |
| probe:finance-chain | ❌ 12/13 (D2-subscription-plans) |
| probe:payment-credentials | ✅ 4/4 sandbox |

---

## Cycle 2 — Re-audit + recorrection

### Problème détecté
`probe:finance-chain` échouait sur D2-subscription-plans avec message trompeur « 0 plans actifs ».

**Cause racine :** `service_role` n'avait pas `GRANT SELECT` sur `subscription_plans` (seulement REFERENCES/TRIGGER/TRUNCATE). Le count head masquait l'erreur `permission denied`.

### Corrections
- `scripts/probe-finance-chain.ts` — select explicite + message d'erreur détaillé
- `supabase/migrations/20260705190000_vague_a_subscription_plans_grants.sql` — GRANT SELECT/INSERT/UPDATE/DELETE + seed idempotent 4 plans

### Validation cycle 2
| Check | Résultat |
|---|---|
| typecheck | ✅ |
| lint | ✅ |
| test:web-navigation | ✅ 13/13 |
| test:finance | ✅ 37/37 |
| web build | ✅ |
| test:srtsp | ✅ 100/100 |
| probe:finance-chain | ✅ **13/13** |
| probe:payment-credentials | ✅ 4/4 sandbox |
| DB subscription_plans | ✅ 4 plans actifs |

---

## Cycle 3 — Re-audit final

### Vérifications supplémentaires
- CSP prod locale `/lancement` : header `script-src 'nonce-…' 'strict-dynamic'` présent
- Middleware matcher : prefetch exclu (Next.js docs)
- Redirects auth : `secure()` applique CSP sur réponses 302 (scripts non exécutés)
- Zones FREEZE respectées : SRTSP, Session Engine, Publication Library

### Validation cycle 3
| Check | Résultat |
|---|---|
| typecheck | ✅ |
| test:web-navigation | ✅ 13/13 |
| test:finance | ✅ 37/37 |
| probe:finance-chain | ✅ 13/13 |
| probe:payment-credentials | ✅ 4/4 |

---

## Bloqueur externe A2 (non code)

Credentials opérateurs prod à injecter dans **Supabase Dashboard → Edge Functions → Secrets** :

```
ORANGE_MONEY_API_KEY, ORANGE_MONEY_MERCHANT_KEY, ORANGE_MONEY_BASE_URL
MTN_MOMO_API_KEY, MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_TARGET_ENV
WAVE_API_KEY, WAVE_BASE_URL
SOUTRA_API_KEY
```

Sandbox fonctionne sans ces secrets — comportement attendu pré-lancement.

---

## Déploiement requis pour prod

Le fix CSP/nonce (A1) est **local uniquement** tant qu'il n'est pas déployé sur Vercel.

**Action :** push + deploy Vercel pour corriger l'écran noir `sonafrik.vercel.app/creator`.

---

## Fichiers touchés (Vague A)

- `apps/web/src/middleware.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/lib/security/csp.ts`
- `apps/web/src/lib/security/csp.test.ts`
- `scripts/vitest.web-navigation.config.ts`
- `scripts/probe-finance-chain.ts`
- `package.json`
- `supabase/migrations/20260705190000_vague_a_subscription_plans_grants.sql`

---

## Décision

**Vague A certifiée** pour tout ce qui est corrigeable côté code/DB.  
**A2 reste ouvert** jusqu'à injection secrets prod par le fondateur.

**→ Autorisation de démarrer Vague B.**
