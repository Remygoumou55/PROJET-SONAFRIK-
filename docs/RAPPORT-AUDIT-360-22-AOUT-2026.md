# Rapport d'audit 360° — SONAFRIK

**Date :** 22 août 2026  
**Auteur :** Claude (Senior Principal Architect)  
**Périmètre :** monorepo complet (web, mobile, API, DB, Supabase, docs)  
**Statut validation :** `pnpm build` ✅ / `pnpm lint` ✅ / `pnpm typecheck` ✅

---

## 1. Résumé exécutif

### 1.1 Ce que j'ai corrigé immédiatement

- **Build bloquant corrigé :** `get_trending_artists_mixed` était absent de `packages/database/src/types/index.ts` alors que le RPC existe en base (migration `20260708100000_get_trending_artists_mixed.sql`).
  - Conséquence : `packages/api` ne compilait plus.
  - Fix : ajout de la signature `get_trending_artists_mixed: { Args: { p_limit?: number }; Returns: Json }`.
  - Validation : `pnpm build`, `pnpm lint`, `pnpm typecheck` passent.
  - Commit/push : `f6d0bde` sur `main`.
- **Git propre :** les artefacts locaux `apps/web/perf-artifacts*` (rapports Lighthouse/test) ont été retirés du commit et ignorés via `.gitignore`.

### 1.2 État global

| Axe | État | Note |
|-----|------|------|
| Build monorepo | ✅ OK | 10 packages, 47+ routes web |
| TypeScript | ✅ OK | 0 erreur |
| ESLint | ✅ OK | 0 warning, 0 error |
| Tests API | ⚠️ non relancés ce soir | Dernier état connu 330/330 ✅ |
| Déploiement Vercel | ⚠️ à vérifier post-push | Lien précédent KO probablement à cause du build cassé |

### 1.3 Score de maturité par espace

| Espace | Score | Commentaire |
|--------|-------|-------------|
| Auditeur | 8.5/10 | Player, discovery, homepage, search, library — fonctionnels mais 280+ `use client` |
| Créateur | 7/10 | Upload, catalog, dashboard, droits, analytics — présents mais fichiers lourds et couplages API |
| Admin | 6.5/10 | Cockpit riche mais monolithes CSS + appels directs Supabase dans certains composants |
| Architecture globale | 7/10 | Silos web OK, packages/api pas encore aligné, CSS monolithes, types DB stale |

---

## 2. Métriques du codebase

| Mesure | Valeur |
|--------|--------|
| Fichiers migrations SQL | 134 |
| Tables DB (estimé) | 53+ |
| Packages API source `.ts` | 327 |
| Web `features/listener/` fichiers | 108 |
| Web `features/creator/` fichiers | 87 |
| Web `features/admin/` fichiers | 94 |
| Web `features/identity/` fichiers | 95 |
| Web `features/wallet/` fichiers | 16 |
| Web `features/shared/` fichiers | 80 |
| Routes web Next.js | 47+ |
| `use client` dans web | 280+ occurrences sur 279 fichiers |
| Composants/API > 350 lignes | 8 fichiers critiques |
| Fichiers CSS > 300 lignes | 30+ monolithes |
| Fichiers tests web E2E | 14 |
| Mobile app screens | 26 |
| Mobile features | 9 |

---

## 3. Audit par espace

### 3.1 Espace Auditeur (Listener)

**Dossiers clés :**

- `apps/web/src/app/(listener)/` : 20 fichiers
- `apps/web/src/features/listener/` : 108 fichiers
- `packages/api/src/listener/` : 7 fichiers
- `packages/api/src/streaming/` : 88 fichiers (moteur d'écoute, partagé)

**Routes principales :**

- `/listen` : homepage discovery
- `/listen/track/[id]` : fiche morceau
- `/listen/album/[id]` : fiche album
- `/listen/artist/[id]` : fiche artiste
- `/listen/search` : recherche
- `/listen/library` : bibliothèque
- `/listen/playlist/[id]` : playlists
- `/listen/beats` : beat store

**Fonctionnalités identifiées :**

- Hero carousel, sections recommendations, trending, top Guinée, nouveaux albums, artistes à découvrir
- Player full, queue, like/favorite, playlists
- Search multi-type

**Bugs / anomalies / dette :**

| ID | Sévérité | Problème | Fichier concerné |
|----|----------|----------|------------------|
| L-01 | Haute | `get_trending_artists_mixed` manquant dans les types DB | `packages/database/src/types/index.ts` |
| L-02 | Moyenne | `listener.track.repository.ts` fait 461 lignes | `packages/api/src/listener/listener.track.repository.ts` |
| L-03 | Moyenne | Fichier CSS `listen-home.css` orphelin (2 369L) | `apps/web/src/app/styles/listen-home.css` |
| L-04 | Basse | `use client` très répandu (risque perf) | 100+ fichiers listener |
| L-05 | Basse | `listen-future.css` supprimé (commit 0deef52) | `apps/web/src/app/styles/listen-future.css` |

**Vagues de correction recommandées :**

1. **L-V1** : Synchroniser les types DB après chaque migration (CI).
2. **L-V2** : Décomposer `listener.track.repository.ts` en read/write.
3. **L-V3** : Nettoyer CSS orphelins et monolithes listener.
4. **L-V4** : Passer certains composants `use client` en RSC quand possible.

---

### 3.2 Espace Créateur (Artiste)

**Dossiers clés :**

- `apps/web/src/app/(creator)/` : 32 fichiers
- `apps/web/src/features/creator/` : 87 fichiers
- `packages/api/src/creator/` : 56 fichiers
- `packages/api/src/catalog/` : non déplacé sous `creator/` (dette architecture)
- `packages/api/src/rights/` : non déplacé sous `creator/`
- `packages/api/src/analytics/` : non déplacé sous `creator/`

**Routes principales :**

- `/creator` : dashboard HQ
- `/creator/upload` : upload morceau/album
- `/creator/track/[id]` : édition track
- `/creator/catalog/tracks` : gestion publications
- `/creator/analytics` : statistiques
- `/creator/rights` : réclamations droits
- `/creator/team`, `/creator/verification`, `/creator/publications`

**Fonctionnalités identifiées :**

- Upload audio + couverture, wizard publication, hero artiste
- Dashboard KPI, revenus, carrière, coach
- Catalog tracks/albums, analytics, droits (rights claims)

**Bugs / anomalies / dette :**

| ID | Sévérité | Problème | Fichier concerné |
|----|----------|----------|------------------|
| C-01 | Haute | `catalog.repository.ts` 642 lignes | `packages/api/src/creator/catalog/catalog.repository.ts` |
| C-02 | Haute | `catalog.service.ts` 631 lignes | `packages/api/src/creator/catalog/catalog.service.ts` |
| C-03 | Moyenne | `usePublicationWizardFlow.ts` 442 lignes | `apps/web/src/features/creator/catalog/hooks/usePublicationWizardFlow.ts` |
| C-04 | Moyenne | `packages/api/src/catalog/` pas sous `creator/` | dette Vague I |
| C-05 | Moyenne | `packages/api/src/rights/` pas sous `creator/` | dette Vague I |
| C-06 | Moyenne | `packages/api/src/analytics/` pas sous `creator/` | dette Vague I |
| C-07 | Basse | CSS `pub-wizard.css` 1 166L et `hero.css` 1 030L | `apps/web/src/app/styles/creator/` |

**Vagues de correction recommandées :**

1. **C-V1** : Valider end-to-end le flux upload → publication → catalog.
2. **C-V2** : Découper `catalog.repository.ts`, `catalog.service.ts` et `usePublicationWizardFlow.ts`.
3. **C-V3** : Déplacer `packages/api/src/catalog/`, `rights/`, `analytics/` sous `creator/` (Vague I du plan 360).
4. **C-V4** : Alléger CSS créateur et utiliser tokens SSOT.

---

### 3.3 Espace Administration

**Dossiers clés :**

- `apps/web/src/app/(admin)/` : 32 fichiers
- `apps/web/src/features/admin/` : 94 fichiers
- `packages/api/src/admin/` : 26 fichiers
- `apps/web/src/app/styles/admin*.css` : monolithes

**Routes principales :**

- `/admin` : cockpit
- `/admin/catalog` : validation catalogue
- `/admin/finance` : revenus/retraits
- `/admin/fraud` : fraude
- `/admin/rights` : contentieux droits
- `/admin/flags` : feature flags
- `/admin/settings` : paramètres
- `/admin/health` : santé système

**Fonctionnalités identifiées :**

- Dashboard KPI, supervision, fraud review
- Gestion artistes, catalog, finance, retraits, batch payout
- Modération utilisateurs, hero slides, flags, awards/beatstore

**Bugs / anomalies / dette :**

| ID | Sévérité | Problème | Fichier concerné |
|----|----------|----------|------------------|
| A-01 | Haute | `AdminHeroSlidesClient.tsx` appelle `supabase.from` directement (6×) | `apps/web/src/features/admin/components/AdminHeroSlidesClient.tsx` |
| A-02 | Haute | `AdminBusinessRulesCenter.tsx` 413 lignes | `apps/web/src/features/admin/components/AdminBusinessRulesCenter.tsx` |
| A-03 | Moyenne | `AdminRevenueClient.tsx` 358 lignes | `apps/web/src/features/admin/components/AdminRevenueClient.tsx` |
| A-04 | Moyenne | `buildAdminDashboardView.ts` 357 lignes | `apps/web/src/features/admin/lib/buildAdminDashboardView.ts` |
| A-05 | Moyenne | CSS admin monolithes (`admin.css` 1 354L, `admin-dashboard-human.css` 863L, `admin-sprint5.css` 598L, `admin-fraud-human.css` 633L) | `apps/web/src/app/styles/` |
| A-06 | Moyenne | Appels directs `supabase.auth`/`supabase.rpc` dans `requireAdmin.ts`, `admin-fraud.actions.ts`, `getAdminSessionContext.ts` | `features/admin/lib/`, `features/admin/actions/` |
| A-07 | Basse | Composants awards/beatstore protégés par feature flags | `features/admin/components/AdminAwardsClient.tsx`, `AdminBeatStoreClient.tsx` |

**Vagues de correction recommandées :**

1. **A-V1** : Isoler tous les appels Supabase dans `packages/api` (supprimer `supabase.from`/`rpc` des composants admin).
2. **A-V2** : Découper les composants admin > 350 lignes.
3. **A-V3** : Découper et rationaliser les CSS admin.
4. **A-V4** : Vérifier RLS/admin RPC et hardening.

---

## 4. Backend / API / Base de données

### 4.1 Architecture API

- `packages/api/src/` : 327 fichiers
- `packages/api/src/index.ts` point d'entrée
- Silos partiellement alignés : `listener/`, `creator/`, `admin/`, `wallet/`, `streaming/`
- **Non aligné :** `catalog/`, `rights/`, `analytics/`, `publication/`, `metadata/` restent top-level.

### 4.2 Fichiers les plus lourds API

| Fichier | Lignes | Risque |
|---------|--------|--------|
| `packages/api/src/creator/catalog/catalog.repository.ts` | 642 | God file |
| `packages/api/src/creator/catalog/catalog.service.ts` | 631 | God file |
| `packages/api/src/listener/listener.track.repository.ts` | 461 | Surcharge |
| `packages/api/src/streaming/playback/playback-engine.handlers.ts` | 416 | ADR-006 LOCKED |
| `packages/api/src/publication/publication-integration.test.ts` | 402 | Test — OK |

### 4.3 Base de données

- 134 migrations SQL appliquées.
- Tables critiques : `tracks`, `artist_profiles`, `stream_sessions`, `wallets`, `payment_intents`, `payout_audit_logs`, `likes`, `favorites`, `rights_claims`, `subscription_plans`.
- `packages/database/src/types/index.ts` : 4 286 lignes, mais **souvent stale** (ex. `get_trending_artists_mixed` absent).

**Anomalie DB critique à automatiser :**

- Après chaque nouvelle migration contenant un RPC/une table, il faut régénérer `packages/database/src/types/index.ts`.
- Solution durable : `pnpm gen:types` dans la CI à chaque push de migration.

---

## 5. Mobile

**Stack :** Expo 52 + React Native 0.76 + TypeScript.

**Dossiers :**

- `apps/mobile/app/` : 26 fichiers
- `apps/mobile/features/` : 9 fichiers
- `apps/mobile/lib/` : utilitaires

**Observations :**

- Parité mobile post-MVP : web beaucoup plus avancé.
- Tokens couleurs dans `packages/ui/src/tokens/colors.ts`.
- Pas de violation hexadécimale détectée (audit passé).

**Vagues de correction mobile :**

1. **M-V1** : Atteindre la parité onboarding/auth.
2. **M-V2** : Répliquer `listener/` (player, homepage, search).
3. **M-V3** : Répliquer `creator/` (upload simplifié, dashboard).

---

## 6. Bugs, codes morts, duplications, performance

### 6.1 Bugs corrigés dans cette session

| ID | Problème | Fichier | État |
|----|----------|---------|------|
| B-01 | `get_trending_artists_mixed` absent des types DB | `packages/database/src/types/index.ts` | ✅ corrigé |

### 6.2 Bugs / anomalies actifs

| ID | Problème | Localisation | Sévérité |
|----|----------|--------------|----------|
| B-02 | `AdminHeroSlidesClient.tsx` appelle Supabase directement | `features/admin/components/` | Haute |
| B-03 | `DevAuthBootstrap.tsx` accède à `supabase.auth` côté client | `features/identity/auth/components/` | Moyenne |
| B-04 | `listener/track/[id]/page.tsx` contient `supabase.auth` ? | `app/(listener)/...` | À vérifier |
| B-05 | CSS monolithes non découpés | `app/styles/` | Moyenne |
| B-06 | `marketplace/` shims (1 fichier) | `features/marketplace/` | Basse |
| B-07 | `listen-home.css` orphelin 2 369L | `app/styles/listen-home.css` | Moyenne |
| B-08 | `listen-future.css` supprimé (commit 0deef52) | `app/styles/listen-future.css` | Basse |
| B-09 | Identity 95 fichiers — surface de bug large | `features/identity/` | Moyenne |
| B-10 | `packages/api` silos non alignés | `packages/api/src/catalog/`, `rights/`, `analytics/` | Moyenne |

### 6.3 Codes morts / orphelins

- `apps/web/src/app/styles/listen-home.css` (orphelin vs bundle actif)
- `apps/web/src/app/styles/listen-future.css` (supprimé (commit 0deef52))
- `apps/web/src/features/marketplace/` (1 shim)
- `apps/web/src/app/lancement/` et `components/landing/` — organisation à consolider
- `packages/api/src/creator/career/` — API active alors que UI partiellement gelée
- Tables DB orphelines : `creators` vs `artist_profiles` (doc only MVP)

### 6.4 Performance

- 280+ `use client` dans web : surcharge JS côté client.
- CSS monolithes : poids parsing, pas de tree-shake natif.
- Fichiers API > 600 lignes : temps de compilation, tests lents.
- Bundle `/listen` = 251 kB (acceptable mais à surveiller).

---

## 7. Plan de correction structuré (vagues)

### Vague 0 — Stabilisation immédiate (EN COURS / TERMINE)

| Lot | Action | Fichiers | Validation |
|-----|--------|----------|------------|
| V0-1 | Synchroniser types DB | `packages/database/src/types/index.ts` | `pnpm build` ✅ |
| V0-2 | Ignorer artefacts locaux | `.gitignore`, `apps/web/perf-artifacts*` | `git status` ✅ |
| V0-3 | Vérifier déploiement Vercel | `https://sonafrik.vercel.app` | 200 sur /, /listen, /creator, /admin |

### Vague A — Auditeur (Listener)

| Lot | Action | Fichiers |
|-----|--------|----------|
| A-1 | Audit player, queue, heartbeat | `features/listener/streaming/` |
| A-2 | Audit homepage discovery / recommendations | `features/listener/components/Homepage*`, `RecommendedSection.tsx` |
| A-3 | Audit library / playlists | `features/listener/library/`, `app/(listener)/library/` |
| A-4 | Audit search | `features/listener/search/`, `app/(listener)/search/` |
| A-5 | Décomposer `listener.track.repository.ts` | `packages/api/src/listener/listener.track.repository.ts` |
| A-6 | Nettoyer CSS listener orphelins | `app/styles/listen-home.css` (orphelin), `app/styles/listen-future.css` (supprimé), `app/styles/listen-home/` |

### Vague B — Créateur (Artiste)

| Lot | Action | Fichiers |
|-----|--------|----------|
| B-1 | Valider upload → publication E2E | `app/(creator)/creator/upload/`, `creator/catalog/` |
| B-2 | Découper `catalog.repository.ts` / `catalog.service.ts` | `packages/api/src/creator/catalog/` |
| B-3 | Découper `usePublicationWizardFlow.ts` | `apps/web/src/features/creator/catalog/hooks/` |
| B-4 | Déplacer silos API `catalog/`, `rights/`, `analytics/` | `packages/api/src/` |
| B-5 | Dashboard creator QA | `features/creator/dashboard/`, `app/(creator)/creator/page.tsx` |
| B-6 | Nettoyer CSS creator monolithes | `app/styles/creator/hero.css`, `pub-wizard.css`, etc. |

### Vague C — Administration

| Lot | Action | Fichiers |
|-----|--------|----------|
| C-1 | Retirer appels Supabase directs des composants admin | `AdminHeroSlidesClient.tsx`, `AdminBusinessRulesCenter.tsx`, etc. |
| C-2 | Découper composants admin > 350L | `Admin*Client.tsx`, `lib/buildAdminDashboardView.ts` |
| C-3 | Refactor CSS admin | `app/styles/admin*.css` |
| C-4 | Audit RLS / admin RPC | `packages/api/src/admin/`, `supabase/migrations/` |
| C-5 | Fraud review & rights center | `features/admin/fraud/`, `AdminRightsCenter.tsx` |

### Vague D — Hygiène structurelle & dette

| Lot | Action | Fichiers |
|-----|--------|----------|
| D-1 | Supprimer `marketplace/` shims, `listen-home.css` orphelin | `features/marketplace/`, `app/styles/listen-home.css` |
| D-2 | Découper CSS monolithes | `app/styles/admin/`, `app/styles/creator/`, `app/styles/listen-home/` |
| D-3 | Global CSS 1-clic (consolidation `rgba` et overlays) | `app/globals.css`, `app/styles/*` |
| D-4 | Réduire `use client` | 279 fichiers audités un par un |
| D-5 | Aligner `packages/api` en silos | `packages/api/src/catalog/`, `rights/`, `analytics/` |

### Vague E — Finance prod (bloquante lancement)

| Lot | Action | Fichiers |
|-----|--------|----------|
| E-1 | Credentials opérateurs (Rémy) | Supabase secrets / Vercel env |
| E-2 | Orange Money Phase 2 E2E réel | Edge functions `payment-initiate`, `payment-orange-callback` |
| E-3 | MTN MoMo, Wave, Soutra Money validation | `packages/api/src/payments/`, `wallet/` |
| E-4 | Tests retraits réels | `packages/api/src/wallet/`, `payout/` |

### Vague F — Mobile parity & tests

| Lot | Action | Fichiers |
|-----|--------|----------|
| F-1 | Onboarding/auth mobile | `apps/mobile/app/auth/`, `app/(tabs)/` |
| F-2 | Player mobile | `apps/mobile/features/streaming/` |
| F-3 | E2E full (Playwright) | `apps/web/tests/e2e/` |

---

## 8. Commandes de validation à exécuter à chaque lot

```bash
pnpm build        # build complet
pnpm lint         # 0 warning, 0 error
pnpm typecheck    # 0 erreur TypeScript
pnpm test         # tests monorepo
pnpm probe:certification  # probes A→E
```

---

## 9. Conclusion

Le projet SONAFRIK est **techniquement solide** mais subit une accumulation de dette structurale et des types DB non synchronisés. Le build est désormais réparé et poussé sur `main`.

**Prochaines priorités :**

1. Vérifier le lien Vercel dans les minutes qui suivent.
2. Exécuter Vague A (auditeur) d'abord car c'est le produit visible.
3. Puis Vague B (créateur) et Vague C (admin).
4. Hygiène (Vague D) en parallèle entre les vagues fonctionnelles.
5. Vague E (finance) dès que Rémy fournit les credentials opérateurs.
6. Vague F (mobile) en dernier, post-bêta.

Le plan de correction est découpé **espace par espace**, avec des lots testables individuellement.
