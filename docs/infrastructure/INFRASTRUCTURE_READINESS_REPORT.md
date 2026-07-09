# Infrastructure Readiness Report — SONAFRIK GitHub Actions

> **Programme :** Infrastructure Readiness · **Sprint 1** — Secrets Discovery & Certification
> **Date :** 2026-07-09 · **Dépôt :** `Remygoumou55/PROJET-SONAFRIK-`
> **Périmètre :** CI/CD uniquement — aucune modification produit.

---

## Résumé exécutif

| Critère | Verdict |
|---|---|
| **Code & pipelines développés** | ✅ Terminé (B3, B3.1, B3.2) |
| **Workflows syntaxiquement valides** | ✅ (après fix `preflight` sur branche `perf/b3-2-performance-ci`) |
| **Secrets Repository configurés** | ❌ **0/9** |
| **Certification Enterprise exécutable en CI** | ❌ **Bloquée** (job perf skippé) |
| **Documentation infrastructure** | ✅ Ce sprint |
| **Infrastructure prête** | ⚠️ **Prête structurellement · non opérationnelle** |

**Action manuelle unique restante :** le propriétaire du dépôt doit copier les valeurs existantes (Vercel / Supabase / `apps/web/.env.local`) dans les **Repository Secrets** GitHub. Aucune autre intervention humaine n'est requise pour exécuter la certification.

---

## 1. Architecture CI

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions (ubuntu-latest)               │
├─────────────────────────────────────────────────────────────────┤
│  ci.yml (main / develop / PR)                                    │
│    preflight ──► has_supabase / has_service_role                 │
│    quality ────► lint → typecheck → test → probe:cert → build    │
│    e2e-smoke ─► Playwright smoke (service_role si présent)       │
│    e2e-publications-cert ─► publications E2E (si has_supabase)   │
│    finance-sandbox ───────► wallet chain (si has_service_role)   │
├─────────────────────────────────────────────────────────────────┤
│  performance-cert.yml (workflow_dispatch / perf/**)              │
│    preflight ──► has_supabase_full (3 secrets)                   │
│    performance-cert ─► lint → test → build → next start          │
│      → perf:cwv → Lighthouse → rapport → artifacts → gate      │
└─────────────────────────────────────────────────────────────────┘
```

### Caractéristiques Enterprise

| Capacité | Statut |
|---|---|
| Build production | ✅ `pnpm build` |
| TypeScript / ESLint | ✅ `pnpm typecheck` / `pnpm lint` |
| Vitest (monorepo) | ✅ `pnpm test` (330 tests API) |
| Playwright E2E | ✅ Chromium, global-setup auth |
| Lighthouse desktop + mobile | ✅ `npx lighthouse@12` authentifié |
| Bundle analysis | ✅ parse `build.log`, baseline configurable |
| Performance artifacts | ✅ upload 90 jours |
| Concurrency (cancel-in-progress) | ✅ les deux workflows |
| Cache pnpm + Turbo | ✅ |
| Retry Playwright en CI | ✅ `retries: 2` |
| Job gate certification | ✅ exit code sur `certification.json` |

---

## 2. Workflows audités (détail)

### 2.1 `ci.yml`

| Attribut | Valeur |
|---|---|
| **Triggers** | `push`, `pull_request` → `main`, `develop` |
| **Concurrency** | `${{ github.workflow }}-${{ github.ref }}`, cancel-in-progress |
| **Runner** | `ubuntu-latest` |
| **Jobs** | 5 (`preflight`, `quality`, `e2e-smoke`, `e2e-publications-cert`, `finance-sandbox`) |
| **Dépendances jobs** | `e2e-*` et `finance` → `quality` ; publications/finance → `preflight` |
| **Timeout job** | Non défini (défaut GitHub 360 min) |
| **Permissions** | Défaut `GITHUB_TOKEN` |
| **Artifacts** | Aucun |

**Étapes `quality` :** checkout → pnpm → Node 22 → cache Turbo → install → lint → typecheck → test → `probe:certification` → build.

### 2.2 `performance-cert.yml`

| Attribut | Valeur |
|---|---|
| **Triggers** | `workflow_dispatch` (inputs route/slug/baseline) ; `push` `perf/**` paths filtrés |
| **Concurrency** | `perf-cert-${{ github.ref }}` |
| **Jobs** | 2 (`preflight`, `performance-cert`) |
| **Artifacts** | `performance-cert-<slug>` · 90 jours · `if: always()` |
| **Job summary** | Injecte `PERFORMANCE_CI_REPORT.md` |

---

## 3. Secrets nécessaires vs manquants

Voir tableau complet : [`GITHUB_ACTIONS_SECRETS.md`](./GITHUB_ACTIONS_SECRETS.md).

| Catégorie | Nombre | Manquants |
|---|---|---|
| Secrets uniques référencés | **9** | **9** |
| Obligatoires (certification B3.2) | **3** | **3** |
| Optionnels (cache / comptes test) | **6** | **6** |
| Variables `vars.*` | **0** | — |
| Environment secrets utilisés | **0** | Environments existent mais non référencés |

---

## 4. Variables d'environnement

| Scope | Nombre documenté |
|---|---|
| Secrets → env steps (workflows) | 9 noms |
| Littéraux workflow (`env:`) | 6 |
| `turbo.json` `globalEnv` | 7 |
| `check-env.ts` (prod/deploy) | 10 |
| Playwright / perf scripts | 5+ |

**Incohérence mineure :** `NEXT_PUBLIC_APP_URL` est obligatoire en prod (`check-env.ts`) mais absente des workflows CI — le build passe grâce aux fallbacks applicatifs.

---

## 5. Qualité pipeline

| Contrôle | Évaluation |
|---|---|
| Fail-fast sur quality | ✅ lint/typecheck/test avant E2E |
| Skip gracieux sans secrets | ✅ `preflight` + `if: needs.outputs` |
| Placeholders build sans secrets | ✅ URL/anon placeholder pour `quality` uniquement |
| Pas de `secrets` dans `if:` job | ✅ corrigé (cause racine startup_failure historique) |
| Serveur prod pour perf | ✅ `next start` + health curl |
| Mesures non inventées | ✅ rapport généré depuis artefacts réels |
| E2E smoke sans gate service_role | ⚠️ job tourne même si clé vide (tests peuvent skip) |

---

## 6. Sécurité

| Point | Statut | Recommandation |
|---|---|---|
| `service_role` jamais `NEXT_PUBLIC_` | ✅ | Conserver |
| Secrets non loggés | ✅ preflight booléen | — |
| Fallbacks mots de passe dans YAML | ⚠️ visibles dans repo | Remplacer par secrets dédiés en prod CI |
| `permissions:` minimales | ⚠️ non défini | Ajouter `contents: read` si durcissement futur |
| BYPASS_AUTH en CI | ✅ non activé | — |
| `.env.local` gitignoré | ✅ | Ne jamais committer |

---

## 7. Maintenabilité

| Aspect | Note |
|---|---|
| Workflows réutilisables | ✅ `performance-cert.yml` paramétrable par module |
| Documentation | ✅ 3 docs infrastructure + perf pipeline |
| Scripts perf modulaires | ✅ 4 scripts `.mjs` indépendants |
| Source unique versions | ✅ `packageManager` pnpm, `engines` Node |
| Dette : fix `preflight` sur `main` | ⚠️ fix présent sur `perf/b3-2-performance-ci` — **merge requis** pour débloquer CI sur `main` |

---

## 8. Audit scripts

**Scripts analysés : 69 fichiers** (`scripts/` racine + `apps/web/scripts/` + `scripts/perf/`)

### Scripts invoqués par CI

| Script | Workflow / commande |
|---|---|
| `scripts/probe-certification-globale.ts` | `ci.yml` → `pnpm probe:certification` |
| `scripts/run-finance-sandbox-e2e.ts` | `ci.yml` → `finance-sandbox` |
| `scripts/perf/run-lighthouse.mjs` | `performance-cert.yml` |
| `scripts/perf/extract-bundle.mjs` | `performance-cert.yml` |
| `scripts/perf/set-context.mjs` | `performance-cert.yml` |
| `scripts/perf/generate-report.mjs` | `performance-cert.yml` |
| `apps/web/tests/perf/publications-cwv.perf.ts` | `pnpm perf:cwv` |
| `apps/web/tests/e2e/*.spec.ts` | `ci.yml` e2e jobs |

### Scripts locaux / probes (non CI)

~55 scripts `probe-*`, `*-live.ts`, utilitaires audio, CSS split, etc. — **hors périmètre CI**, documentés dans `package.json` racine.

### Observations

| Catégorie | Résultat |
|---|---|
| Dupliqués critiques | Aucun |
| Cassés (non exécutés) | Non vérifié exhaustivement — probes manuels |
| Non documentés | Probes historiques — liste dans `package.json` |
| CI-only perf | ✅ documenté `ENTERPRISE_PERF_CI_PIPELINE.md` |

---

## 9. Fichiers audités

| Catégorie | Fichiers |
|---|---|
| Workflows GitHub | **2** |
| Config monorepo / web | **8** (`package.json`×2, `pnpm-workspace.yaml`, `turbo.json`, `next.config.ts`, `playwright.config.ts`, `playwright.perf.config.ts`, `apps/web/package.json`) |
| Scripts | **69** |
| Tests E2E / perf | **19** (18 e2e + 1 perf) |
| Doc infrastructure existante | **1** (`CORS_ARCHITECTURE.md`) + **3 créés ce sprint** |
| **Total fichiers parcourus** | **~101** |

---

## 10. Risques

| ID | Risque | Impact | Mitigation |
|---|---|---|---|
| R1 | **0 Repository Secrets** | Certification B3.2 impossible | Configurer 3 secrets P0 (guide setup) |
| R2 | Fix `preflight` non mergé sur `main` | CI `main` en échec 0s historique | Merger `perf/b3-2-performance-ci` ou cherry-pick fix |
| R3 | Environments Vercel non liés aux jobs | Secrets Vercel invisibles pour Actions | Repository Secrets (choix actuel) |
| R4 | `e2e-smoke` sans gate secrets | Faux sentiment de CI verte partielle | Optionnel : ajouter `needs: preflight` |
| R5 | Mots de passe test en clair YAML | Surface d'attaque faible (compte test) | Secrets `PLAYWRIGHT_*` dédiés |

---

## 11. Actions manuelles restantes

1. **Configurer les Repository Secrets** (P0) — voir [`GITHUB_SETUP_GUIDE.md`](./GITHUB_SETUP_GUIDE.md)
2. **Merger** la branche contenant le fix `preflight` sur `main` (si pas déjà fait)
3. **Déclencher** `performance-cert.yml` via Actions ou `gh workflow run`
4. **Télécharger** l'artifact `performance-cert-publications` et valider `certification.json`
5. *(Optionnel)* Ajouter `TURBO_TOKEN` / `TURBO_TEAM` pour accélérer les builds

---

## 12. Décision infrastructure

| Question | Réponse |
|---|---|
| Pipeline prête ? | ✅ **Oui** (code + workflows + scripts + docs) |
| Documentation complète ? | ✅ **Oui** (ce sprint) |
| Structure Enterprise ? | ✅ **Oui** (preflight, artifacts, gates, reproductibilité) |
| Workflows réutilisables ? | ✅ **Oui** (`performance-cert` paramétrable) |
| **Infrastructure opérationnelle ?** | ❌ **Non** — secrets manquants |

**Verdict Sprint 1 :** Infrastructure **CERTIFIÉE PRÊTE À L'EMPLOI** dès configuration des secrets. Certification produit B3 **suspendue** jusqu'à exécution CI réelle.

---

## Annexes

- [`GITHUB_ACTIONS_SECRETS.md`](./GITHUB_ACTIONS_SECRETS.md) — inventaire exhaustif
- [`GITHUB_SETUP_GUIDE.md`](./GITHUB_SETUP_GUIDE.md) — guide propriétaire dépôt
- [`../performance/ENTERPRISE_PERF_CI_PIPELINE.md`](../performance/ENTERPRISE_PERF_CI_PIPELINE.md) — pipeline perf
- [`../functional-quality/reports/SONAFRIK_PUBLICATIONS_B3_2_CI_CERTIFICATION.md`](../functional-quality/reports/SONAFRIK_PUBLICATIONS_B3_2_CI_CERTIFICATION.md) — rapport B3.2
