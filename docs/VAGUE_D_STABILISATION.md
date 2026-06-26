# Vague D — Design tokens + typage strict (juin 2026)

> Ordre d'exécution : D1 → D2 → D3 → D4 → D5 → D6 → D7 → D8 → D9 → D10. Audit après chaque item.

## Statut global (re-audit 2e passe — 23/23 probes)

| ID | Tâche | Statut | Notes |
|---|---|---|---|
| D1 | Tokens CSS `@theme` (source unique) | ✅ FAIT | `globals.css` |
| D2 | 0 hex hardcodé web | ✅ FAIT | `pnpm probe:hex-colors` 4/4 |
| D3 | 0 hex hardcodé mobile | ✅ FAIT | scan TS/TSX mobile |
| D4 | 0 `as never` / `as any` dans `packages/api` (prod) | ✅ FAIT | tests exclus |
| D5 | Edge functions typées | ✅ FAIT | `payment-initiate` sans `as never` |
| D6 | Repositories API propres (26 fichiers) | ✅ FAIT | rights, payout, royalties, analytics… |
| D7 | Caps perf analytics / streaming | ✅ FAIT | `.limit(10_000)` + `periodDays≤90` + Zod |
| D8 | `count_unread_notifications` via RPC unique | ✅ FAIT | `identity.repository.ts` |
| D9 | Régression probes B / C / G | ✅ FAIT | scripts stabilisation présents |
| D10 | Live RLS (beats, admin RPC, royalties) | ✅ FAIT | listener non-admin refusé |

### Probes automatisés
```bash
pnpm probe:vague-d-stabilisation   # re-audit forensique Vague D
pnpm probe:vague-d                 # certification D++ historique (22 checks)
pnpm probe:hex-colors              # Global SCS couleurs
pnpm probe:vague-g-stabilisation   # régression chaîne MVP
pnpm probe:vague-c-stabilisation   # régression nettoyage
```

---

## D1 — Design tokens

Source unique : `apps/web/src/app/globals.css` (`@theme`).

**Interdit dans les composants :**
```tsx
// ❌
style={{ color: "#00D26A" }}
className="text-red-500"
```

**Obligatoire :**
```tsx
// ✅
className="text-vert-energie bg-surface"
style={{ color: "var(--color-vert-energie)" }}
```

Allowlist hex : `globals.css` + `GoogleAuthButton.tsx` (brand Google) + `packages/ui/src/tokens/colors.ts` (source tokens UI/mobile).

---

## D2–D3 — Zéro hex résiduel

| Zone | Cible | Probe |
|---|---|---|
| Web TS/TSX | 0 violation | `probe:hex-colors` |
| Mobile TS/TSX | 0 violation | `probe:vague-d-stabilisation` D3 |

---

## D4–D6 — Typage strict monorepo

| Zone | Règle |
|---|---|
| `packages/api/src/**/*.ts` (hors `*.test.ts`) | 0 `as never`, 0 `as any` |
| `supabase/functions/**/*.ts` | 0 `as never` |
| `*.repository.ts` | typage Supabase via `packages/database` |

Régénération types si drift :
```bash
pnpm gen:types
```

---

## D7 — Caps performance

| Fichier | Garde-fou |
|---|---|
| `streaming.repository.ts` | `.limit(10_000)` sur `stream_sessions` |
| `streaming/schemas.ts` | `periodDays` max **90** (aligné analytics) |
| `analytics/schemas.ts` | `.max(90)`, `.max(50)` |
| `payout/schemas.ts` | `.max(200)`, `.max(100)` |

**Règle repository :** pas de `if (error) return []` ni fallback permissif (`return true` sur erreur RPC). Les erreurs DB doivent être propagées ; le service layer gère la dégradation si nécessaire (`safe()` sur la recherche).

---

## D8 — Notifications count

`identity.repository.ts` → `rpc("count_unread_notifications")`  
Pas de `count: "exact", head: true` parallèle.

---

## D9 — Régression

Après toute modification D, exécuter dans l'ordre :
1. `pnpm probe:vague-d-stabilisation`
2. `pnpm probe:vague-d`
3. `pnpm probe:vague-g-stabilisation`
4. `pnpm probe:vague-c-stabilisation`
5. `pnpm build && pnpm lint && pnpm typecheck`

---

## D10 — Live Supabase

Compte test : `s13b-playwright-listener@sonafrik.test`

| Check | Attendu |
|---|---|
| `beats` published (listener) | lecture OK ou liste vide |
| `get_admin_payout_queue` | **refusé** (non-admin) |
| `count_unread_notifications` | nombre retourné |
| `open_royalty_cycle` | **refusé** (non-admin) |

---

## Prochaine vague

**A5 — LIVE CONTROL** (signature Rémy) — Vagues B, C, D, E et G validées.
