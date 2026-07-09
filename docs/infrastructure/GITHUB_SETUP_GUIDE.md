# Guide de configuration GitHub — SONAFRIK

> Pour le **propriétaire du dépôt** qui découvre le projet.
> Objectif : configurer GitHub Actions en **~10 minutes** pour débloquer la CI et la certification performance B3.2.
>
> **Aucune valeur secrète n'apparaît dans ce guide.** Vous copiez les valeurs depuis vos outils existants.

---

## Prérequis

- Accès **admin** au dépôt GitHub `Remygoumou55/PROJET-SONAFRIK-`
- Accès au projet **Supabase** (`cxjpburiiazzvlczzupy`)
- Accès **Vercel** (où l'app est déjà déployée) **ou** fichier local `apps/web/.env.local`
- [GitHub CLI](https://cli.github.com/) (`gh`) installé *(recommandé, optionnel)*

---

## Étape 1 — Comprendre ce qui bloque

La CI et la pipeline de certification **fonctionnent techniquement**, mais les jobs authentifiés sont **skippés** car GitHub n'a **aucun Repository Secret**.

Sans ces 3 secrets minimum, impossible de :
- provisionner le compte test Playwright ;
- exécuter les E2E « Mes publications » ;
- capturer Lighthouse + Core Web Vitals en CI (B3.2).

---

## Étape 2 — Récupérer les valeurs (sans les partager)

### Option A — depuis `apps/web/.env.local` (le plus simple en local)

Ouvrez le fichier sur votre machine (il n'est **pas** dans Git) :

```
apps/web/.env.local
```

Repérez ces lignes :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Option B — depuis Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Projet **PROJET-SONAFRIK** (`cxjpburiiazzvlczzupy`)
3. **Project Settings** → **API**
4. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (cliquez *Reveal*) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ La clé `service_role` contourne RLS. Ne la mettez **jamais** dans une variable `NEXT_PUBLIC_*` ni dans le code client.

### Option C — depuis Vercel

1. [https://vercel.com](https://vercel.com) → projet SONAFRIK
2. **Settings** → **Environment Variables**
3. Copiez les mêmes 3 variables (Production ou Preview — utilisez les valeurs du projet lié)

---

## Étape 3 — Créer les Repository Secrets

### Méthode 1 — Interface GitHub (recommandée débutant)

1. Ouvrez : `https://github.com/Remygoumou55/PROJET-SONAFRIK-/settings/secrets/actions`
2. Cliquez **New repository secret**
3. Créez **un secret à la fois** :

| Name (exact) | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL copiée à l'étape 2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon copiée |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role copiée |

### Méthode 2 — GitHub CLI

Depuis un terminal, à la racine du projet :

```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL
# Collez la valeur quand demandé, puis Entrée

gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY

gh secret set SUPABASE_SERVICE_ROLE_KEY
```

Vérifiez (affiche les **noms** uniquement, jamais les valeurs) :

```bash
gh secret list
```

Vous devez voir **3 lignes** minimum.

---

## Étape 4 — Secrets optionnels (après les 3 obligatoires)

| Secret | Quand l'ajouter | Où trouver la valeur |
|---|---|---|
| `TURBO_TOKEN` | Builds CI plus rapides | Vercel → Remote Caching |
| `TURBO_TEAM` | idem | Vercel → Team slug |
| `PLAYWRIGHT_TEST_EMAIL` | Compte test dédié CI | Email d'un user Supabase Auth test |
| `PLAYWRIGHT_TEST_PASSWORD` | idem | Mot de passe du compte |
| `SANDBOX_FINANCE_EMAIL` | Job `finance-sandbox` | Défaut script : `s12b-artist-1-1782222972289@sonafrik.test` |
| `SANDBOX_FINANCE_PASSWORD` | idem | Défaut script : `Sprint12BTest2026!` |

Si vous omettez Playwright et sandbox, les **valeurs par défaut codées** dans les workflows/scripts sont utilisées.

---

## Étape 5 — Merger le fix CI (si pas déjà sur `main`)

Le correctif `preflight` (évite le crash CI en 0 seconde) est sur la branche `perf/b3-2-performance-ci`.

Si `main` n'a pas encore ce fix :

```bash
git checkout main
git pull
git merge perf/b3-2-performance-ci
git push origin main
```

Ou ouvrez une Pull Request depuis GitHub.

---

## Étape 6 — Relancer la CI

### CI standard (lint, build, E2E)

Un **push** ou **PR** vers `main` ou `develop` déclenche automatiquement `ci.yml`.

Ou manuellement :

```bash
gh workflow run ci.yml --ref main
```

### Certification performance B3.2

```bash
gh workflow run performance-cert.yml --ref main
```

Avec paramètres personnalisés (autre module futur) :

```bash
gh workflow run performance-cert.yml \
  --ref main \
  -f route=/creator/catalog/tracks \
  -f slug=publications \
  -f baseline_first_load_kb=268
```

Suivre l'exécution :

```bash
gh run list --workflow=performance-cert.yml --limit 5
gh run watch
```

---

## Étape 7 — Vérifier que tout fonctionne

### Checklist CI (`ci.yml`)

| Job | Attendu avec secrets P0 |
|---|---|
| `Preflight (secrets)` | ✅ `has_supabase=true`, `has_service_role=true` |
| `Quality Gate` | ✅ lint, typecheck, test, build |
| `E2E Smoke` | ✅ ou skip gracieux selon auth state |
| `E2E Publications Certification Gate` | ✅ **plus skippé** |
| `Finance Sandbox E2E` | ✅ si service_role présent |

### Checklist Performance (`performance-cert.yml`)

| Étape | Attendu |
|---|---|
| `Preflight` | `has_supabase_full=true` |
| `Enterprise Performance Certification` | ✅ **exécuté** (plus skippé) |
| Artifacts | Télécharger `performance-cert-publications` |
| `certification.json` | `"certified": true` ou `false` selon **mesures réelles** |
| `PERFORMANCE_CI_REPORT.md` | Rapport lisible dans l'artifact |

Télécharger les artifacts :

```bash
gh run download <RUN_ID> -n performance-cert-publications -D ./perf-artifacts
```

---

## Étape 8 — Reproduction locale (optionnel)

Si vous voulez valider **avant** la CI :

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Terminal 1
pnpm --filter @sonafrik/web start

# Terminal 2 (avec .env.local chargé)
pnpm perf:cwv
node scripts/perf/run-lighthouse.mjs \
  --url http://localhost:3000/creator/catalog/tracks \
  --out apps/web/perf-artifacts \
  --headers apps/web/perf-artifacts/auth-headers.json \
  --form-factor both --slug publications
node scripts/perf/generate-report.mjs --dir apps/web/perf-artifacts --slug publications
```

Guide détaillé : [`../performance/ENTERPRISE_PERF_CI_PIPELINE.md`](../performance/ENTERPRISE_PERF_CI_PIPELINE.md)

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Job perf **skipped** en 5 s | Secrets absents ou incomplets | Vérifier `gh secret list` (3 noms P0) |
| CI **failed in 0s** | Ancien workflow sans `preflight` | Merger fix sur `main` |
| `Auth session missing` en local | Normal sur routes sans login | Utiliser tests Playwright avec global-setup |
| E2E publications **skip** | `has_supabase=false` | URL + anon secrets |
| `service_role` erreur 401 | Mauvaise clé copiée | Re-copier depuis Supabase API |
| Artifact vide | Job principal skippé | Secrets P0 d'abord |

---

## Sécurité — règles à respecter

- ❌ Ne jamais committer `.env.local` ou les clés dans le code
- ❌ Ne jamais préfixer `service_role` en `NEXT_PUBLIC_`
- ❌ Ne jamais coller les secrets dans une issue GitHub ou un chat
- ✅ Utiliser uniquement **Repository Secrets** ou **Environment Secrets**
- ✅ Rotation des clés Supabase si exposition accidentelle

---

## Références

- Inventaire complet : [`GITHUB_ACTIONS_SECRETS.md`](./GITHUB_ACTIONS_SECRETS.md)
- Rapport readiness : [`INFRASTRUCTURE_READINESS_REPORT.md`](./INFRASTRUCTURE_READINESS_REPORT.md)
- Vérification env locale : `pnpm check-env`

**Une fois les 3 secrets P0 configurés, la certification B3.2 ne requiert plus aucune intervention technique — seulement l'exécution et la lecture du rapport CI.**
