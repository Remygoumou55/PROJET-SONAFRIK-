# AUDIT GLOBAL IA — SONAFRIK
> **Pour toute IA qui rejoint le projet mid-session**
> Date de génération : **1er juillet 2026**
> Générateur : Claude Sonnet 4.6 (Principal Architect mode)
> Périmètre : tout ce qui a été fait depuis la première conversation

---

## 0. COMMENT LIRE CE DOCUMENT

Ce fichier est un onboarding complet pour une nouvelle IA. Il remplace 30+ sessions de contexte.
Lire dans l'ordre : ce fichier → `CLAUDE.md` → `docs/PLAN-CORRECTION-360-V2.md` → dernière entrée `docs/EXECUTION_LOG.md`.

---

## 1. IDENTITÉ PROJET

| Champ | Valeur |
|---|---|
| **Nom** | SONAFRIK |
| **Marché** | Streaming musical Afrique de l'Ouest — Guinée Conakry en premier |
| **Devise** | GNF (Franc Guinéen) |
| **Phase** | Pré-lancement, bêta fermée imminente |
| **Fondateur** | Rémy Goumou — visionnaire produit, non technique |
| **Conseiller tech** | Martin — garant de la qualité et de la sobriété technique |
| **Supabase project** | `cxjpburiiazzvlczzupy` |
| **Production URL** | https://sonafrik.vercel.app |
| **Branche principale** | `main` |
| **Monorepo** | pnpm workspaces + Turborepo |

**Paiements cibles :** Orange Money GN · MTN MoMo GN · Wave GN · Soutra Money

**Règle CDC absolue :** Real Listen = **90% de la durée écoutée** — en dessous, ça ne compte pas.

---

## 2. STACK TECHNIQUE

```
apps/
  web/          → Next.js 15 App Router (TypeScript strict)
  mobile/       → Expo React Native (TypeScript strict)
packages/
  types/        → @sonafrik/types — source unique de tous les types métier
  api/          → @sonafrik/api — couche service/repository (jamais de Supabase direct dans les composants)
  ui/           → @sonafrik/ui — composants partagés + storybook
  shared/       → @sonafrik/shared — utils (formatGnf, etc.)
  database/     → @sonafrik/database — types DB générés depuis Supabase
  persistence/  → @sonafrik/persistence — adapters Supabase (couche hexagonale)
  metadata/     → @sonafrik/metadata — moteur ISRC/UPC (headless, sans UI)
supabase/
  migrations/   → 48 migrations appliquées (état complet DB)
  functions/    → Edge Functions (paiements, webhooks)
scripts/        → probes de certification (probe:certification-a-e, probe:vague-*, etc.)
docs/           → Documentation gouvernance
```

**Outillage :**
- Build : `pnpm build` (Turborepo)
- Lint : `pnpm lint` (ESLint)
- Typecheck : `pnpm typecheck` (tsc)
- Tests : `pnpm --filter @sonafrik/api test` (Vitest)
- Probes : `pnpm probe:certification-a-e` (193/193 checks)

---

## 3. RÈGLES DE SÉCURITÉ ABSOLUES (NON-NÉGOCIABLES)

```
❌ NEVER : Committer une clé API, secret, password dans le code
❌ NEVER : Utiliser service_role key côté client
❌ NEVER : Activer BYPASS_AUTH sur Vercel (VERCEL=1)
❌ NEVER : Exposer NEXT_PUBLIC_BYPASS_AUTH dans un bundle de production
❌ NEVER : Faire un push --force sur main
❌ NEVER : Bypasser les hooks pre-commit (--no-verify)
❌ NEVER : Créer une table sans RLS policy
```

**BYPASS_AUTH local :** `process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1"` — jette une `Error` si `VERCEL=1` (sécurité fail-closed).

---

## 4. LES TROIS SILOS (RÈGLE MARTIN — NON-NÉGOCIABLE)

L'application repose sur **3 silos fonctionnels** indépendants :

| Silo | Web | API | Règle |
|---|---|---|---|
| **Auditeur** | `features/listener/`, `app/(listener)/` | `packages/api/listener/` | Un bug ici ne doit **pas** casser artiste ni admin |
| **Artiste** | `features/creator/`, `app/(creator)/` | `packages/api/creator/` | Idem |
| **Admin** | `features/admin/`, `app/(admin)/` | `packages/api/admin/` | Idem |

**Transversal MVP :** `wallet/`, `identity/auth`, `shared/social` — tout changement cross-silo doit être documenté.

**Règle ESLint active :** `eslint.config.mjs` enforce `no-restricted-imports` listener↔creator↔admin — import cross-domaine interdit au build.

**Vague F (2026-06-24, TERMINÉE) :** a physiquement réorganisé les dossiers :
- `features/streaming/` → `features/listener/`
- `features/catalog/` → `features/creator/catalog/`
- `features/rights/` → `features/creator/rights/`
- `features/analytics/` → `features/creator/analytics/`
- `app/(streaming)/` → `app/(listener)/`

---

## 5. DESIGN TOKEN SYSTEM (SSOT)

### 5.1 Web — `apps/web/src/app/globals.css`

**SEULE source de vérité pour les couleurs web.** 37 tokens définis dans le bloc `@theme {}` :

```css
@theme {
  /* Couleurs primaires */
  --color-vert-energie: #00d26a;
  --color-vert-profond: #009b3a;
  --color-or-solaire: #ffc20e;
  --color-or-profond: #f4a300;
  --color-noir-profond: #0d0d0d;

  /* Surfaces */
  --color-surface: #1a1a1a;
  --color-card: #1f1f1f;
  --color-elevated: #2a2a2a;
  --color-bordure: #333333;

  /* Textes */
  --color-texte-principal: #ffffff;
  --color-texte-secondaire: #a0a0a0;
  --color-texte-desactive: #555555;
  --color-texte-subtil: #666666;

  /* États */
  --color-erreur: #ff4444;
  --color-danger: #ff4444;
  --color-info: #3b82f6;
  --color-avertissement: #f59e0b;
  --color-skeleton: #141414;
  --color-pending: #f5a623;

  /* Accents */
  --color-accent-violet: #a855f7;
  --color-accent-orange: #f97316;
  --color-accent-rose: #ec4899;
  --color-accent-bleu-clair: #60a5fa;
  --color-accent-violet-clair: #c084fc;

  /* Providers paiement */
  --color-provider-orange: #ff6600;
  --color-provider-mtn: #ffcc00;

  /* Feature cards */
  --color-feature-azure: #378add;
  --color-feature-indigo: #7f77dd;
  --color-feature-brique: #d85a30;
  --color-feature-navy: #185fa5;

  /* Drapeau Guinéen (logo SONAFRIK S-O-N) */
  --color-flag-rouge: #ce1126;
  --color-flag-jaune: #fcd116;
  --color-flag-vert: #009460;

  /* Admin back-office */
  --color-admin-sidebar: #0a0a0a;
  --color-admin-warning: #ff8c00;
  --color-admin-info: #378add;
  /* + tokens rgba admin */

  /* Google Sign-In — EXEMPT brand guidelines officielles */
  --color-google-blue: #4285f4;
  --color-google-green: #34a853;
  --color-google-yellow: #fbbc05;
  --color-google-red: #ea4335;

  /* Overlays pré-calculés */
  --overlay-vert-soft: rgb(0 210 106 / 0.13);
  --overlay-erreur-soft: rgb(255 68 68 / 0.13);
  --overlay-vert-nav: rgb(0 210 106 / 0.09);
}
```

**INTERDIT dans les composants :**
```tsx
// ❌ JAMAIS
style={{ backgroundColor: "#1A1A1A" }}
style={{ color: "#00D26A" }}

// ✅ TOUJOURS
className="bg-surface text-vert-energie"
style={{ backgroundColor: "var(--color-surface)" }}
```

**Exception documentée :** `GoogleAuthButton.tsx` — les 4 couleurs du logo Google (#4285F4, #34A853, #FBBC05, #EA4335) sont IMPOSÉES par les brand guidelines Google. Elles sont tokenisées dans `@theme {}` mais restent hardcodées dans les `fill=""` SVG (usage SVG unique, conforme).

### 5.2 Mobile — `packages/ui/src/tokens/colors.ts`

Source unique pour React Native. React Native ne supporte pas les CSS variables → les couleurs sont des valeurs JS.

**Tokens disponibles :** `colors.vertEnergie`, `colors.noirProfond`, `colors.orSolaire`, `colors.error`, `colors.textePrincipal`, `colors.texteSecondaire`, `colors.texteDesactive`, `colors.elevated`, `colors.bordure`, etc.

**INTERDIT en mobile :**
```tsx
// ❌
{ color: "#00D26A" }
{ backgroundColor: "#FFC20E22" }  // 8-digit hex invalide en CSS ET RN

// ✅
{ color: colors.vertEnergie }
{ backgroundColor: "rgba(255, 194, 14, 0.13)" }  // alpha pré-calculé
```

### 5.3 Le piège `${cssVar}XX` (BUG DOCUMENTÉ)

Quand on écrit `${tc}22` où `tc = "var(--color-info)"` → on obtient `"var(--color-info)22"` qui est du CSS INVALIDE. Solution : toujours pré-calculer les valeurs rgba dans les tableaux de données.

**Exemple correct (`AdminRightsCenter.tsx`) :**
```typescript
const TYPE_COLORS: Record<RightsClaimType, { color: string; bg: string }> = {
  ownership:    { color: "var(--color-info)",       bg: "rgba(59, 130, 246, 0.13)" },
  infringement: { color: "var(--color-erreur)",     bg: "rgba(255, 68, 68, 0.13)" },
  takedown:     { color: "var(--color-or-solaire)", bg: "rgba(255, 194, 14, 0.13)" },
};
```

---

## 6. ÉTAT DE LA BASE DE DONNÉES

- **53 tables** dans le schéma `public`
- **161 RLS policies** — TOUTES les tables ont RLS activé
- **48 migrations** appliquées (fichiers dans `supabase/migrations/`)
- **DB types générés** : `packages/database/src/types/index.ts` (3766 lignes)

**Tables critiques MVP :**

| Table | Rôle |
|---|---|
| `tracks` | Catalogue musical |
| `artist_profiles` | Profils artistes |
| `subscription_plans` | Plans (gratuit/premium/premium-annual/artiste) |
| `wallets` | Portefeuilles utilisateurs |
| `payment_intents` | Intentions de paiement |
| `stream_sessions` | Sessions d'écoute (CDC = 90%) |
| `likes` | Likes séparés des favoris (Vague C) |
| `favorites` | Favoris |
| `rights_claims` | Réclamations droits |
| `payout_audit_logs` | Traçabilité retraits |
| `metadata_*` (10 tables) | ISRC/UPC engine (headless, Vague 1→4.5) |
| `feature_flags` | Flags fonctionnels (toggles admin) |

**RPC importantes :**
- `toggle_like(track_id)` — like avec séparation propre
- `get_creator_stream_analytics()` — agrégation SQL côté DB
- `metadata_reserve_isrc()` / `metadata_reserve_upc()` — atomiques
- `count_unread_notifications()` — source unique, pas de doublons
- `get_auth_feature_flags()` — flags d'auth (cast temporaire en place)
- `topup_wallet()` · `confirm_payment_intent()` — service_role only

---

## 7. HISTORIQUE CHRONOLOGIQUE COMPLET

### Phase 0 — Fondations (avant 2026-06-24)

Projet monorepo créé avec Next.js 15, Expo, Supabase. Fonctionnalités de base streaming, profil, wallet construites. Code initialement non-organisé par domaines. Pas de tokens CSS unifiés.

### Phase 1 — Sprints 0→9 (avant 2026-06-24)

**Sprint 0-2 :** Auth Supabase, signup/login, profils de base.

**Sprint 3-5 (Rights OS) :** Système de droits artistes (`rights_claims`, `artist_royalties`, `royalty_distributions`). API creator/rights complète.

**Sprint 6-7 (Admin) :** Dashboard admin complet — gestion catalogue, finances, utilisateurs, fraude, droits, flags. LDSE v2 (Live Data Synchronization Engine) avec Event Bus.

**Sprint 8 (Payout) :** Chaîne royalties → retraits. `payout_audit_logs`. Process batch retraits.

**Sprint 9 (Auth humanisée) :** Connexion Google-only (`auth_phone_enabled` flag), onboarding "portes premium", écran `/creator` corrigé (plus d'écran noir), redirections onboarding.

### 2026-06-24 — Vague Audit Forensique + Gouvernance

**Audit global :** Photographie complète du codebase (650 fichiers, ~65 743 lignes). Identification des risques : domaines mélangés, Supabase directs dans les pages, hex hardcodés, chaîne royalties cassée.

**Documents créés :**
- `docs/MASTER_PLAN.md` — plan de correction
- `docs/AI_GOVERNANCE.md` — comportement IA
- `docs/EXECUTION_LOG.md` — journal source de vérité

### 2026-06-24 — Vague A : Bloquants lancement

- Branché `subscription_plans` DB (4 plans : gratuit/premium/premium-annual/artiste)
- Tests wallet/payments (+14 tests)
- E2E chaîne MVP
- Re-audit : badge −20% dynamique, `subscribePremium` erreurs
- **Probe :** `pnpm probe:vague-a-launch` → 15/15 ✅
- 🚫 A1 (credentials Orange Money prod) — bloquant externe
- 🚫 A5 (LIVE CONTROL signature Rémy) — en attente

### 2026-06-24 — Vague B : Stabilisation

- Types DB régénérés (3766 lignes, `subscription_plans` typé)
- `middleware.ts` : cold path session (`getSession()` avant `getUser()`)
- CSP prod durcie (sans `unsafe-eval`)
- Admin middleware fail-closed
- `docs/VAGUE_B_FLAGS_ROLLBACK.md` — 40 flags, rollback SQL
- **Probe :** `pnpm probe:vague-b-stabilisation` → 11/11 ✅

### 2026-06-24 — Vague C : Nettoyage

- Table `likes` séparée de `favorites` (migration `20260624160000`)
- RPC `toggle_like` / `is_liked`
- 4 RPC discovery alignées sur `likes`
- Search gated sur flag `beat_store`
- `LikeButton` aria-labels accessibles
- **Probe :** `pnpm probe:vague-c-stabilisation` → 16/16 ✅

### 2026-06-24 — Vague G : Chaîne royalties

- `RoyaltiesPage` erreur UI + metadata
- Gate `NEXT_PUBLIC_PAYMENTS_ENABLED`
- `WalletClient.withdrawalEnabled` correction (utilisait `isTopupEnabled` → corrigé en `isWithdrawalEnabled`)
- E2E chaîne royalties + payout
- **Probe :** `pnpm probe:vague-g-stabilisation` → 17/17 ✅

### 2026-06-24 — Vague D : Design tokens + typage strict

- 0 hex hardcodé web/mobile confirmés
- Fail-closed sur toutes les erreurs DB (plus de swallow silencieux)
- `analyticsSchema.periodDays` max 90 (aligné caps 10k sessions)
- `hasStreamingPermission` : return true sur erreur → `throw error`
- Performance caps ajoutés
- **Probe :** `pnpm probe:vague-d-stabilisation` → 23/23 ✅

### 2026-06-24 — Vague E : Paiements mobiles & sécurité financière

- 4 opérateurs intégrés (Orange Money GN, MTN MoMo GN, Wave GN, Soutra Money)
- Webhooks DRY + auth HMAC/API key
- `confirm_payment_intent` service_role only
- Gestion TopupModal NaN / < 1000 GNF
- `usePaymentHistory` état error via `PaymentError`
- **Probe :** `pnpm probe:vague-e-stabilisation` → 26/26 ✅
- 🚫 Prod opérateurs bloquée externe (credentials Rémy)

### 2026-06-24 — Certification A→E

- `pnpm probe:certification-a-e` → **193/193** ✅
- Build / lint / typecheck / tests **283/283** ✅
- DB live vérifiée (likes, subscription_plans, payment_intents, payout_audit_logs — RLS=true)

### 2026-06-24 — Vague F : Isolation domaines (GRANDE RÉORGANISATION)

**Lot F4 :** Déplacement physique des fichiers :
- `features/streaming/` → `features/listener/`
- `features/catalog/` + `features/rights/` + `features/analytics/` → `features/creator/*`
- `app/(streaming)/` → `app/(listener)/`
- 57 fichiers déplacés, 13 imports mis à jour

**Lot F6.1 :** ESLint `no-restricted-imports` listener↔creator↔admin

**Lots F3/F5/F6.2/F6.3 :** Découpage fichiers, audit hex CI, SSR listener → couche API, pont identity→creator

**Probe :** `pnpm probe:vague-f` → 26/26 ✅ · `pnpm probe:certification` → 129/129 ✅

### 2026-06-24 — Metadata Engine (Phases 1→4.5)

Construit en couches successives, **sans aucun impact UI/MVP** :

| Phase | Livraison |
|---|---|
| 1 | Fondations : types stricts, interfaces, erreurs (`packages/metadata/`) |
| 1.5 | Certification : types centralisés dans `@sonafrik/types`, ADRs |
| 2 | ISRC Engine headless (44 tests, 100% conformité ISO 3901) |
| 2.5 | Providers injectables, couverture 96.58%, stress/concurrency |
| 3 | `@sonafrik/persistence` — adapters Supabase découplés (22 tests) |
| 3.5 | Infrastructure : 10 tables `metadata_*` + RLS + RPC atomiques (55 tests) |
| 4 | Application Services CQRS/DTO/Mappers (33 tests, couverture 95.65%) |
| 4.5 | `PublicationOrchestrator` dry-run (15 tests, couverture 96.97%) |

Toutes phases : **zéro ISRC attribué, zéro publication réelle, invisible utilisateurs.**

### 2026-06-24 — Creator Dashboard HQ

Refonte Dashboard Créateur : hero vivant, KPIs émotionnels, feed activité, objectifs, revenus, carrière, assistant contextuel, quick actions dynamiques. Logique métier via service `createCreatorDashboardService`, pas de Supabase direct.

### 2026-06-24 — War Plan A→E + Performance

- CI : `pnpm test` global (vitest API + shared + persistence + metadata)
- Sync `creators` → `artist_profiles` orphelins
- `devBypass.ts` + `guards.ts` fail-closed
- `useWalletPageData` — 1 round-trip wallet (plus de requêtes dupliquées)
- Performance flags activés (`performance_search_cache_enabled` ON, `performance_animation_cdc_compliant_enabled` ON)
- **Probe :** `pnpm probe:war-plan` → 15/15 ✅

### 2026-06-24 → 2026-06-30 — UX Premium + Humanisation

Sessions successives :
- **Admin cockpit humanisé** : dashboard SSOT, module LDSE v2, supervision fraude
- **Onboarding "portes"** : `/onboarding/journey` transformé en choix de porte premium
- **Auth Google-only** : `/login` simplifié, flag `auth_phone_enabled`
- **Creator `/creator`** : écran noir corrigé, redirections onboarding fixes

### 2026-07-01 — Plan de Guerre Vague D (Cette Session)

**Contexte :** PLAN-CORRECTION-360-V2.md (30 juin) identifie hex résiduels dans mobile et web.

**Audit forensique 3 passes :**

**Pass 1 — Web :**
- `apps/web/src/app/onboarding/layout.tsx` : couleurs SONAFRIK logo → tokens `--color-flag-*`
- `apps/web/src/features/wallet/components/PaymentHistory.tsx` : `"#f5a623"` → `var(--color-pending)` (token créé)
- `apps/web/src/features/admin/components/AdminRightsCenter.tsx` : bug `${tc}22` → struct `{color, bg}` pré-calculée
- `apps/web/src/features/streaming/components/HomepageMediaCard.tsx` : `${gradient.from}40` → `ringAlpha` pré-calculée
- `apps/web/src/lib/constants.ts` : `CARD_GRADIENTS` (8 entrées) refactorisé avec rgba pré-calculés
- `apps/web/src/components/landing/LandingArtists.tsx` : 5 hex avatar → rgba pré-calculés
- `packages/ui/.storybook/preview.ts` : `"#0d0d0d"` → `colors.noirProfond`
- `packages/ui/src/styles/globals.css` : désync avec web globals.css → 33 tokens synchronisés

**Pass 2 — Mobile :**
- `apps/mobile/app/(tabs)/index.tsx` : 9 violations 8-digit hex → rgba (FFC20E22, 00D26A33, etc.)
- `apps/mobile/app/(tabs)/wallet.tsx` : 13 violations → rgba + tokens colors
- `apps/mobile/app/(tabs)/_layout.tsx` : `shadowColor: "#000"` → `"black"`
- `apps/mobile/app/(tabs)/profil/account.tsx` : `#FF4444` → `colors.error` (3 occurrences)
- `apps/mobile/app/(tabs)/profil/index.tsx` : `#FF4444` → `colors.error`
- `apps/mobile/app/auth/connexion.tsx` : `#FF4444` → `colors.error`
- `apps/mobile/app/auth/inscription.tsx` : `#FF4444` → `colors.error`

**Fix cache Tailwind dev :**
Port 3000 avait une ancienne instance corrompue. Solution : `rm -rf apps/web/.next` + redémarrage. Dev server sur port **3005**.

**Vérification HTTP 200 (38/38 pages) :**
Toutes les pages retournent 200 sur `http://localhost:3005`. CSS Tailwind présent dans les HTML.

---

## 8. ÉTAT ACTUEL (1er juillet 2026)

### Build / Qualité

| Check | Statut |
|---|---|
| `pnpm build` | ✅ PASS (47 routes web) |
| `pnpm lint` | ✅ 0 warning, 0 error |
| `pnpm typecheck` | ✅ 0 erreur TypeScript |
| `pnpm --filter @sonafrik/api test` | ✅ 283/283 PASS |
| `pnpm probe:certification-a-e` | ✅ 193/193 |
| `pnpm probe:war-plan` | ✅ 15/15 |
| Hex web (probe:hex-colors) | ✅ 0 violation |
| Hex mobile | ✅ 0 violation (audit manuel 3 passes) |

### Pages (38 routes web)

Toutes retournent HTTP 200 :

```
/ (landing)          /login              /onboarding/*
/listen              /listen/artist/*    /listen/album/*
/listen/track/*      /listen/search      /listen/library
/listen/playlist/*   /wallet             /wallet/royalties
/wallet/payout       /creator            /creator/upload
/creator/track/*     /creator/analytics  /creator/rights
/creator/rights/new  /admin              /admin/catalog
/admin/finance       /admin/fraud        /admin/rights
/admin/flags         /admin/settings     /admin/health
+ pages d'erreur 404/500
```

### Commit actuel

```
c816db4 fix(design): Vague D re-audit final — 0 hex hardcodé monorepo complet
```

### Tokens CSS (comptage exact)

**Web :** 37 tokens dans `@theme {}` (globals.css) + tokens admin rgba + overlays pré-calculés
**Mobile :** `packages/ui/src/tokens/colors.ts` synchronisé

---

## 9. CE QUI RESTE À FAIRE

### Bloquants externes (hors code)

| ID | Description | Responsable |
|---|---|---|
| A1 | Credentials opérateurs prod (Orange Money GN, MTN MoMo GN, Wave GN, Soutra Money) | Rémy → opérateurs |
| A5 | LIVE CONTROL signature fondateur | Rémy |

### Vagues techniques planifiées

| Vague | Nom | Priorité | Condition de démarrage |
|---|---|---|---|
| **G** | Hygiène structurelle (orphelins, silos docs) | Faible | Peut faire maintenant |
| **H** | Découpage fichiers longs (CSS monolithes, composants 350L+) | Faible | Après G |
| **I** | Déplacement silos backend (`packages/api`) | Moyen | Après H |
| **J** | Global CSS SSOT (changer palette = 1 fichier) | Moyen | Post-beta |
| **K** | Finance prod (Orange Money E2E réel) | **CRITIQUE** | A1 débloqué |

### Décisions reportées roadmap Phase 2

- Recommandations ML temps réel (SQL `get_trending_tracks` suffit pour MVP)
- Widgets drag-drop dashboard créateur (Phase 10)
- Parity mobile pour onboarding (web sprint only, mobile parity post-MVP)
- Types DB régénérés pour inclure `get_auth_feature_flags` RPC (cast temporaire en place)

---

## 10. DÉCISIONS ARCHITECTURALES CLÉS (ADRs)

### ADR-001 : Tailwind v4 + tokens `@theme`

Tailwind v4 lit le bloc `@theme {}` et génère des classes utility. Avantage : `bg-vert-energie`, `text-erreur` etc. sont auto-générées sans config séparée.

### ADR-002 : Hex alpha 8-digit INVALIDE

`#RRGGBBAA` n'est pas standard CSS. `#FF444422` est invalide dans les navigateurs modernes. Toujours utiliser `rgba(255, 68, 68, 0.13)` à la place. React Native a le même problème.

### ADR-003 : Template literal + CSS variable = INVALIDE

`${cssVar}22` quand `cssVar = "var(--color-info)"` génère `"var(--color-info)22"` — CSS invalide. Solution : pré-calculer les rgba dans les data arrays.

### ADR-004 : Google brand colors EXEMPT

Les 4 couleurs du logo Google (#4285F4, #34A853, #FBBC05, #EA4335) sont imposées par les brand guidelines Google. Elles sont tokenisées dans `@theme {}` mais les `fill=""` SVG dans `GoogleAuthButton.tsx` restent hardcodés. C'est correct et intentionnel.

### ADR-005 : BYPASS_AUTH fail-closed

`process.env.BYPASS_AUTH === "true" && process.env.VERCEL !== "1"` — si quelqu'un active BYPASS_AUTH en prod (VERCEL=1), le code lève une `Error`. Jamais de bypass silencieux.

### ADR-006 : Session Engine LOCKED

`packages/api/src/streaming/session/` — INTERDIT de modifier sans ADR explicite. Contient la logique CDC (90% durée écoutée). Toute modification doit être documentée avant exécution.

### ADR-007 : Vague E on hold

Sans credentials des APIs opérateurs (Orange Money GN, MTN MoMo GN, Wave GN, Soutra Money), construire les intégrations crée de la dette garantie. Décision : la Vague K (Finance prod) attend les credentials. On peut construire les UI shells sans appels API.

### ADR-008 : Metadata Engine headless

`packages/metadata/` contient le moteur ISRC/UPC mais n'est pas connecté à l'UI. ISRC = identifiant légal des morceaux — l'attribution manuelle nécessite validation légale. Le moteur est prêt mais son déclenchement dans le workflow publication est gated.

### ADR-009 : Likes ≠ Favorites (Vague C)

Avant Vague C, les likes et favoris étaient dans la même table `favorites`, ce qui faussait les analytics discovery. Après : `likes` table séparée avec `toggle_like()` RPC, `favorites` pour les listes. Les 4 RPC de discovery ont été alignées.

---

## 11. FICHIERS DE RÉFÉRENCE CRITIQUES

| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | **Lire en premier** — gouvernance IA, rôle, principes |
| `docs/PLAN-CORRECTION-360-V2.md` | **Plan actif** — vagues G→K, lots, fichiers |
| `docs/AUDIT-V2-FORENSIQUE.md` | Audit risques V2 — duplications, silos, CSS |
| `docs/EXECUTION_LOG.md` | **Source de vérité** — état actuel, historique complet |
| `docs/MVP_SCOPE_LOCK.md` | Périmètre MVP verrouillé |
| `apps/web/src/app/globals.css` | **Tokens de design web** — SEULE source |
| `packages/ui/src/tokens/colors.ts` | **Tokens de design mobile** |
| `packages/types/src/index.ts` | Tous les types métier |
| `supabase/migrations/` | État actuel de la DB (48 migrations) |
| `scripts/probe-certification-vagues-a-e.ts` | Probe master 193/193 |

---

## 12. COMMANDES UTILES

```bash
# Développement
pnpm --filter @sonafrik/web dev          # Dev server web (port 3000 ou 3005)
pnpm --filter @sonafrik/mobile start     # Dev server mobile (Expo)

# Validation obligatoire avant chaque commit
pnpm build && pnpm lint && pnpm typecheck

# Tests
pnpm --filter @sonafrik/api test         # Tests Vitest API (283 tests)

# Probes
pnpm probe:certification-a-e            # Certification complète A→E (193/193)
pnpm probe:hex-colors                   # 0 hex web (4/4)
pnpm probe:vague-f                      # Isolation domaines (26/26)
pnpm probe:war-plan                     # War plan (15/15)

# Base de données
supabase db query --linked "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
supabase db query --linked "SELECT tablename, policyname FROM pg_policies WHERE schemaname='public';"

# Si le dev server est cassé (Tailwind perdu)
rm -rf apps/web/.next
# Relancer pnpm --filter @sonafrik/web dev
```

---

## 13. PIÈGES CONNUS

### Piège 1 : Dev server Tailwind cassé

Si les classes Tailwind (`rounded-2xl`, `p-5`, `flex`) ne s'appliquent plus mais que les CSS variables fonctionnent (fond noir, texte vert) → problème de cache HMR. Solution : `rm -rf apps/web/.next` + redémarrer.

### Piège 2 : Port 3000 occupé

Si le port 3000 est pris par un ancien processus zombie, le dev server démarre sur 3005. Vérifier avec `netstat -ano | findstr :3000` sous Windows.

### Piège 3 : ESLint no-restricted-imports

L'ESLint refuse les imports cross-domaine (`listener` → `creator`, etc.). Si un composant doit être partagé, il va dans `features/shared/`.

### Piège 4 : `pnpm gen:types`

Régénérer les types DB depuis Supabase live : `pnpm --filter @sonafrik/database gen:types`. Nécessite connexion Supabase active. Le fichier `packages/database/src/types/index.ts` peut être stale.

### Piège 5 : LandingArtists.tsx dynamique

`LandingArtists` est maintenant dynamique (données artistes depuis DB). La page landing utilise `getAvatarPalette(artist.paletteIndex)` pour les couleurs d'avatar. Ne pas hardcoder de nouveaux artistes dans le composant — utiliser la DB.

### Piège 6 : Session Engine LOCKED

Ne JAMAIS modifier `packages/api/src/streaming/session/` sans avoir lu `ADR-006` et créé un ADR formel. Ce code gère la règle CDC 90% — une modification mal faite casse la comptabilisation des streams et les royalties.

---

## 14. ÉTAT ÉMOTIONNEL DU PROJET

- **Confiance technique :** haute — 193/193 probes, 283/283 tests, 0 hex hardcodé
- **Confiance UX :** haute — 38/38 pages HTTP 200, Tailwind fonctionnel, design cohérent
- **Bloquants :** 100% externes (credentials opérateurs)
- **Dette technique :** documentée, non bloquante pour la bêta
- **Bêta fermée :** prête techniquement dès que LIVE CONTROL (A5) signé

---

*Document généré par Claude Sonnet 4.6 — 1er juillet 2026*
*Mis à jour après : Vague D re-audit final (0 hex hardcodé monorepo complet)*
