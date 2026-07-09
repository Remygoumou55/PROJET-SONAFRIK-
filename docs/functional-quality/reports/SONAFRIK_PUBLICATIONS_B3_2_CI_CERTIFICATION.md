# SONAFRIK — Mes publications · B3.2 Enterprise Performance CI Certification

> Phase de **preuve**, pas de développement produit. Aucune feature, aucune modif UX/UI.
> Règle absolue respectée : **aucune mesure inventée, aucun score estimé.**

Date : 2026-07-09 · Branche : `perf/b3-2-performance-ci` · IA : Claude (Product Guardian)

---

## 1. Objet

Livrer une **Enterprise Performance CI Pipeline** entièrement automatisée et réutilisable,
puis capturer en CI Linux les preuves officielles (Lighthouse, Core Web Vitals, bundle,
runtime, network) permettant de clôturer B3 pour le module « Mes publications ».

---

## 2. Livrables (faits)

| # | Livrable | Fichier |
|---|---|---|
| 1 | Workflow CI Performance dédié | `.github/workflows/performance-cert.yml` |
| 2 | Runner Lighthouse desktop/mobile authentifié | `scripts/perf/run-lighthouse.mjs` |
| 3 | Capture Core Web Vitals + runtime + network | `apps/web/tests/perf/publications-cwv.perf.ts` + `apps/web/playwright.perf.config.ts` |
| 4 | Analyse bundle (parse build.log, baseline B3) | `scripts/perf/extract-bundle.mjs` |
| 5 | Injection contexte build/tests | `scripts/perf/set-context.mjs` |
| 6 | Rapport agrégé + décision de certification | `scripts/perf/generate-report.mjs` |
| 7 | Documentation d'exploitation + repro locale | `docs/performance/ENTERPRISE_PERF_CI_PIPELINE.md` |
| 8 | Scripts npm | `perf:cwv`, `perf:lighthouse`, `perf:bundle`, `perf:report` |

La pipeline enchaîne : Build → `next start` → tests perf authentifiés → Lighthouse
(desktop + mobile) → Core Web Vitals → Bundle → Rapport → Artifacts (90 j) → Décision.
Seuils Enterprise codés en dur (Perf ≥ 95, A11y ≥ 95, BP = 100, SEO ≥ 95, CWV verts,
bundle ≤ baseline + 5 kB).

---

## 3. Validation technique (faite, mesurée)

| Contrôle | Résultat |
|---|---|
| `pnpm lint` (monorepo) | ✅ 17/17 |
| `pnpm typecheck` (monorepo, incl. test perf) | ✅ 17/17 |
| `pnpm test` (unitaires) | ✅ 330/330 |
| Syntaxe scripts perf (`node --check`) | ✅ 4/4 |
| Logique rapport (jeu de données factice) | ✅ desktop PASS / mobile FAIL → non certifié, score cohérent |
| Workflow perf valide en CI (plus de startup_failure) | ✅ job `preflight` exécuté, run vert |

### Correctif racine CI (hors périmètre initial mais bloquant)

`ci.yml` était en **startup_failure (0 s)** sur `main` depuis plusieurs commits : le contexte
`secrets` est **interdit dans un `if:` de job** GitHub Actions. Corrigé par un job `preflight`
exposant la présence des secrets en `outputs`, consommés via le contexte `needs` (autorisé).
Appliqué à `ci.yml` (`e2e-publications-cert`, `finance-sandbox`) **et** à `performance-cert.yml`.
Preuve : le run `performance-cert` (28987091794) parse et exécute désormais sans erreur.

---

## 4. Blocage à la capture des mesures (factuel)

**Le job `Enterprise Performance Certification` a été SKIPPÉ en CI** car le dépôt
**ne possède aucun secret GitHub Actions** (`gh secret list` → vide ; aucun secret
d'environnement accessible aux jobs sans `environment:`).

Conséquence directe :
- La route certifiée `/creator/catalog/tracks` est **authentifiée** ; sans
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et
  `SUPABASE_SERVICE_ROLE_KEY`, le compte de test ne peut être provisionné ni la session
  ouverte, donc **ni Lighthouse authentifié ni Core Web Vitals ne peuvent être capturés en CI**.
- Les intégrations **Vercel Preview** et **Supabase Preview** existent, mais ce ne sont
  **pas** des secrets GitHub Actions utilisables par la pipeline.

Conformément à la règle B3.2 : cette absence de mesure **n'est pas transformée en réussite**.

---

## 5. Décision de certification

**B3 — Enterprise Performance : ⛔ NON CERTIFIÉ (en attente de preuves CI).**

La pipeline (moyen de preuve) est **livrée, valide et prête**. Il manque uniquement
l'exécution effective en CI, bloquée par l'absence de secrets Actions. Aucun score final
n'est prononcé car aucune mesure Lighthouse/CWV n'a été produite en environnement CI.

---

## 6. Procédure pour obtenir les preuves (débloquer B3)

1. Configurer les secrets GitHub Actions du dépôt (valeurs = celles de `apps/web/.env.local`) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (optionnel) `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD`
   ```bash
   gh secret set NEXT_PUBLIC_SUPABASE_URL
   gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY
   gh secret set SUPABASE_SERVICE_ROLE_KEY
   ```
2. Déclencher la pipeline :
   ```bash
   gh workflow run performance-cert.yml --ref perf/b3-2-performance-ci
   ```
3. Récupérer les artefacts (`performance-cert-publications`) : Lighthouse HTML/JSON
   desktop+mobile, `cwv-publications.json`, `PERFORMANCE_CI_REPORT.md`, `certification.json`.
4. La décision de certification et le score final seront alors produits **sur mesures réelles**.

> Alternative de secours (non certifiante) : mesurer une route **publique** pour valider la
> chaîne technique de la pipeline, sans certifier le module authentifié.

---

## 7. FREEZE

Le **FREEZE** de la Performance CI Pipeline et la déclaration « B3 CERTIFIÉ ENTERPRISE »
ne pourront être prononcés qu'**après** l'exécution CI réelle atteignant les seuils. La
pipeline elle-même est prête à devenir la référence officielle réutilisable (Homepage,
Dashboard Artiste, Wallet, Royalties, Marketplace, Beat Store, Creator Economy, Super Admin).
