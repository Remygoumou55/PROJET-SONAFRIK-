# Vague B — Stabilisation (audit forensique 26 juin 2026)

> Ordre d'exécution : B1 → B2 → B3 → B4 → B5. Audit après chaque item.

## Statut global (re-audit 24 juin 2026 — 11/11 probes)

| ID | Tâche | Statut | Notes |
|---|---|---|---|
| B1 | Régénérer `packages/database/types` depuis DB live | ✅ FAIT | 3766 lignes, `subscription_plans` typé |
| B2 | Réduire cold path middleware (session timeout UX) | ✅ FAIT | `getSession()` + admin timeout → SSR fallback |
| B3 | Documenter + tester rollback feature flags | ✅ FAIT | 40 flags, 3 MVP actifs vérifiés live |
| B4 | E2E Playwright élargi | ✅ FAIT | 6 specs |
| B5 | CSP durcissement prod | ✅ FAIT | `unsafe-eval` absent branche prod |

### Probe automatisé
```bash
pnpm probe:vague-b-stabilisation   # 11 checks forensique
pnpm probe:vague-b                 # 19 checks certification B++
```

---

## B1 — Types DB

```bash
pnpm gen:types
```

Validation :
```sql
SELECT slug FROM subscription_plans WHERE is_active = true;
```

---

## B2 — Middleware auth UX

Fichier : `apps/web/src/middleware.ts`

- Lecture cookie `getSession()` immédiate (pas de réseau)
- `getUser()` avec timeout 4s uniquement si pas de session locale
- Routes admin : `is_admin` RPC avec timeout 4s — fallback `null` laisse passer (SSR `requireAdmin` tranche)

---

## B3 — Feature flags rollback

Voir `docs/VAGUE_B_FLAGS_ROLLBACK.md` — **40 flags** en DB live (juin 2026).

Rollback d'urgence :
```sql
UPDATE public.feature_flags SET enabled = false, updated_at = now();
UPDATE public.feature_flags SET enabled = true WHERE name IN ('rights_management', 'search_multi_type', 'tips_enabled');
```

---

## B4 — E2E

| Spec | Couverture |
|---|---|
| `smoke.spec.ts` | Pages publiques, auth redirect |
| `auth.spec.ts` | listen, search, navigation |
| `wallet.spec.ts` | solde, abonnements DB |
| `library.spec.ts` | bibliothèque auditeur |
| `mvp-chain.spec.ts` | listen → search → wallet |
| `streaming-player.spec.ts` | player + analytics créateur |

---

## B5 — CSP

- **Dev** : `unsafe-eval` + `unsafe-inline` (HMR Next.js)
- **Prod** : `unsafe-eval` retiré — `unsafe-inline` conservé (phase 2 = nonces)

Prochaine phase CSP : nonces Next.js 15 + retrait `unsafe-inline`.

---

## Prochaine vague

**Vague C** — Nettoyage terminé (juin 2026). Prochaine : **Vague G** chaîne MVP E2E prod.
