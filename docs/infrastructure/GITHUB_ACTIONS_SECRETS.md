# GitHub Actions — Inventaire des secrets et variables

> **Sprint 1 — Infrastructure Readiness** · Audit automatique du dépôt `Remygoumou55/PROJET-SONAFRIK-`
> Dernière vérification : **2026-07-09** · Méthode : scan `.github/workflows/`, configs, scripts.

**Règle :** ce document ne contient **aucune valeur secrète**. Les sources indiquent où les récupérer.

---

## 1. État actuel du dépôt (mesuré)

| Ressource | Quantité | Statut |
|---|---|---|
| Repository Secrets | **0** | `gh secret list` → vide |
| Repository Variables | **0** | `gh variable list` → vide |
| Environments | 2 (`Preview`, `Production`) | Créés par intégrations Vercel/Supabase |
| Environment Secrets | **0** (non listables / absents) | Jobs CI **n'utilisent pas** `environment:` |

**Conséquence :** les jobs conditionnels (`preflight`) détectent l'absence de secrets et **skippent** les pipelines authentifiées (E2E publications, finance sandbox, performance certification).

---

## 2. Workflows audités

| Workflow | Fichier | Déclencheurs | Jobs |
|---|---|---|---|
| **CI** | `.github/workflows/ci.yml` | `push`/`pull_request` sur `main`, `develop` | `preflight`, `quality`, `e2e-smoke`, `e2e-publications-cert`, `finance-sandbox` |
| **Performance Certification** | `.github/workflows/performance-cert.yml` | `workflow_dispatch` ; `push` sur `perf/**` (paths filtrés) | `preflight`, `performance-cert` |

Aucun autre workflow GitHub Actions n'existe dans le dépôt.

---

## 3. Secrets Repository — tableau complet

| Secret | Description | Obligatoire | Workflows | Jobs / étapes | Fichiers concernés | Valeur attendue (format) | Source de la valeur |
|---|---|:---:|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (API + Auth) | **Oui** (E2E, perf, finance) ; optionnel build (placeholder) | `ci.yml`, `performance-cert.yml` | `preflight`, `quality`, `e2e-smoke`, `e2e-publications-cert`, `finance-sandbox`, `performance-cert` | `turbo.json` (`globalEnv`), `apps/web/src/lib/supabase/*`, `apps/web/tests/e2e/global-setup.ts`, `scripts/check-env.ts` | `https://<project-ref>.supabase.co` | **Supabase** → Project Settings → API → Project URL · **Vercel** → Environment Variables |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon (safe côté client) | **Oui** (E2E, perf, finance) ; optionnel build (placeholder) | idem | idem | idem | JWT `eyJ…` (clé `anon` `public`) | **Supabase** → API → `anon` `public` · **Vercel** |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (bypass RLS — **jamais côté client**) | **Oui** pour tout test authentifié / admin E2E | idem | `preflight`, `e2e-smoke`, `e2e-publications-cert`, `finance-sandbox`, `performance-cert` | `apps/web/tests/e2e/global-setup.ts`, `scripts/run-finance-sandbox-e2e.ts`, `packages/api` (serveur) | JWT `eyJ…` (rôle `service_role`) | **Supabase** → API → `service_role` (**secret**) · **Vercel** (server-only, pas `NEXT_PUBLIC_`) |
| `TURBO_TOKEN` | Token cache distant Turborepo (Vercel Remote Cache) | Non | `ci.yml`, `performance-cert.yml` | `env` global workflow | `turbo.json`, commentaire `ci.yml` L16-18 | Token Vercel Turborepo | **Vercel** → Remote Caching · Dashboard équipe |
| `TURBO_TEAM` | Slug équipe Vercel pour remote cache | Non | idem | `env` global | idem | ex. `team_xxx` ou slug équipe | **Vercel** → Team settings |
| `PLAYWRIGHT_TEST_EMAIL` | Email compte test E2E (auditeur/artiste) | Non (fallback codé) | `ci.yml`, `performance-cert.yml` | `e2e-publications-cert`, `performance-cert` (CWV) | `apps/web/tests/e2e/global-setup.ts`, `publications-e2e-helpers.ts` | Email valide Supabase Auth | Compte dédié CI · défaut : `s13b-playwright-listener@sonafrik.test` |
| `PLAYWRIGHT_TEST_PASSWORD` | Mot de passe compte test E2E | Non (fallback codé) | idem | idem | idem | Mot de passe Auth | Défini à la création du compte · défaut workflow : `S13BCert2026!` |
| `SANDBOX_FINANCE_EMAIL` | Email artiste sandbox finance E2E | Non (fallback script) | `ci.yml` | `finance-sandbox` | `scripts/run-finance-sandbox-e2e.ts` L26-28 | Email artiste avec wallet | Défaut script : `s12b-artist-1-1782222972289@sonafrik.test` |
| `SANDBOX_FINANCE_PASSWORD` | Mot de passe artiste sandbox | Non (fallback script) | `ci.yml` | `finance-sandbox` | `scripts/run-finance-sandbox-e2e.ts` | Mot de passe Auth | Défaut script : `Sprint12BTest2026!` |

**Total secrets uniques référencés dans les workflows : 9**

### Secrets manquants (tous)

Les **9 secrets** ci-dessus sont **absents** au niveau Repository. Aucun n'est configuré.

| Priorité | Secrets à créer en premier |
|---|---|
| P0 — bloque certification B3.2 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| P1 — débloque E2E CI complet | idem (les 3 suffisent pour publications + perf) |
| P2 — finance sandbox CI | + `SANDBOX_FINANCE_EMAIL`, `SANDBOX_FINANCE_PASSWORD` (ou laisser défauts script) |
| P3 — cache CI plus rapide | `TURBO_TOKEN`, `TURBO_TEAM` |
| P4 — comptes test dédiés | `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD` (ou laisser défauts workflow) |

---

## 4. Variables Repository (`vars.*`)

**Aucune** variable `vars.*` n'est utilisée dans les workflows.

Les workflows utilisent des **littéraux** ou des **inputs `workflow_dispatch`** à la place :

| Nom | Type | Workflow | Valeur |
|---|---|---|---|
| `PERF_ROUTE` | `env` workflow | `performance-cert.yml` | input `route` ou `/creator/catalog/tracks` |
| `PERF_SLUG` | `env` workflow | `performance-cert.yml` | input `slug` ou `publications` |
| `PERF_BASELINE_KB` | `env` workflow | `performance-cert.yml` | input ou `268` |
| `ARTIFACT_DIR` | `env` workflow | `performance-cert.yml` | `apps/web/perf-artifacts` |
| `PUBLICATIONS_E2E_PAGE_SIZE` | `env` step | `ci.yml` | `"10"` |
| `PLAYWRIGHT_BASE_URL` | `env` step | `performance-cert.yml` | `http://localhost:3000` |

---

## 5. Variables d'environnement — hors secrets (référence)

### 5.1 Utilisées en CI (injectées ou littérales)

| Variable | Où | Rôle |
|---|---|---|
| `CI` | Playwright (`playwright.config.ts`) | `retries: 2`, reporter `github` |
| `NODE_ENV` | Turbo `globalEnv` | Invalidation cache build |
| `GITHUB_OUTPUT` / `GITHUB_ENV` | Steps shell | Outputs preflight, PID serveur |
| `LIGHTHOUSE_VERSION` | `scripts/perf/run-lighthouse.mjs` | Défaut `12` (npx) |
| `PLAYWRIGHT_SKIP_WEBSERVER` | `apps/web/package.json` `perf:cwv` | Pas de `pnpm dev` en perf CI |
| `ANALYZE` | `apps/web/next.config.ts` | Bundle analyzer local (`pnpm analyze`) |

### 5.2 Requises en production (Vercel) — **non injectées en CI**

Source : `scripts/check-env.ts`, `turbo.json` `globalEnv`

| Variable | Obligatoire prod | Utilisée en CI | Note |
|---|---|:---:|---|
| `NEXT_PUBLIC_APP_URL` | Oui | Non | Fallback code : `https://sonafrik.vercel.app` |
| `NEXT_PUBLIC_SENTRY_DSN` | Recommandée | Non | Sentry build sans DSN = monitoring désactivé |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | Non | Hors périmètre web CI |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | Non | idem |
| `ORANGE_MONEY_API_KEY` | Sandbox OK vide | Non | Edge functions paiements |
| `MTN_MOMO_SUBSCRIPTION_KEY` | Sandbox OK vide | Non | idem |
| `WAVE_API_KEY` | Sandbox OK vide | Non | idem |
| `SOUTRA_API_KEY` | Sandbox OK vide | Non | idem |

### 5.3 Locales / dev uniquement (jamais CI)

| Variable | Usage |
|---|---|
| `BYPASS_AUTH`, `NEXT_PUBLIC_BYPASS_AUTH` | Dev local — **bloqué si `VERCEL=1`** |
| `NEXT_PUBLIC_LOCAL_AUDIT_MODE`, `NEXT_PUBLIC_LOCAL_CONTROL_MODE` | Audit local |
| `LOCAL_CONTROL_MODE` | Dev |
| `VERCEL` | Détection prod Vercel (runtime) |
| `PUBLICATIONS_E2E_PAGE_SIZE` | Page size réduit en E2E (défaut prod : 50) |
| `PLAYWRIGHT_STRESS_DURATION_MS` | Long session stress local |

---

## 6. Comparaison secrets utilisés vs disponibles

| Secret | Référencé workflow | Disponible repo | Statut |
|---|:---:|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ❌ | **MANQUANT** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ❌ | **MANQUANT** |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ❌ | **MANQUANT** |
| `TURBO_TOKEN` | ✅ | ❌ | Manquant (optionnel) |
| `TURBO_TEAM` | ✅ | ❌ | Manquant (optionnel) |
| `PLAYWRIGHT_TEST_EMAIL` | ✅ | ❌ | Manquant (fallback workflow) |
| `PLAYWRIGHT_TEST_PASSWORD` | ✅ | ❌ | Manquant (fallback workflow) |
| `SANDBOX_FINANCE_EMAIL` | ✅ | ❌ | Manquant (fallback script) |
| `SANDBOX_FINANCE_PASSWORD` | ✅ | ❌ | Manquant (fallback script) |

### Anomalies détectées

| Type | Détail |
|---|---|
| **Secrets manquants** | 9/9 absents au niveau Repository |
| **Secrets inutilisés** | Aucun secret configuré → rien d'inutilisé |
| **Secrets dupliqués** | Aucun (noms uniques) |
| **Noms incohérents** | `NEXT_PUBLIC_*` utilisé comme secret Actions — **intentionnel** (valeurs identiques à Vercel, préfixe conservé pour compatibilité Next.js) |
| **Valeurs en clair dans YAML** | Fallbacks Playwright (`S13BCert2026!`) et placeholders build (`placeholder-anon-key-for-ci-build`) — **documentés, non secrets réels** |
| **Environments non branchés** | `Preview` / `Production` existent mais workflows n'ont pas `environment:` → secrets d'environnement Vercel **inaccessibles** aux jobs |

---

## 7. Matrice workflow × secrets

### `ci.yml`

| Job | Condition | Secrets requis |
|---|---|---|
| `preflight` | toujours | Lit les 3 Supabase (détection seulement) |
| `quality` | toujours | Supabase URL/anon **ou placeholders** pour build |
| `e2e-smoke` | `needs: quality` | `SUPABASE_SERVICE_ROLE_KEY` (pas de gate — peut être vide) |
| `e2e-publications-cert` | `has_supabase == true` | URL + anon + service_role (+ Playwright optionnels) |
| `finance-sandbox` | `has_service_role == true` | URL + anon + service_role + sandbox finance optionnels |

### `performance-cert.yml`

| Job | Condition | Secrets requis |
|---|---|---|
| `preflight` | toujours | URL + anon + service_role (tous les 3) |
| `performance-cert` | `has_supabase_full == true` | Les 3 Supabase + Playwright optionnels |

---

## 8. Permissions et token

| Élément | Valeur auditée |
|---|---|
| `permissions:` explicite | **Absent** (permissions par défaut du `GITHUB_TOKEN`) |
| `secrets` dans `if:` job | **Corrigé** — job `preflight` + `needs.outputs` (évite startup_failure) |
| Fuite de secrets dans logs | Preflight n'écrit que `true`/`false` dans `GITHUB_OUTPUT` |

---

## 9. Versions outillage CI (référence)

| Outil | Version | Source |
|---|---|---|
| Node.js | **22** | `ci.yml`, `performance-cert.yml`, `package.json` `engines` `>=22.13.0` |
| pnpm | **11.5.2** | `package.json` `packageManager` |
| Playwright | **^1.61.0** | `apps/web/package.json` devDependencies |
| Lighthouse | **12** (npx) | `scripts/perf/run-lighthouse.mjs` `LIGHTHOUSE_VERSION` |
| Next.js | **^15.3.3** | `apps/web/package.json` |
| Actions | checkout/setup-node/cache/upload-artifact **@v4**, pnpm **@v4** | workflows |

---

## 10. Références croisées

- Guide pas-à-pas : [`GITHUB_SETUP_GUIDE.md`](./GITHUB_SETUP_GUIDE.md)
- Rapport readiness : [`INFRASTRUCTURE_READINESS_REPORT.md`](./INFRASTRUCTURE_READINESS_REPORT.md)
- Pipeline perf : [`../performance/ENTERPRISE_PERF_CI_PIPELINE.md`](../performance/ENTERPRISE_PERF_CI_PIPELINE.md)
- Vérification locale env : `pnpm check-env` → `scripts/check-env.ts`
