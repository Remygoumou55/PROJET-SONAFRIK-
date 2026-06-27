# PERFORMANCE & UX CERTIFICATION PROGRAM — SONAFRIK MVP

> **Version :** 1.0 · **Date :** 26 juin 2026  
> **Type :** Discovery + cadre de certification (zéro optimisation code dans cette livraison)  
> **Agent :** Claude Sonnet 4.6

---

## Contexte

L'architecture Enterprise (streaming, metadata, publication) est certifiée techniquement (262 tests API, probes 130/130). **Aucune mesure officielle** n'a été réalisée sur :

- expérience utilisateur et fluidité
- Core Web Vitals
- poids réel des bundles
- performance React (re-renders)
- comportement sur connexions africaines limitées

SONAFRIK cible l'Afrique de l'Ouest — réseaux mobiles instables, appareils d'entrée de gamme. L'expérience doit rester fluide dans ces conditions.

---

## Objectif unique

Mesurer · auditer · corriger · optimiser · certifier — **sans ajouter de fonctionnalités**.

Résultat attendu : application rapide, fluide, agréable, adaptée au marché africain.

---

## Architecture freeze

| Zone | Statut |
|---|---|
| Runtime Foundation | 🔒 LOCKED |
| Session Engine | 🔒 LOCKED |
| Playback Runtime | 🔒 LOCKED |
| Wallet / Royalties | 🔒 LOCKED |
| Publication Platform | 🔒 LOCKED |
| Metadata Engine | 🔒 LOCKED |
| `apps/web/` UI, hooks, assets, cache | ✅ Périmètre optimisations |
| Feature flags `performance_*` | ✅ Activation progressive |

---

## Phase A — Performance Discovery ✅

**Statut :** complété 26 juin 2026 · probe `pnpm probe:performance-discovery`

### Next.js App Router

| Métrique | Valeur mesurée |
|---|---|
| Routes `page.tsx` | 49 |
| Pages RSC (server) | ~48 |
| Pages `"use client"` | 1 (`onboarding/role`) |
| Fichiers `"use client"` total | **119** |
| `loading.tsx` | **46** segments |
| `error.tsx` | **7** (tous route groups) |
| `dynamic()` | **7** appels / 5 fichiers |
| `<Suspense>` | **8** boundaries |
| `lazy()` React | **0** |

### Points forts

- Homepage `/listen` : RSC + `unstable_cache` 300s, 5 appels parallèles
- `CoverImage` centralisé → `next/image` uniquement (AVIF/WebP)
- `Montserrat` via `next/font` (`display: swap`, `preload: true`)
- `WebPlayer` en `dynamic(ssr: false)` — audio hors SSR
- `useNetworkAware` + `useStreamQuality` — débit adaptatif 64/96/128 kbps
- Zero librairie charts lourde (SVG/CSS custom)
- Pas de React Query → pas de bundle TanStack

### Gaps identifiés

| ID | Gap | Priorité |
|---|---|---|
| A1 | **119 client components** — conversion RSC progressive | Moyenne |
| A2 | **0 React Query** — pas de cache/dedup client unifié | Moyenne |
| A3 | **7 dynamic()** seulement — splitting limité | Haute |
| A4 | Pas de `@next/bundle-analyzer` | Haute |
| A5 | Pas de probe Lighthouse/CWV en CI | Critique |
| A6 | `loading.tsx` absent : `onboarding/`, `legal/` | Basse |
| A7 | Animations CDC >300ms (landing, creator KPI) | Moyenne |
| A8 | Recherche sans cache (`useSearch` debounce 300ms OK) | Moyenne |
| A9 | Sentry + Session Replay côté client — impact bundle à mesurer | Moyenne |
| A10 | CSP `unsafe-eval` + `unsafe-inline` prod | Sécurité/perf |

### Données réseau (patterns mesurés)

| Page | Fetch serveur | Client |
|---|---|---|
| `/listen` | 5 parallèles (cached) | Player bridge |
| `/creator` | 1 agrégé | 13+ widgets client |
| `/creator/analytics` | 7 parallèles | Charts SVG |
| `/library` | 0 | 2 appels `useLibrary` |
| `/search` | 0 | Debounce 300ms → API |

---

## Phase B — Core Web Vitals

**Statut :** 🔵 cadre défini · mesures **non exécutées**

### Seuils MVP (connexion 4G simulée, mobile)

| Métrique | Bon | À améliorer | Mauvais | Cible MVP |
|---|---|---|---|---|
| **LCP** | ≤2.5s | ≤4.0s | >4.0s | **≤2.5s** pages P0 |
| **INP** | ≤200ms | ≤500ms | >500ms | **≤200ms** |
| **CLS** | ≤0.1 | ≤0.25 | >0.25 | **≤0.1** |
| **FCP** | ≤1.8s | ≤3.0s | >3.0s | **≤1.8s** |
| **TTFB** | ≤0.8s | ≤1.8s | >1.8s | **≤0.8s** Vercel |

### Pages P0 (mesure obligatoire)

`/listen` · `/search` · `/listen/artist/[id]` · `/library` · `/auth/connexion` · `/creator` · `/lancement`

### Baseline build (First Load JS — build 26 juin)

| Route | Size | First Load JS |
|---|---|---|
| `/listen` | 3.88 kB | **219 kB** |
| `/library` | 3.99 kB | **220 kB** |
| `/search` | 3.75 kB | **204 kB** |
| `/` (landing) | 3.62 kB | **174 kB** |
| `/creator` | 4.77 kB | **111 kB** |
| Shared chunks | — | **103 kB** |

**Gate bundle MVP :** First Load JS P0 ≤ **230 kB** (actuel : conforme sur routes mesurées).

Rapport détaillé : [`reports/CORE_WEB_VITALS_REPORT.md`](./reports/CORE_WEB_VITALS_REPORT.md)

---

## Phase C — Runtime Performance (audio)

**Statut :** 🔵 méthodologie définie · comparaison Legacy vs Runtime en attente LIVE CONTROL

### Métriques à mesurer

| Métrique | Outil | Cible MVP |
|---|---|---|
| Time to play (clic → audio) | `performance.now()` bridge | **≤3s** 4G · **≤8s** 3G |
| `stream-start` latency | DevTools Network | **≤2s** p95 |
| Heartbeat interval | Network tab | Stable, pas de doublons |
| URL recovery (expiry) | Simuler 2h+ session | 1 retry max (existant) |
| Buffer events | `waiting` audio + logs bridge | ≤2/min réseau stable |
| Changement morceau (queue) | Chronomètre | **≤4s** |

### Comparaison Legacy vs Runtime

Aligné sur [`streaming/SPRING_2_MVP_INTEGRATION.md`](../streaming/SPRING_2_MVP_INTEGRATION.md) Phase G :

**Gate :** Runtime ≤ Legacy + **10 %** sur time-to-play.

---

## Phase D — React Performance

**Statut :** 🔵 audit manuel requis

### Zones à profiler (React DevTools Profiler)

| Composant | Risque | Action |
|---|---|---|
| `WebPlayer` + `playerContext` | Re-renders heartbeat | `memo` déjà sur WebPlayer — vérifier context split |
| `CreatorDashboardView` | 13+ enfants client | Profiler au mount |
| `SearchResults` | Re-render chaque frappe | Déjà debounced — vérifier stale guard |
| `HomepageContentSections` | 5 sections + Suspense | OK RSC |
| `AdminFlagsCenter` | Optimistic toggle | `useTransition` présent |

### Règles d'optimisation (post-discovery)

1. Extraire contextes granulaires (player state vs actions)
2. `useMemo`/`useCallback` uniquement si Profiler le justifie
3. Convertir islands statiques en RSC
4. Pas de nouvelle librairie state sans justification MVP

---

## Phase E — Bundle Analysis

**Statut :** 🔵 baseline partielle (build output) · analyse détaillée en attente

### Actions planifiées

```powershell
# À exécuter avant certification
cd apps/web
ANALYZE=true pnpm build   # après ajout @next/bundle-analyzer
```

### Hypothèses deps lourdes (à confirmer)

| Package | Risque |
|---|---|
| `@sentry/nextjs` | Replay + tracing client |
| `@supabase/supabase-js` | Client browser |
| `@sonafrik/api` | Transpilé entier |

### Optimisations flaggées

- `performance_bundle_split_enabled` — routes admin/wallet en chunks séparés
- `performance_lazy_loading_enabled` — modales creator, sections dashboard

Rapport : [`reports/BUNDLE_ANALYSIS_REPORT.md`](./reports/BUNDLE_ANALYSIS_REPORT.md)

---

## Phase F — Network Optimization

**Statut :** 🟡 partiellement en place

### Existant ✅

- `compress: true` Next.js
- Cache headers : `/_next/static` immutable 1 an
- Images : AVIF/WebP, `minimumCacheTTL` 7j
- `preconnect` Supabase + Google dans `layout.tsx`
- `prefetch` `/listen`, `/auth/connexion`
- Server fetch timeout 8s (cold start protection)
- Audio qualité adaptative (`networkAware.ts`)

### À optimiser

| ID | Action | Flag |
|---|---|---|
| F1 | Prefetch sélectif nav listener uniquement | `performance_prefetch_enabled` |
| F2 | Réduire appels parallèles analytics creator | — |
| F3 | Cache search 5 min TTL mémoire | `performance_search_cache_enabled` |
| F4 | Signed URL TTL review (7200s) | hors scope perf UI |

---

## Phase G — UX Humanization

**Statut :** 🔵 audit écran par écran requis

### Existant ✅

- 46 `loading.tsx` + `SkeletonCard` / `SkeletonRow`
- Tokens skeleton `--color-skeleton`
- Transitions ≤300ms majorité UI
- Feedback : spinners search, badges économie réseau player

### Violations CDC animations (>300ms)

| Fichier / règle | Durée | Action |
|---|---|---|
| `.landing-pulse` | 2s | Réduire ou flag `performance_animation_cdc_compliant_enabled` |
| `.creator-pulse-cta` | 2s | Idem |
| `.landing-player-progress` | 8s | Landing only — acceptable hors app |
| `useCountUp` / `useAnimatedNumber` | 1200–1500ms | Réduire à 300ms max ou désactiver Africa Mode |
| `creator-fill-bar` | 0.8s | Réduire à 0.3s |

### Zones « robotiques » identifiées

- Onboarding sans skeleton dédié
- Pages `legal/` sans loading segment
- Erreurs player : banner OK mais pas de toast global
- Dashboard creator : KPI count-up long sur connexion lente

Rapport : [`reports/UX_CERTIFICATION_REPORT.md`](./reports/UX_CERTIFICATION_REPORT.md)

---

## Phase H — Africa Mode

Profil détaillé : [`AFRICA_MODE.md`](./AFRICA_MODE.md)

**Flag :** `performance_africa_mode_enabled` (OFF)

Résumé cibles :

| Profil | TTFB page | Time to play | Images | Prefetch |
|---|---|---|---|---|
| 4G | ≤1.5s | ≤3s | quality 55 | ON |
| 3G | ≤3s | ≤6s | quality 45 | OFF |
| 2G | ≤5s | ≤10s | ultra économique | OFF |
| Instable | retry 1x | buffer visible | lazy only | OFF |

---

## Phase I — Dashboard Performance

| Dashboard | Pattern | Requêtes mount | Risque |
|---|---|---|---|
| **Public** `/listen` | RSC cached | 5 | Faible |
| **Artiste** `/creator` | 1 agrégé + 13 widgets | 1 serveur | Moyen (client mount) |
| **Analytics** `/creator/analytics` | 7 parallèles | 7 | **Haut** |
| **Admin** `/admin` | RSC KPIs | 1 | Faible |
| **Admin centres** | Client islands | 1–3 chacun | Moyen |

**Priorité optimisation :** `/creator/analytics` → lazy load charts + réduire parallélisme initial.

---

## Phase J — Search Performance

| Critère | État | Cible |
|---|---|---|
| Debounce | ✅ 300ms | Maintenir |
| Min chars | ✅ 2 | Maintenir |
| Cache résultats | 🟡 flag `performance_search_cache_enabled` (OFF) — TTL 5 min implémenté | TTL 5 min flag |
| Stale request guard | ✅ `searchIdRef` | Maintenir |
| `SearchResults` SSR | ❌ `dynamic ssr:false` | Acceptable MVP |
| Réponse perçue | 🔵 à mesurer | **<500ms** après debounce |

---

## Phase K — Audio Experience

| Action | Implémentation | Statut |
|---|---|---|
| Démarrage | `startStream` → signed URL → `audio.play` | ✅ Legacy |
| Pause / resume | `playerContext` HTMLAudioElement | ✅ |
| Seek | `PlayerProgressBar` | ✅ |
| Volume | Player controls | ✅ |
| Queue next/prev | `usePlayer` auto-advance | ✅ |
| Buffering | `waiting` event + badge qualité | 🟡 |
| Recovery réseau | 1 retry URL expiry | ✅ |
| Bridge observability | `[StreamingBridge]` dev logs | ✅ étape 1 |

**Benchmark cible :** comparable Spotify/Apple Music sur time-to-play 4G — **≤3s**.

---

## Phase L — Feature Flags ✅

8 flags `performance_*` créés — **tous OFF** par défaut.

Migration : `supabase/migrations/20260626120000_performance_ux_feature_flags.sql`

| Flag | Phase |
|---|---|
| `performance_lazy_loading_enabled` | E |
| `performance_bundle_split_enabled` | E |
| `performance_prefetch_enabled` | F |
| `performance_streaming_ssr_enabled` | F |
| `performance_search_cache_enabled` | J |
| `performance_skeleton_extended_enabled` | G |
| `performance_animation_cdc_compliant_enabled` | G |
| `performance_africa_mode_enabled` | H |

Toggle : `/admin/flags` · rollback <30s.

---

## Phase M — Tests

**Statut :** 🔵 infrastructure probe créée · Lighthouse CI en attente

| Suite | Script | Statut |
|---|---|---|
| Discovery automatique | `pnpm probe:performance-discovery` | ✅ |
| Gate certification | `pnpm probe:performance` | ✅ |
| Lighthouse CI | — | ❌ à créer |
| Bundle size gate | — | ❌ à créer |
| Navigation E2E perf | Playwright + throttling | ❌ à créer |
| Mobile perf | Expo + web mobile | ❌ post-web |

**Règle :** toute optimisation = mesure avant/après documentée dans rapports.

---

## Phase N — Documentation ✅

| Document | Statut |
|---|---|
| `docs/performance/PERFORMANCE_UX_CERTIFICATION.md` | ✅ ce fichier |
| `docs/performance/LIVE_CONTROL_PERFORMANCE.md` | ✅ |
| `docs/performance/reports/*` | ✅ baseline |
| `docs/EXECUTION_LOG.md` | ✅ entrée ajoutée |
| `docs/README.md` | ✅ index mis à jour |
| `MASTER_PLAN.md` | ⛔ archivé — ne pas mettre à jour |

---

## Auto-review (26 juin 2026)

| Critère | Statut |
|---|---|
| Aucune régression code engines | ✅ discovery only |
| Aucun écran cassé | ✅ |
| Architecture freeze respecté | ✅ |
| Feature flags OFF prod | ✅ migration |
| pnpm typecheck / lint / build | ✅ (inchangé) |
| Mesures CWV officielles | ❌ |
| LIVE CONTROL Rémy | ❌ |

---

## LIVE CONTROL

Checklist : [`LIVE_CONTROL_PERFORMANCE.md`](./LIVE_CONTROL_PERFORMANCE.md)

```
🟢 LIVE CONTROL PERFORMANCE PRÊT
```

En attente validation Rémy Goumou. **Aucune certification avant signature.**

---

## Critères de certification

Le programme est **certifié** uniquement si :

- [ ] Core Web Vitals conformes (pages P0)
- [ ] Bundle First Load JS P0 ≤ 230 kB
- [ ] Time to play ≤3s (4G simulée)
- [ ] UX fluidifiée (animations CDC ≤300ms app)
- [ ] Africa Mode validé 3G/instable
- [ ] Aucun impact fonctionnel (régression tests 130/130 + 262 API)
- [ ] `pnpm typecheck` · `lint` · `build` PASS
- [ ] LIVE CONTROL signé Rémy

---

## Décision finale

```
❌ PERFORMANCE & UX CERTIFICATION PROGRAM REFUSÉ
```

**Motif :** programme et discovery livrés ; mesures Lighthouse/CWV, optimisations et LIVE CONTROL non exécutés.

**Prochaine étape :**

1. Rémy exécute LIVE CONTROL PERFORMANCE
2. Mesures Lighthouse pages P0 (desktop + mobile throttled)
3. Activer optimisations une par une via flags `performance_*`
4. Re-mesurer → mettre à jour rapports → décision finale

---

*Aligné CDC V9.0 (animations ≤300ms, fond #0D0D0D, Montserrat) · Real Listen V7.2 préservé.*
