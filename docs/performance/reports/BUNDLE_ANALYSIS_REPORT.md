# Bundle Analysis Report — SONAFRIK Web

> **Date :** 26 juin 2026 · **Statut :** 🔵 BASELINE BUILD OUTPUT — analyse détaillée en attente  
> **Outil :** `next build` output · `@next/bundle-analyzer` **non installé**

---

## Résumé

| Métrique | Valeur | Gate MVP |
|---|---|---|
| Shared First Load JS | 103 kB | — |
| Max route P0 First Load JS | 220 kB (`/library`) | ≤230 kB ✅ |
| Min route P0 | 111 kB (`/creator`) | — |
| `@next/bundle-analyzer` | Absent | À installer |
| `dynamic()` calls | 7 | Cible ≥12 post-opt |

---

## First Load JS par route (build 26 juin)

| Route | Page | First Load JS |
|---|---|---|
| `/` | 3.62 kB | 174 kB |
| `/listen` | 3.88 kB | 219 kB |
| `/library` | 3.99 kB | 220 kB |
| `/search` | 3.75 kB | 204 kB |
| `/creator` | 4.77 kB | 111 kB |
| `/wallet` | 5 kB | 198 kB |
| `/auth/connexion` | 9.28 kB | 208 kB |
| `/admin` | 169 B | 106 kB |
| Middleware | — | 92.5 kB |

### Chunks partagés

```
chunks/2060-*.js     46.1 kB
chunks/5143f5d5-*.js 54.2 kB
other shared          2.3 kB
```

---

## Dynamic imports existants

| Fichier | Composant | SSR |
|---|---|---|
| `StreamingLayoutClient.tsx` | `WebPlayer` | false |
| `SearchPage.tsx` | `SearchResults` | false |
| `(public)/page.tsx` | `LandingNav`, `LiveStats` | default |
| `WalletClient.tsx` | `SubscriptionModal`, `TopupModal` | default |
| `TrackList.tsx` | `AudioUploader`, `CreditsEditor` | default |

---

## Dépendances `apps/web/package.json`

| Package | Risque bundle |
|---|---|
| `next` + `react` 19 | Core — incompressible |
| `@sentry/nextjs` | **Élevé** — replay + tracing |
| `@supabase/supabase-js` | Moyen |
| `@sonafrik/api` | Moyen — transpilé entier |
| `zod` | Faible-moyen |

**Absent (positif) :** chart.js, recharts, framer-motion, moment, lodash.

---

## `next.config.ts` optimisations actives

- `compress: true`
- `optimizePackageImports: ["@sentry/nextjs"]` uniquement
- `transpilePackages`: @sonafrik/*
- `experimental.staleTimes`: static 300s, dynamic 30s
- Images AVIF/WebP

**Non activé :** `optimizePackageImports` pour `@sonafrik/api`, `@sonafrik/ui`.

---

## Duplication / code mort (hypothèses)

| Zone | Risque | Vérification |
|---|---|---|
| `useStreaming` + bridge | Deux chemins service | Bridge utilise legacy — OK |
| Admin client islands | 10 fichiers client | Lazy load centres |
| Marketplace beat store | Feature flag OFF | Chunk peut être lazy |

---

## Plan analyse détaillée

```powershell
# Étape 1 — installer (future PR optimisation)
cd apps/web
pnpm add -D @next/bundle-analyzer

# Étape 2 — next.config wrapper withBundleAnalyzer

# Étape 3
$env:ANALYZE="true"; pnpm build
```

---

## Optimisations flaggées (Phase E)

| Flag | Action |
|---|---|
| `performance_bundle_split_enabled` | Split route groups |
| `performance_lazy_loading_enabled` | Admin centres, analytics, modales |

---

## Décision

```
❌ BUNDLE ANALYSIS — INCOMPLET
```

Baseline First Load JS **conforme gate 230 kB**. Analyse treemap requise avant certification finale.

---

*Programme : [`../PERFORMANCE_UX_CERTIFICATION.md`](../PERFORMANCE_UX_CERTIFICATION.md)*
