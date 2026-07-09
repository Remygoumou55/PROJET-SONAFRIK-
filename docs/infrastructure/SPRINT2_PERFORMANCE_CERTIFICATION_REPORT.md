# Sprint 2 — GitHub Secrets Configuration & Performance Certification

> **Programme :** Infrastructure Readiness · **Date :** 2026-07-09
> **Run CI de référence :** `29002772328` · Branche : `perf/b3-2-performance-ci`
> **Règle respectée :** aucune valeur secrète enregistrée dans ce document.

---

## Résumé exécutif

| Élément | Statut |
|---|---|
| GitHub CLI installé & authentifié | ✅ `gh 2.89.0` · compte `Remygoumou55` |
| Secrets P0 configurés (Repository) | ✅ **3/3** |
| Infrastructure GitHub opérationnelle | ✅ **Oui** |
| Pipeline `performance-cert.yml` exécutée bout-en-bout | ✅ Run `29002772328` |
| Artifacts CI téléchargés & analysés | ✅ 12 fichiers |
| **B3 — Enterprise Performance CERTIFIED** | ❌ **NON** (seuils non atteints) |

**Verdict infrastructure :** débloquée et fonctionnelle.  
**Verdict produit B3.2 :** certification **suspendue** — métriques Lighthouse / CWV insuffisantes (preuves CI réelles ci-dessous).

---

## 1. Secrets configurés

Source locale scannée : `apps/web/.env.local` (clés détectées, **valeurs jamais affichées**).

| Secret | Local | GitHub Repository | Méthode |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ présent | ✅ configuré | `gh secret set` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ présent | ✅ configuré | `gh secret set` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ présent | ✅ configuré | `gh secret set` |
| `PLAYWRIGHT_TEST_EMAIL` | ❌ absent | ❌ (défaut workflow) | `s13b-playwright-listener@sonafrik.test` |
| `PLAYWRIGHT_TEST_PASSWORD` | ❌ absent | ❌ (défaut workflow) | défaut workflow |

`gh secret list` (noms uniquement) :

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Secrets optionnels non créés (non requis pour exécution) : `TURBO_*`, `SANDBOX_FINANCE_*`.

---

## 2. Workflows exécutés

| Run ID | Déclencheur | Résultat | Durée | Cause |
|---|---|---|---|---|
| `29002039029` | `workflow_dispatch` | ❌ failure | 8m49s | `perf:cwv` → **No tests found** (`*.perf.ts` non matché par Playwright) |
| `29002772328` | `push` fix `testMatch` | ❌ failure (gate) | ~10m | Pipeline complète · **Certification gate** = métriques < seuils |

> **Note branche :** `performance-cert.yml` **n'existe pas sur `main`** (uniquement sur `perf/b3-2-performance-ci`). Exécution sur cette branche, pas `--ref main`.

### Correctif infra appliqué (bug critique)

Fichier : `apps/web/playwright.perf.config.ts` — ajout `testMatch: "**/*.perf.ts"`.  
Commit : `84b5cd7` · **hors périmètre produit** (config CI uniquement).

---

## 3. Résultats pipeline (run `29002772328`)

| Étape | Statut |
|---|---|
| Preflight (secrets) | ✅ |
| Lint | ✅ |
| Typecheck | ✅ |
| Unit tests | ✅ |
| Production build | ✅ |
| Bundle analysis | ✅ |
| `next start` + health check | ✅ |
| Core Web Vitals (authentifié) | ✅ capturé |
| Lighthouse desktop + mobile | ✅ capturé |
| Rapport + artifacts | ✅ |
| **Certification gate** | ❌ `certified: false` |

---

## 4. Lighthouse (authentifié, CI Linux)

Lighthouse **12.8.2** · URL : `http://localhost:3000/creator/catalog/tracks`

| Form factor | Perf | A11y | BP | SEO | LCP | TBT | CLS | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Desktop** | **97** ✅ | **91** ❌ | **100** ✅ | **91** ❌ | 778 ms | 58 ms | ~0 | **FAIL** |
| **Mobile** | **88** ❌ | **91** ❌ | **93** ❌ | **91** ❌ | 3573 ms | 80 ms | 0 | **FAIL** |

Seuils Enterprise : Perf ≥ 95 · A11y ≥ 95 · BP = 100 · SEO ≥ 95

### Écarts bloquants Lighthouse

| Métrique | Desktop | Mobile | Seuil |
|---|---|---|---|
| Performance | 97 ✅ | **88** ❌ | ≥ 95 |
| Accessibility | **91** ❌ | **91** ❌ | ≥ 95 |
| Best Practices | 100 ✅ | **93** ❌ | = 100 |
| SEO | **91** ❌ | **91** ❌ | ≥ 95 |

---

## 5. Core Web Vitals (Playwright natif, authentifié)

| Métrique | Mesure CI | Seuil vert | Statut |
|---|---|---|---|
| LCP | 2040 ms | ≤ 2500 ms | ✅ |
| CLS | 0 | ≤ 0.1 | ✅ |
| INP (proxy lab) | 32 ms | ≤ 200 ms | ✅ |
| **FCP** | **2040 ms** | ≤ 1800 ms | ❌ |
| TTFB | 388 ms | ≤ 800 ms | ✅ |

### Runtime & réseau

- Long tasks : **0**
- DOMContentLoaded : 4051 ms · load : 4079 ms
- Requêtes Supabase (chargement) : **14**
- Lignes catalogue rendues : **31**

---

## 6. Bundle

| Métrique | Valeur CI | Baseline B3 | Δ | Statut |
|---|---|---|---|---|
| Route size | 6.87 kB | — | — | — |
| First Load JS | **268 kB** | 268 kB | **+0 kB** | ✅ PASS |

---

## 7. Score & décision finale

Source : `certification.json` (artifact CI, mesures réelles)

| Champ | Valeur |
|---|---|
| `certified` | **`false`** |
| Score indicatif | **3/10** |
| Axes PASS | Bundle, Build & Tests |
| Axes FAIL | Lighthouse desktop, Lighthouse mobile, Core Web Vitals (FCP) |

### Décision officielle

> **B3 — Enterprise Performance : ⛔ NON CERTIFIÉ**
>
> L'infrastructure GitHub Actions est **opérationnelle** et la pipeline a produit des **preuves techniques complètes** en CI Linux.
> La certification Enterprise ne peut pas être prononcée car les seuils Lighthouse (mobile/desktop) et FCP CWV ne sont pas atteints.
>
> **Ce n'est plus un blocage infrastructure — c'est un blocage performance produit** (hors périmètre Sprint 2).

---

## 8. Éléments bloquants restants (pour certification B3)

| Priorité | Blocage | Mesure CI | Cible |
|---|---|---|---|
| P0 | Lighthouse mobile Performance | 88 | ≥ 95 |
| P0 | Lighthouse mobile Best Practices | 93 | 100 |
| P1 | Lighthouse A11y (desktop + mobile) | 91 | ≥ 95 |
| P1 | Lighthouse SEO (desktop + mobile) | 91 | ≥ 95 |
| P1 | CWV FCP (mesure Playwright) | 2040 ms | ≤ 1800 ms |
| P2 | Merger `perf/b3-2-performance-ci` → `main` | — | CI perf sur branche principale |

Les optimisations ci-dessus relèvent d'une **phase produit/perf** (B3.x ou post-Sprint 2), pas de l'infrastructure.

---

## 9. Actions manuelles restantes

| Action | Responsable | Statut |
|---|---|---|
| Copier secrets P0 dans GitHub | Propriétaire dépôt | ✅ **Fait** |
| Exécuter `performance-cert.yml` | CI | ✅ **Fait** |
| Merger branche perf sur `main` | DevOps | ⏳ Recommandé |
| Atteindre seuils Lighthouse/CWV | Équipe produit | ⏳ Bloquant certification |
| *(Optionnel)* Secrets `PLAYWRIGHT_*` dédiés | Propriétaire | Non requis (défauts OK) |

---

## 10. Artifacts CI

Run `29002772328` — artifact `performance-cert-publications` (90 j retention GitHub) :

- `certification.json`
- `cwv-publications.json`
- `lighthouse-summary-publications.json`
- `lighthouse-publications-{desktop,mobile}.report.{html,json}`
- `PERFORMANCE_CI_REPORT.md`
- `build.log`, `context.json`, `server.log`

Téléchargement local (analyse) : `apps/web/perf-artifacts-ci/` (**git-ignoré, ne pas committer** — contient `auth-headers.json`).

---

## Références

- [`GITHUB_SETUP_GUIDE.md`](./GITHUB_SETUP_GUIDE.md)
- [`GITHUB_ACTIONS_SECRETS.md`](./GITHUB_ACTIONS_SECRETS.md)
- [`INFRASTRUCTURE_READINESS_REPORT.md`](./INFRASTRUCTURE_READINESS_REPORT.md)
- [`../performance/ENTERPRISE_PERF_CI_PIPELINE.md`](../performance/ENTERPRISE_PERF_CI_PIPELINE.md)
