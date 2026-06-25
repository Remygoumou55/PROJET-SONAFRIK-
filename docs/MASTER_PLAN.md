# MASTER PLAN — SONAFRIK
> Audit forensique 360° + Plan de guerre complet  
> **Date :** 2026-06-24  
> **Statut :** Audit terminé — **aucun code applicatif modifié**  
> **Gouvernance IA :** `docs/AI_GOVERNANCE.md`  
> **Journal :** `docs/EXECUTION_LOG.md`

---

## SCORES GLOBAUX (/100)

| Dimension | Score | Justification factuelle |
|---|---|---|
| **Architecture** | **72** | Routes Next isolées ✅ — `features/` non aligné domaines ❌ |
| **Performance** | **82** | Timeouts SSR, React.cache, pas de fichiers >500L app — `playerContext` 397L |
| **Sécurité** | **86** | RLS 53/53, Vague A intacte, probes 103/103 — SSR direct Supabase streaming |
| **Maintenabilité** | **85** | 0 TS/lint, probes automatisés — drift CLAUDE.md vs code |
| **MVP Readiness** | **68** | Chaîne coupée à Royalties + Retraits (flags) |
| **Qualité code** | **88** | 0× `as never`, build 47 routes OK |
| **GLOBAL** | **78** | Saine techniquement — MVP produit incomplet |

> Score certification automatisée (A→E) : **103/103** — ne mesure pas l'isolation domaines ni la chaîne MVP produit.

---

## PHASE 1 — CARTOGRAPHIE

### Métriques (git-tracked, mesurées 2026-06-24)

| Métrique | Valeur |
|---|---|
| Fichiers versionnés | **650** |
| Lignes totales | **~65 743** |
| Fichiers source TS/TSX/CSS/SQL (hors lock) | **~550** |

### Répartition par zone

| Zone | Fichiers source |
|---|---|
| `apps/web` | 301 |
| `packages/api` | 91 |
| `supabase/migrations` | 57 |
| `packages/ui` | 47 |
| `apps/mobile` | 37 |
| `supabase/functions` | 14 |
| `packages/types` | 12 |

### Arbre logique

```
PROJET SONAFRIK/
├── apps/
│   ├── web/          Next.js 15 — 47 routes, features/
│   └── mobile/       Expo — partiel
├── packages/
│   ├── api/          Services + repositories (31 repos)
│   ├── types/        Types métier
│   ├── database/     Client Supabase + types générés (3319 L)
│   ├── ui/           17 composants
│   └── shared/       formatGnf, utils
├── supabase/
│   ├── migrations/   64 SQL
│   ├── functions/    11 edge functions actives
│   └── seed/
├── scripts/          Probes A→E, certification, live tests
├── docs/             Gouvernance + CDC + rapports
└── .github/workflows/ci.yml
```

### Fichiers les plus lourds (top 15 applicatifs)

| Lignes | Fichier | Classe |
|---|---|---|
| 3319 | `packages/database/src/types/index.ts` | À SURVEILLER (généré — ne pas éditer) |
| 591 | `supabase/migrations/...payout_engine.sql` | SAIN (SQL migration) |
| 496 | `supabase/migrations/...royalty_engine.sql` | SAIN |
| 487 | `supabase/migrations/...analytics_pro.sql` | SAIN |
| 445 | `supabase/migrations/...discovery_engine.sql` | À SURVEILLER (complexité POST-MVP) |
| 397 | `apps/web/.../playerContext.tsx` | À SURVEILLER (proche seuil 500) |
| 390 | `packages/api/.../streaming.repository.ts` | À SURVEILLER |
| 380 | `apps/web/.../SearchResults.tsx` | À SURVEILLER |
| 361 | `packages/api/.../admin.repository.ts` | À SURVEILLER |
| 342 | `apps/web/.../LandingPlans.tsx` | SAIN (landing POST-MVP) |
| 324 | `packages/types/src/wallet.ts` | SAIN |
| 321 | `packages/api/.../catalog.repository.ts` | SAIN |
| 312 | `packages/api/.../streaming.service.ts` | SAIN |
| 307 | `apps/web/.../TopupModal.tsx` | SAIN |
| 386 | `apps/mobile/app/(tabs)/index.tsx` | À SURVEILLER |

### Seuils de taille (code applicatif TS/TSX — hors lock, docs, migrations, types générés)

| Seuil | Nombre | Verdict |
|---|---|---|
| **> 2000 lignes** | **0** | ✅ |
| **> 1000 lignes** | **0** | ✅ |
| **> 500 lignes** | **0** | ✅ — max 397L (`playerContext.tsx`) |

---

## PHASE 2 — DUPLICATIONS

| # | Élément | Emplacement A | Emplacement B | Impact | Risque | Priorité |
|---|---|---|---|---|---|---|
| D1 | Structure onboarding steps | `onboarding/artist/steps/` | `onboarding/listener/steps/` | Patterns similaires non partagés | Moyen — divergence UX | P2 |
| D2 | Landing pré-lancement | `(public)/page.tsx` + composants landing | `/lancement/page.tsx` | Double maintenance contenu | Moyen | P2 |
| D3 | Docs plans correction | `PLAN_CORRECTION_360.md` | `MASTER_PLAN.md` (ce fichier) | Redondance doc | Faible | P3 |
| D4 | Journal interventions | `RAPPORT_COLLECTION.md` | `EXECUTION_LOG.md` | Deux journaux | Faible — fusionner progressivement | P3 |
| ~~D5~~ | ~~formatGnf~~ | — | — | **Résolu Vague B** — `@sonafrik/shared` | — | ✅ |

**Note :** pas de duplication critique de services/hooks métier détectée. `formatGnf` unifié.

---

## PHASE 3 — CODE MORT (estimation)

| Élément | Statut | Preuve |
|---|---|---|
| `RoyaltiesPage.tsx` | **Mort** | Page `/wallet/royalties` utilise `ComingSoon` directement, composant jamais importé |
| `BeatStoreClient` | **Dormant** | Flag `beat_store` = false → ComingSoon |
| `SubscriptionModal` | **Partiellement mort** | Wallet en ComingSoon si paiements off |
| Enterprise RPC discovery/recommendation | **Sous-utilisés** | Repos existent, UI limitée |
| `studios` table | **Probablement inutilisée** | Aucune ref dans `packages/api` |

**Estimation code mort web : ~8–12%** (landing POST-MVP + composants wallet dormants + rights enterprise UI partielle).

---

## PHASE 4 — ROUTES

### Publiques (sans auth)

| Route | État |
|---|---|
| `/` | Landing ComingSoon |
| `/lancement` | Landing compteur abonnés |
| `/auth/connexion`, `/auth/inscription`, `/auth/mot-de-passe-oublie` | OK |
| `/auth/callback` | OK |
| `/legal/privacy`, `/legal/terms` | Stubs pré-lancement |
| `/onboarding/*` | Protégé session (redirect si non connecté) |

### Privées (middleware — session requise)

| Préfixe | Domaine |
|---|---|
| `/listen`, `/library`, `/search`, `/notifications` | Listener (streaming) |
| `/creator` | Creator |
| `/wallet` | Wallet |
| `/profile`, `/settings` | Identity |

### Admin (session + RPC `is_admin`)

| Route | État |
|---|---|
| `/admin`, `/admin/catalog`, `/admin/rights`, `/admin/finance`, `/admin/fraud`, `/admin/flags`, `/admin/settings`, `/admin/health` | OK build |

### Routes « ComingSoon » intentionnelles (pas cassées)

| Route | Condition |
|---|---|
| `/wallet`, `/wallet/payout` | `NEXT_PUBLIC_PAYMENTS_ENABLED=false` |
| `/wallet/royalties` | Toujours ComingSoon |
| `/listen/beats` | `beat_store` flag false |

### Anomalies

| Issue | Détail | Risque |
|---|---|---|
| R1 | Pages SSR streaming appellent Supabase direct (`.from()`) au lieu de `packages/api` | Moyen — régression Vague C partielle |
| R2 | Pas de boucles infinies détectées au build | — |
| R3 | Middleware timeout 4s → user null → redirect connexion sur routes protégées | Faible — écran connexion, pas boucle |

---

## PHASE 5 — AUTHENTIFICATION

| Composant | Fichier | État |
|---|---|---|
| Middleware | `apps/web/src/middleware.ts` | ✅ Timeout anti-blocage |
| Bypass dev | `BYPASS_AUTH=true` + `VERCEL !== "1"` | ✅ Guardé |
| Guards creator | `features/creator/lib/requireCreator.ts` | ✅ |
| Guards admin | `features/admin/lib/requireAdmin.ts` | ✅ |
| Guards identity | `features/identity/lib/requireIdentity.ts` | ✅ |
| Redirect by role | `lib/auth/redirectByRole.ts` | ✅ |
| Profils | `profiles.account_type`, `onboarding_completed` | ✅ |

| Risque | Niveau | Détail |
|---|---|---|
| Cold start Supabase → user null 4s | MOYEN | Peut rediriger vers connexion alors que session existe |
| Admin check RPC timeout → false | FAIBLE | Redirect `/listen` |
| `getServiceRoleClient()` dans `server.ts` | ÉLEVÉ si mal utilisé | Réservé admin SSR — auditer chaque appelant |

---

## PHASE 6 — SUPABASE

### Edge Functions (11)

| Function | Rôle | Déployée |
|---|---|---|
| `stream-start/progress/complete` | Streaming Real Listen | ✅ |
| `payment-initiate` + 4 callbacks | Paiements | ✅ |
| `wallet-topup` | Bloqué 403 (Vague A) | ✅ |
| `wallet-request-withdrawal` | Retraits | ✅ |
| `catalog/creator/avatar-signed-url` | Storage signed URLs | ✅ |
| `audit-log` | Audit | ✅ |

### Tables principales — matrice usage

| Table | Utilisée | Inutilisée / POST-MVP | Risque |
|---|---|---|---|
| profiles, user_roles, roles | ✅ MVP | | Faible |
| creators, artist_profiles | ✅ MVP | | Faible |
| albums, tracks, track_files, genres | ✅ MVP | | Faible |
| stream_sessions, stream_events | ✅ MVP | | Faible |
| wallets, wallet_ledger, transactions | ✅ MVP | | Faible |
| payment_intents | ✅ MVP | | Faible |
| withdrawals, payout_accounts | ✅ MVP | Gated UI | Moyen |
| royalty_cycles, royalty_calculations | ⚠️ Backend | UI ComingSoon | **Élevé MVP** |
| rights (works, ownerships…) | ⚠️ Creator | POST-MVP profond | Moyen |
| beats, beat_purchases | ❌ UI off | POST-MVP | Faible |
| subscription_plans | ❌ | POST-MVP G-5 | Faible |
| payout_batches, payout_audit_logs | ⚠️ Backend | Admin partiel | Faible |
| feature_flags, system_settings | ✅ | | Faible |
| rate_limits | ✅ service_role | | Faible |
| admin_notifications | ✅ Admin | | Faible |
| follows, favorites | ✅ Social | | Faible |
| studios | ❌ probable | POST-MVP | Faible |
| studios, label_members | ⚠️ partiel | | Faible |

**Migrations :** 64/64 local = remote ✅  
**RLS :** 53/53 tables ✅

### Storage buckets

| Bucket | Usage |
|---|---|
| avatars | Identity |
| catalog-audio, covers | Catalog |
| (autres sprint 4-6) | Creator assets |

---

## PHASE 7 — PERFORMANCE (TOP 20 — mesuré statiquement)

| # | Problème | Fichier / zone | Priorité |
|---|---|---|---|
| P1 | Context player monolithique 397L | `playerContext.tsx` | P1 |
| P2 | `useWallet` — 6× patterns async | `useWallet.ts` | P2 |
| P3 | SSR multi-query parallèle sans cache unifié | `listen/page.tsx` | P2 |
| P4 | `SearchResults.tsx` 380L — rerenders liste | streaming | P2 |
| P5 | `admin.repository.ts` 361L — requêtes dashboard multiples | admin | P2 |
| P6 | `HomepageContentSections` fetch sections | streaming | P2 |
| P7 | Polling paiement 3s | `TopupModal.tsx` | P3 |
| P8 | Realtime channel sans cleanup audit | `useRealtimeChannel.ts` | P2 |
| P9 | Mobile index 386L | mobile | P3 |
| P10 | Types wallet 324L | packages/types | P3 |
| P11 | Discovery RPC lourdes POST-MVP | migrations sprint 60 | P3 |
| P12 | Royalty engine SQL 496L | migration | P3 |
| P13 | Double fetch artist page SSR | `listen/artist/[id]` | P2 |
| P14 | Album page 3 requêtes SSR direct | `listen/album/[id]` | P2 |
| P15 | `StreamingLayoutClient` 237L layout+player | streaming | P3 |
| P16 | CI sans cache Turbo remote si secrets absents | `.github/ci.yml` | P3 |
| P17 | Pas de probe perf automatisé | scripts | P3 |
| P18 | `useSearch` debounce non mesuré | streaming | P3 |
| P19 | Image landing non optimisées partout | landing | P4 |
| P20 | Generated types 3319L — regen lente | database | P4 |

---

## PHASE 8 — SÉCURITÉ

| Issue | Niveau | Détail |
|---|---|---|
| `confirm_payment_intent` service_role only | ✅ CRITIQUE résolu | Vague A |
| `topup_wallet` bloqué client | ✅ CRITIQUE résolu | Vague A |
| Edge wallet-topup 403 | ✅ CRITIQUE résolu | Vague A |
| `SUPABASE_SERVICE_ROLE_KEY` server-side only | ✅ | Jamais NEXT_PUBLIC |
| BYPASS_AUTH dev | MOYEN | OK si VERCEL guard |
| SSR Supabase direct streaming | MOYEN | Contourne couche API — surface RLS anon |
| Middleware timeout auth | MOYEN | Faux négatif session |
| Admin service role client | ÉLEVÉ | `getServiceRoleClient()` — lister appelants |
| Payment webhooks HMAC | ✅ | Vague E |
| CI placeholder keys | FAIBLE | Build only |

---

## PHASE 9 — AUDIT MVP

### Chaîne MVP — état réel

| Étape | État | Bloquant |
|---|---|---|
| Compte | ✅ Auth OK | |
| Profil Artiste | ✅ Creator identity | |
| Album / Cover / Audio | ✅ Catalog upload | |
| Publication | ✅ Workflow + scripts live | |
| Écoutes | ✅ Real Listen V7.2 | |
| Royalties | ❌ UI ComingSoon | **OUI** |
| Revenus | ⚠️ Analytics creator partiel | **OUI** |
| Retraits | ⚠️ Code OK, flag off + credentials | **OUI** |

### Classification fonctionnalités

**MVP CORE**
- Auth, onboarding, profil
- Catalog (album, track, cover, audio, publish)
- Streaming (listen, library, search, player)
- Stream events → royalty engine backend
- Wallet solde + historique
- Payout request (avec paiements activés)

**MVP PLUS**
- Notifications
- Social (likes, follows)
- Creator analytics dashboard
- Admin catalog/rights review

**POST-MVP**
- Beat store (`marketplace/`)
- Subscription plans MM (G-5)
- Discovery/recommendation enterprise
- Landing compteur 2000 abonnés
- Rights OS complet (contracts, ownership versions)
- Mobile app parité web

**À SUPPRIMER / GELER (ne pas développer avant MVP core OK)**
- Nouvelles tables enterprise sans UI MVP
- Duplication landing `/` + `/lancement`
- Studios module
- Features gadgets admin non utilisées

---

## PHASE 10 — ARCHITECTURE

### Architecture actuelle

```
Next.js App Router
  ├── Route groups: (streaming), (creator), (admin), (wallet), (identity)
  └── features/ — DÉCALAGE avec route groups :
        streaming/  ← devrait être listener/
        catalog/, rights/, analytics/  ← devraient être sous creator/
        admin/, wallet/, identity/  ← OK
        marketplace/  ← POST-MVP isolé OK
packages/api/  ← couche métier (31 repositories) ✅
packages/types/ ← types ✅
supabase/  ← DB + edge ✅
```

### Architecture recommandée

```
features/listener/     ← rename streaming
features/creator/      ← absorb catalog, rights, analytics
features/admin/
features/wallet/
features/identity/
features/shared/       ← social, notifications, tips
ESLint boundaries      ← no-restricted-imports par domaine
Pages SSR              ← zero .from() direct — API layer only
globals.css            ← seule source visuelle
```

---

## PHASE 11 — ISOLATION DOMAINES

| Domaine cible | Dossier actuel | Isolé ? | Imports cross dangereux |
|---|---|---|---|
| Listener | `features/streaming/` | ⚠️ Partiel | → `social/` (OK shared) |
| Creator | `features/creator/` + `catalog/` + `rights/` + `analytics/` | ❌ Fragmenté | Pages creator importent catalog/rights |
| Admin | `features/admin/` | ✅ | Self-contained |
| Wallet | `features/wallet/` | ✅ | |
| Identity | `features/identity/` | ⚠️ | → `creator/hooks` (BecomeArtistButton) |
| Auth | `features/auth/` | ✅ | |
| Marketplace | `features/marketplace/` | ✅ isolé POST-MVP | |

**Verdict isolation : NON CONFORME** à la cible CLAUDE.md (`listener/` absent).

---

## PHASE 12 — GLOBAL SCS

| Élément | État | Score |
|---|---|---|
| Tokens couleurs `@theme` | ✅ `globals.css` | 90/100 |
| Hex hardcodés composants | ✅ ~0 (1 fichier auth Google brand) | 95/100 |
| Typographie centralisée | ✅ `--font-sans` | 90/100 |
| Spacing/radius/shadows | ✅ tokens CSS | 85/100 |
| Composants `@sonafrik/ui` | ✅ 17 composants | 80/100 |
| SCSS parallèle | ✅ Absent | 100/100 |
| Shadcn | ❌ Non utilisé (Tailwind v4 natif) | N/A |

**Changement couleur en un clic :** ✅ pour tokens existants — modifier `globals.css` `@theme`.

---

## PHASE 13 — DÉCOUPAGE FICHIERS (plan uniquement)

| Priorité | Fichier | Lignes | Action future |
|---|---|---|---|
| F1.1 | `playerContext.tsx` | 397 | Extraire reducer + actions + hooks |
| F1.2 | `SearchResults.tsx` | 380 | Split par entity type |
| F1.3 | `streaming.repository.ts` | 390 | Split read/write |
| F1.4 | `admin.repository.ts` | 361 | Split finance/catalog/stats |
| F1.5 | `HomepageContentSections.tsx` | 324 | 1 composant par section |

**Aucun fichier >500L — Lot F1 (>2000L) et F2 (>1000L) : vide. Lot F3 (>500L) : préventif sur fichiers 350–400L.**

---

## PHASE 14 — PLAN DE GUERRE

### ✅ VAGUE A — URGENCE ABSOLUE (TERMINÉE)
Sécurité financière, RLS, subscription_plans, admin_dashboard_stats.  
**Probe :** 15/15 | **Fichiers clés :** migrations `20260621040000`, edge `wallet-topup`

### ✅ VAGUE B — STABILISATION (TERMINÉE)
formatGnf unifié, doublons RPC supprimés.  
**Probe :** 19/19

### ✅ VAGUE C — NETTOYAGE API ADMIN (TERMINÉE)
8 pages admin → `useAdminService`. **Gap restant :** pages streaming SSR.  
**Probe :** 19/19

### ✅ VAGUE D — OPTIMISATION (TERMINÉE)
0 hex hardcodés, 0× `as never`.  
**Probe :** 22/22

### ✅ VAGUE E — PAIEMENTS (TERMINÉE)
Edge initiate + callbacks, TopupModal, migration audit payout.  
**Probe :** 22/22 | **Ops :** credentials opérateurs prod requis

---

### 🟡 VAGUE F — ARCHITECTURE & ISOLATION (EN COURS — F4 ✅)

> **Lot F4 exécuté 2026-06-24** — `streaming/` → `listener/`, catalog/rights/analytics → `creator/`

#### LOT F1–F2 — Découpage >2000 / >1000 lignes
**Statut :** N/A — skip.

#### LOT F3 — Découpage préventif 350–400L
**Statut :** ✅ **TERMINÉ 2026-06-24**

| Tâche | Fichier |
|---|---|
| F3.1 Split player context | `listener/lib/playerContext.tsx` + `playerQueueUtils.ts` |
| F3.2 Split search results | `listener/components/SearchResults.tsx` + `SearchResultRows.tsx` |
| F3.3 Split admin repo | `admin.{config,moderation,dashboard}.repository.ts` |

#### LOT F4 — Réorganisation Domain Driven
**Statut :** ✅ **TERMINÉ 2026-06-24**

| Tâche | Statut |
|---|---|
| F4.1 `streaming/` → `listener/` | ✅ |
| F4.2 `catalog/` → `creator/catalog/` | ✅ |
| F4.3 `rights/` → `creator/rights/` | ✅ |
| F4.4 `analytics/` → `creator/analytics/` | ✅ |
| F4.5 Imports + probes A–C mis à jour | ✅ |
| F4.6 Route group `(streaming)` → `(listener)` | ✅ |

**Probe :** `pnpm probe:vague-f` → **26/26**

#### LOT F5 — Global SCS
**Statut :** ✅ **TERMINÉ 2026-06-24**

| Tâche | Fichier |
|---|---|
| F5.1 Audit hex automatisé | `scripts/probe-hex-colors.ts` |
| F5.2 Intégration CI | `.github/workflows/ci.yml` via `probe:certification` |

#### LOT F6 — Dépendances croisées
| Tâche | Statut |
|---|---|
| F6.1 ESLint `no-restricted-imports` | ✅ |
| F6.2 SSR listener → API layer | ✅ |
| F6.3 identity→creator pont API | ✅ |

#### LOT F7 — Isolation complète
| Tâche | Statut |
|---|---|
| F7.1 `probe-vague-f.ts` | ✅ |
| F7.2 e2e par domaine (checks statiques) | ✅ |
| F7.3 certification globale + F | ✅ |

**Vague F : TERMINÉE** — prochaine étape : Vague G (chaîne MVP)

---

### 🟡 VAGUE G — COMPLÉTION CHAÎNE MVP (après F)

| Lot | Tâche | Fichiers | MVP step |
|---|---|---|---|
| G1 | Brancher `RoyaltiesPage` sur `/wallet/royalties` | `wallet/royalties/page.tsx`, `RoyaltiesPage.tsx` | Royalties |
| G2 | Activer paiements staging | `.env`, `paymentsEnabled.ts` | Retraits |
| G3 | Test E2E chaîne complète | `scripts/artist-journey-live.ts` | Bout en bout |
| G4 | Supprimer code mort `RoyaltiesPage` duplicate ou ComingSoon | wallet | Cleanup |
| G5 | Credentials opérateurs prod | Supabase secrets | Retraits réels |

**Durée : 5–7 jours**

---

### ⚪ VAGUE H — POST-MVP (gelé jusqu'à G validée)

- Beat store activation
- Subscription MM G-5
- Discovery enterprise UI
- Mobile parité
- Fusion landing `/` + `/lancement`
- Rights OS contracts UI

---

## TOP 20 PROBLÈMES SONAFRIK

| # | Problème | Sévérité |
|---|---|---|
| 1 | `features/listener/` n'existe pas — auditeur dans `streaming/` | **Élevée** |
| 2 | `catalog/`, `rights/`, `analytics/` hors `creator/` | **Élevée** |
| 3 | Chaîne MVP coupée : Royalties UI = ComingSoon | **Critique MVP** |
| 4 | Retraits gated + credentials opérateurs | **Critique MVP** |
| 5 | SSR pages streaming — Supabase direct (hors API) | **Élevée** |
| 6 | CLAUDE.md promet structure non implémentée | **Moyenne** |
| 7 | Pas de ESLint boundaries inter-domaines | **Élevée** |
| 8 | `RoyaltiesPage.tsx` code mort | **Faible** |
| 9 | POST-MVP tables (beats, subscription) alourdissent scope | **Moyenne** |
| 10 | Enterprise discovery SQL 445L — complexité prématurée | **Moyenne** |
| 11 | `playerContext.tsx` monolithique 397L | **Moyenne** |
| 12 | CI sans e2e ni probes | **Moyenne** |
| 13 | Middleware auth timeout faux négatif | **Moyenne** |
| 14 | Double landing `/` + `/lancement` | **Faible** |
| 15 | Mobile 37 fichiers vs web 301 — parité faible | **Moyenne** |
| 16 | Identity → Creator hook direct | **Faible** |
| 17 | `studios` table probablement morte | **Faible** |
| 18 | Deux journaux docs (COLLECTION + EXECUTION_LOG) | **Faible** |
| 19 | Service role client — surface à auditer | **Élevée** |
| 20 | Vagues A→E marquées terminées masquent gap architecture | **Élevée** |

---

## FICHIERS RÉFÉRENCE PAR DOMAINE (pour corrections)

### Listener (actuellement `streaming/`)
```
apps/web/src/features/streaming/**
apps/web/src/app/(streaming)/**
packages/api/src/streaming/**
packages/api/src/discovery/**
packages/api/src/recommendation/**
packages/api/src/social/**
```

### Creator
```
apps/web/src/features/creator/**
apps/web/src/features/catalog/**
apps/web/src/features/rights/**
apps/web/src/features/analytics/**
apps/web/src/app/(creator)/**
packages/api/src/creator/**
packages/api/src/catalog/**
packages/api/src/rights/**
packages/api/src/analytics/**
```

### Admin
```
apps/web/src/features/admin/**
apps/web/src/app/(admin)/**
packages/api/src/admin/**
```

### Wallet / Payments
```
apps/web/src/features/wallet/**
apps/web/src/app/(wallet)/**
packages/api/src/wallet/**
packages/api/src/payments/**
packages/api/src/payout/**
packages/api/src/royalties/**
supabase/functions/payment-*/**
```

### Identity / Auth
```
apps/web/src/features/identity/**
apps/web/src/features/auth/**
apps/web/src/middleware.ts
apps/web/src/lib/auth/**
packages/api/src/identity/**
packages/api/src/auth/**
```

### Design System
```
apps/web/src/app/globals.css
packages/ui/src/**
```

### Tests & validation
```
scripts/probe-vague-*.ts
scripts/probe-certification-globale.ts
apps/web/tests/e2e/**
.github/workflows/ci.yml
```

---

## METADATA ENGINE — ROADMAP (hors audit MVP)

| Phase | Statut | Livrable |
|---|---|---|
| 1 / 1.5 | ✅ Certifié | Contracts `@sonafrik/metadata` + types |
| 2 / 2.5 | ✅ Certifié | ISRC Engine headless (96% coverage) |
| 3 | ✅ Certifié | `@sonafrik/persistence` — adapters, factory, DI |
| 3.5 | ✅ Certifié | Migrations `metadata_*`, adapters complets, RLS, RPC atomiques |
| 4 | ✅ Certifié | Application Services `packages/api/metadata` — CQRS, DTO, use cases, 95% coverage |
| 4.5 | ✅ Certifié | Publication Orchestrator — pipeline dry-run, transactions, rollback |
| 5 | ✅ Certifié | Publication Workflow Integration — feature flags, CatalogService bridge, progressive rollout |
| 6 | ⏳ Next | UI publication hooks (affichage statuts, sans ISRC) |

---

## STREAMING RUNTIME — SPRING 2 (Enterprise Program)

> Programme certifié 2026-06-25 — **documentation hardening certifié 2026-06-25** — implémentation 2.1 autorisée.

| Sous-phase | Statut | Livrable |
|---|---|---|
| **Docs** | ✅ Certifié | STATE_MACHINE v2.1.0 · DOMAIN_EVENTS v2.1.0 · SEQUENCE_DIAGRAMS v1.1.0 |
| **2.1** Foundation | ✅ Certifié | Runtime Coordinator + Application Layer + 118 tests |
| **2.1-C** Certification | ✅ Certifié | Audit architecture · legacy · flags · coverage ≥95 % |
| **2.2** Session Engine | ✅ Certifié | SessionEngine, state machine §5.2, pipeline handlers, 190 tests |
| **2.3** Playback Runtime | ✅ Certifié | PlaybackEngine §5.1, signed URLs, buffer/recovery, 258 tests |
| **2.4** Analytics Engine | 📋 Next | Agrégations fiables, LIMIT, creator stats |
| **2.5** Anti-Fraud Engine | 📋 Planifié | Scoring multi-signaux, invalidation session |
| **2.6** Stream Ledger | 📋 Planifié | Journal financier append-only (ADR-002) |
| **2.7** Certification | 📋 Planifié | Probes, load tests, rapport certification |
| **2.8** MVP Integration | 📋 Planifié | Feature flags, bridge legacy, zéro changement UI |

**Documents :** `docs/streaming/SPRING_2_PROGRAM.md` · `STATE_MACHINE.md` · `DOMAIN_EVENTS.md` · `SEQUENCE_DIAGRAMS.md` · `DOMAIN_MAP.md` · `DEPENDENCY_RULES.md` · `docs/ADR/`

**Gate Sprint 2.1 :** specs streaming v2.1.0 / v1.1.0 avec ownership, persistence policy et index SEQ-001→SEQ-026 — **validé**.

**Invariant :** Real Listen V7.2 (≥90 % serveur) préservé — wallet/royalties/retraits **non modifiés** pendant SPRING 2.

---

## LIENS UTILES

| Document | Rôle |
|---|---|
| `docs/AI_GOVERNANCE.md` | Comportement IA |
| `docs/EXECUTION_LOG.md` | Journal interventions |
| `docs/RAPPORT-CERTIFICATION-GLOBALE.md` | Probes 103/103 |
| `docs/PLAN_CORRECTION_360.md` | Vagues A→E (historique) |
| `docs/PAIEMENTS.md` | Architecture paiements |
| `docs/CDC-v9.0.md` | Spec produit |
| `docs/streaming/SPRING_2_PROGRAM.md` | Programme Streaming Runtime Enterprise |
| `docs/streaming/STATE_MACHINE.md` | Machines d'état Playback + Session (v2.1.0) |
| `docs/streaming/DOMAIN_EVENTS.md` | Catalogue 38 Domain Events (v2.1.0) |
| `docs/streaming/SEQUENCE_DIAGRAMS.md` | Scénarios SEQ-001→SEQ-026 (v1.1.0) |
| `docs/DOMAIN_MAP.md` | Cartographie domaines |
| `docs/DEPENDENCY_RULES.md` | Règles de couplage |
| `docs/ADR/` | Décisions architecture |
| `CLAUDE.md` | Gouvernance fondatrice |

---

*Audit forensique 360° — observation pure, aucune modification code applicatif — 2026-06-24.*
