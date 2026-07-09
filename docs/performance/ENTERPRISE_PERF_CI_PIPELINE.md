# Enterprise Performance CI Pipeline — Référence officielle SONAFRIK

> Introduit par **B3.2** (Mes publications). Cette pipeline est le **standard officiel**
> de certification de performance de SONAFRIK. Tout futur module (Homepage Auditeur,
> Dashboard Artiste, Wallet, Royalties, Marketplace, Beat Store, Creator Economy,
> Super Admin) doit être certifié via cette pipeline.

## 1. Objectif

Produire, dans un environnement **CI Linux propre et reproductible**, un **dossier de
preuves techniques** démontrant qu'un module atteint le niveau de performance Enterprise :

```
Build → next start (production) → Auth Perf Tests → Lighthouse → Core Web Vitals
      → Bundle Analysis → Rapport → Artifacts → Décision de certification
```

Aucune mesure n'est estimée. La décision de certification repose **exclusivement** sur des
preuves générées par la CI.

## 2. Workflow

Fichier : `.github/workflows/performance-cert.yml` (job `performance-cert`, `ubuntu-latest`, Node 22).

Déclencheurs :
- `workflow_dispatch` (manuel) — inputs `route`, `slug`, `baseline_first_load_kb` ;
- `push` sur les branches `perf/**` touchant la pipeline.

Le job ne s'exécute que si les secrets Supabase sont présents (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), car la route certifiée est
authentifiée et le compte de test est provisionné via le global-setup Playwright.

### Quality Gates

| QG | Étape workflow | Preuve produite |
|---|---|---|
| QG1 CI Environment | checkout, pnpm, Node 22, `install --frozen-lockfile`, Playwright chromium | environnement déterministe |
| QG2 Production Build | `lint`, `typecheck`, `test`, `build` (log capturé) | `build.log` |
| QG3 Production Runtime | `next start` + health check (curl loop) | `server.log` |
| QG4 Authenticated Lighthouse | `run-lighthouse.mjs` desktop + mobile, cookies d'auth | `lighthouse-<slug>-{desktop,mobile}.report.{html,json}`, `lighthouse-summary-<slug>.json` |
| QG5 Core Web Vitals | test Playwright `publications-cwv.perf.ts` (PerformanceObserver natif) | `cwv-<slug>.json` |
| QG6 Bundle Analysis | `extract-bundle.mjs` (parse build.log, baseline B3) | `context.json` |
| QG7 Runtime Metrics | long tasks + timings dans le test perf | `cwv-<slug>.json` (bloc `runtime`) |
| QG8 Network Metrics | comptage requêtes Supabase dans le test perf | `cwv-<slug>.json` (bloc `network`) |
| QG9 Artifacts | `upload-artifact` (retention 90 j, `if: always()`) | archive `performance-cert-<slug>` |
| QG10 Certification Decision | `generate-report.mjs` + gate | `PERFORMANCE_CI_REPORT.md`, `certification.json` |

### Seuils Enterprise (bloquants)

| Métrique | Seuil |
|---|---|
| Lighthouse Performance (desktop & mobile) | ≥ 95 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse Best Practices | = 100 |
| Lighthouse SEO | ≥ 95 |
| LCP | ≤ 2500 ms |
| CLS | ≤ 0.1 |
| INP (proxy lab) | ≤ 200 ms |
| FCP | ≤ 1800 ms |
| TTFB | ≤ 800 ms |
| Bundle First Load JS | ≤ baseline + 5 kB (pas de régression) |

> **INP** est une métrique **terrain**. En laboratoire, la pipeline rapporte un **proxy**
> (latence d'interaction maximale mesurée pendant filtres/recherche/pagination) et s'appuie
> sur le **TBT** de Lighthouse comme proxy officiel du blocage du thread principal.

## 3. Authentification (route protégée)

La pipeline réutilise l'infrastructure d'auth des tests e2e :
1. `tests/e2e/global-setup.ts` provisionne le compte de test et pré-chauffe la route ;
2. le test perf (`authenticateArtist`) injecte les cookies Supabase dans le contexte ;
3. le test dump les cookies dans `auth-headers.json` (`{ "Cookie": "..." }`) ;
4. `run-lighthouse.mjs` passe ce fichier via `--extra-headers` pour auditer la route
   authentifiée avec les données réelles.

## 4. Reproduction locale

> Recommandé sur Linux/macOS. Sur Windows, le serveur de dev peut corrompre le cache
> `.next` — utiliser **`next start`** (build de production) pour des mesures stables.

```bash
# 0. Variables (dans apps/web/.env.local ou l'environnement)
#    NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
#    PLAYWRIGHT_TEST_EMAIL, PLAYWRIGHT_TEST_PASSWORD

pnpm install --frozen-lockfile
pnpm --filter @sonafrik/web exec playwright install chromium

# 1. Build production (log capturé)
mkdir -p apps/web/perf-artifacts
pnpm --filter @sonafrik/web build 2>&1 | tee apps/web/perf-artifacts/build.log

# 2. Bundle
node scripts/perf/extract-bundle.mjs --log apps/web/perf-artifacts/build.log \
  --out apps/web/perf-artifacts --route /creator/catalog/tracks --baseline 268
node scripts/perf/set-context.mjs --out apps/web/perf-artifacts buildTestsPassed=true

# 3. Serveur production
pnpm --filter @sonafrik/web start &   # http://localhost:3000

# 4. Core Web Vitals + cookies d'auth
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm perf:cwv

# 5. Lighthouse authentifié
node scripts/perf/run-lighthouse.mjs \
  --url http://localhost:3000/creator/catalog/tracks \
  --out apps/web/perf-artifacts \
  --headers apps/web/perf-artifacts/auth-headers.json \
  --form-factor both --slug publications

# 6. Rapport + décision
node scripts/perf/generate-report.mjs --dir apps/web/perf-artifacts --slug publications
```

Artefacts produits dans `apps/web/perf-artifacts/` (git-ignoré).

## 5. Réutilisation pour un autre module

1. Écrire un test perf calqué sur `tests/perf/publications-cwv.perf.ts` pour la route cible
   (ou paramétrer via variable d'environnement) et dumper `auth-headers.json`.
2. Lancer le workflow via `workflow_dispatch` en renseignant `route`, `slug` et
   `baseline_first_load_kb` (First Load JS de référence du module).
3. La décision de certification et le score sont produits automatiquement à partir des
   preuves CI.

## 6. FREEZE

Une fois un module certifié, la pipeline est **figée** pour ce module. Toute évolution
future doit **préserver la compatibilité et les seuils**. Un abaissement de seuil ou une
modification de la rubrique de score nécessite un ADR explicite.
