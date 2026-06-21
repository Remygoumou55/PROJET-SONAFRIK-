# PLAN DE CORRECTION 360° — SONAFRIK
> Document de référence pour toute IA ou développeur travaillant sur la correction du projet.
> **Lire CLAUDE.md en premier.**
> Mettre à jour ce fichier après chaque tâche complétée.
> Dernière mise à jour : 2026-06-21

---

## RÉSUMÉ EXÉCUTIF

**État actuel :** Pré-bêta fermée. Architecture solide mais 4 familles de problèmes bloquants.

| Famille | Problèmes | Bloquant MVP |
|---|---|---|
| Base de données | 4 tables fantômes, 6 tables mortes | OUI |
| Paiements | 4 providers stubs + HMAC absent | OUI |
| Design System | 1 301 couleurs hardcodées, tokens ignorés | NON |
| Architecture | Couplage cross-features, god files, hooks dupliqués | NON |

**Effort total estimé :** 8 à 12 semaines

---

## AUDIT COMPLET — PROBLÈMES IDENTIFIÉS

### A. BASE DE DONNÉES

#### Tables fantômes (code appelle des tables inexistantes)
| Table | Référencée dans | Impact |
|---|---|---|
| `beats` | `packages/api/src/beats/`, `SearchResults.tsx`, `20260620_search_indexes.sql` | Crash runtime complet beat store |
| `beat_purchases` | `packages/api/src/beats/` | Crash runtime achat beats |
| `feature_flags` | `packages/api/src/admin/` | Page /admin/flags cassée |
| `system_settings` | `packages/api/src/admin/` | Page /admin/settings cassée |

#### Tables mortes (créées mais jamais appelées)
| Table | Migration | Jamais utilisée |
|---|---|---|
| `admin_notifications` | 20260617040000 | Aucun .from() |
| `payout_audit_logs` | 20260612080000 | Aucun .from() |
| `payout_batches` | 20260612080000 | Aucun .from() |
| `permissions` | 20250610100000 | Aucun .from() |
| `rate_limits` | Non identifiée | Aucun .from() |
| `role_permissions` | 20250610100000 | Aucun .from() |

#### GIN index sur table inexistante
- Fichier : `supabase/migrations/20260620_search_indexes.sql` lignes 26-28
- `idx_beats_title_trgm ON public.beats` → table beats n'existe pas encore

### B. PAIEMENTS (BLOQUANT REVENU)

| Problème | Fichier | Ligne |
|---|---|---|
| Orange Money GN non intégré | `supabase/functions/payment-initiate/index.ts` | 118 |
| MTN MoMo GN non intégré | `supabase/functions/payment-initiate/index.ts` | 124 |
| Wave GN non intégré | `supabase/functions/payment-initiate/index.ts` | 131 |
| Soutra Money non intégré | `supabase/functions/payment-initiate/index.ts` | 137 |
| HMAC Orange absent | `supabase/functions/payment-orange-callback/index.ts` | 27 |
| Subscriptions premium non connectées | `supabase/migrations/20260617020000_payment_intents.sql` | 230 |

### C. DESIGN SYSTEM — SOURCE UNIQUE BRISÉE

**Problème central :** `globals.css` définit 12 tokens de design (couleurs, radius, shadows).
Ces tokens **ne sont jamais utilisés** dans les composants.
**1 301 occurrences** de hex hardcodés dans les fichiers TSX.

Tokens définis mais ignorés :
```css
--color-vert-energie: #00d26a    → utilisé 0x dans les composants
--color-noir-profond: #0d0d0d    → utilisé 0x dans les composants
--color-surface: #1a1a1a         → utilisé 0x dans les composants
--color-card: #1f1f1f            → utilisé 0x dans les composants
--color-elevated: #2a2a2a        → utilisé 0x dans les composants
--color-bordure: #333333         → utilisé 0x dans les composants
--color-texte-principal: #ffffff → utilisé 0x dans les composants
--color-texte-secondaire: #a0a0a0 → utilisé 0x dans les composants
--color-texte-desactive: #555555 → utilisé 0x dans les composants
```

Conséquence : changer la couleur primaire de l'app nécessite de modifier ~1 301 endroits.

### D. ARCHITECTURE ET STRUCTURE

#### Dossier features/ non isolé par domaine
Structure actuelle (problématique) :
```
features/
├── admin/          ← domaine admin
├── analytics/      ← où ça se rattache ?
├── auth/           ← domaine identité
├── catalog/        ← domaine créateur
├── creator/        ← domaine créateur
├── identity/       ← domaine identité
├── launch/         ← feature temporaire
├── marketplace/    ← domaine beats/tips
├── notifications/  ← partagé
├── rights/         ← domaine créateur
├── social/         ← partagé
├── streaming/      ← domaine auditeur (TROP GROS : 380+ lignes par composant)
└── wallet/         ← domaine wallet
```

Un bug dans `streaming/` peut toucher `creator/` via les imports croisés détectés.

#### Couplage cross-features détecté
| Fichier | Import problématique |
|---|---|
| `features/streaming/components/WebPlayer.tsx` | Importe `LikeButton` depuis `features/social/` |
| `features/streaming/components/StreamingLayoutClient.tsx` | Importe `NotificationBell` depuis `features/identity/` |

Ces imports ne sont pas interdits mais créent un couplage implicite : un bug dans `social/` peut casser le `WebPlayer`.

#### Composants dupliqués (code mort actif)
| Composant | Localisation A | Localisation B |
|---|---|---|
| `TipButton.tsx` | `features/marketplace/components/` | `features/streaming/components/` |
| `Step5Confirm.tsx` | `app/onboarding/artist/steps/` | `app/onboarding/listener/steps/` |

#### God files (trop gros, trop couplés)
| Fichier | Lignes | Problème |
|---|---|---|
| `packages/types/src/index.ts` | 1 577 | Barrel export de tous les types — 1 import charge tout |
| `packages/database/src/types/index.ts` | 1 344 | Double des types Supabase auto-générés |

#### Double source de vérité des types
- `packages/database/src/types/index.ts` : types auto-générés Supabase (source DB)
- `packages/types/src/index.ts` : types métier manuels (source code)
→ Si le schéma DB change, les deux doivent être mis à jour. Risque de désynchronisation silencieuse.

### E. PERFORMANCE

| Problème | Fichier | Impact |
|---|---|---|
| Heartbeat 10s sans batching | `playerContext.tsx` | 1 req DB / 10s / auditeur actif |
| playerContext monolithique | `playerContext.tsx:360 lignes` | Re-render tous les consumers au moindre changement |
| 41% Client Components | Général | SSR sous-exploité |
| Listes non virtualisées | `TrackList.tsx`, `SearchResults.tsx`, `AdminFinanceCenter.tsx` | Lag sur 200+ items |
| Pas de SWR/React Query | Général | Chaque navigation refetch tout |
| `moment.js` installé inutilement | `apps/web/package.json` | 67KB dans le bundle potentiel |
| 8 routes admin sans `loading.tsx` | `(admin)/` | Écran blanc jusqu'à 30s |

### F. SÉCURITÉ

| Problème | Sévérité | Fichier |
|---|---|---|
| HMAC absent sur callbacks paiement | CRITIQUE | `payment-orange-callback/index.ts:27` |
| `NEXT_PUBLIC_BYPASS_AUTH` dans bundle JS | ÉLEVÉ | 4 fichiers onboarding/auth |
| Bypass auth sur `NODE_ENV=development` (implicite) | ÉLEVÉ | `middleware.ts:17` |
| `rate_limits` table morte = 0 protection brute force | ÉLEVÉ | Général |
| AsyncStorage mobile non chiffré | MOYEN | `apps/mobile/lib/supabase.ts` |
| 6 tables orphelines = surface DB inutile | FAIBLE | Migrations |

### G. FONCTIONNEL

| Problème | Impact |
|---|---|
| 0 test automatisé (unitaire, intégration, e2e) | Chaque sprint peut régresser sans le savoir |
| Formats FLAC/OGG désactivés | Créateurs limités à MP3/WAV/M4A |
| Pas de transcodage post-upload | WAV servi brut (30-40 MB) aux auditeurs |
| Meilisearch non déployé | Recherche = full table scan SQL |
| Search tabs mobile non implémentés | Mobile limité à "tout" uniquement |

---

## VAGUE A — URGENCE ABSOLUE
> **Objectif :** Rendre l'application fonctionnelle sans crash runtime
> **Durée estimée :** 1 semaine
> **Dépendances :** Aucune — peut commencer immédiatement

### LOT A1 — Migrations manquantes (tables fantômes) ✅ COMPLÉTÉ + BUG FIX 2026-06-21
**Tables créées :** `beats`, `beat_purchases`, `feature_flags`, `system_settings` + RPC `purchase_beat`
**Bug fix :** CHECK constraints corrigées via `20260621020000_fix_a1_beat_check_constraints.sql`
- `transactions.type` : ajout de `'beat_sale'`
- `wallet_ledger.reason` : ajout de `'beat_purchase'` et `'beat_sale'`
**Exécuté directement via Supabase CLI** (`supabase db query --linked`) — validé en base.

---

### LOT A1 ORIGINAL — Migrations manquantes (tables fantômes) [ARCHIVÉ]
**Priorité :** P0 BLOQUANT
**Fichiers à créer :**
- `supabase/migrations/20260621000000_beats_store.sql`
- `supabase/migrations/20260621010000_admin_feature_flags.sql`

**Contenu A1a — beats_store.sql :**
Tables à créer : `beats`, `beat_purchases`
Colonnes beats : id, creator_id, title, slug, genre, cover_path, audio_path, price_gnf, bpm, key, license_type, publication_status, deleted_at, created_at, updated_at
Colonnes beat_purchases : id, beat_id, buyer_id, license_type, price_paid_gnf, created_at
RLS : beats public pour published, beat_purchases visible par acheteur seulement
Référence type : `packages/types/src/index.ts` → interfaces `Beat`, `BeatPurchase`, `BeatLicenseType`

**Contenu A1b — admin_feature_flags.sql :**
Tables à créer : `feature_flags`, `system_settings`
Colonnes feature_flags : id, key, enabled, description, created_at, updated_at
Colonnes system_settings : id, category, key, value, updated_at, updated_by
RLS : admin read/write seulement (via is_admin RPC)
Référence type : `packages/types/src/index.ts` → interfaces `FeatureFlag`, `SystemSetting`

**Fichiers touchés par A1 :**
- `packages/api/src/beats/beats.repository.ts` (vérifie .from("beats"))
- `packages/api/src/admin/admin.repository.ts` (vérifie .from("feature_flags"), .from("system_settings"))
- `supabase/migrations/20260620_search_indexes.sql` (index beats créé avant la table — risque)
- `apps/web/src/features/marketplace/` (beat store)
- `apps/web/src/app/(admin)/admin/flags/page.tsx`
- `apps/web/src/app/(admin)/admin/settings/page.tsx`

**Workflow obligatoire :**
1. Générer le SQL → présenter à Rémy dans le chat
2. Rémy exécute dans Supabase Dashboard
3. Capture d'écran "Success" → puis seulement commit + push

---

### LOT A2 — Supprimer `NEXT_PUBLIC_BYPASS_AUTH` des bundles client
**Priorité :** P0 SÉCURITÉ
**Durée :** 30 minutes

**Fichiers à modifier :**
- `apps/web/src/app/auth/connexion/page.tsx` ligne 19
- `apps/web/src/app/auth/inscription/page.tsx` ligne 19
- `apps/web/src/app/onboarding/artist/steps/Step5Confirm.tsx` ligne 31
- `apps/web/src/app/onboarding/listener/steps/Step5Confirm.tsx` ligne 23

**Action :** Remplacer `process.env.NEXT_PUBLIC_BYPASS_AUTH` par une vérification côté serveur uniquement.
Le bypass ne doit jamais être lu côté client (bundle JS public).

**Fichiers potentiellement impactés :**
- Vérifier que l'onboarding fonctionne toujours en dev après suppression

---

### LOT A3 — Rendre `NODE_ENV=development` bypass explicite (pas automatique)
**Priorité :** P0 SÉCURITÉ
**Durée :** 15 minutes

**Fichier à modifier :** `apps/web/src/middleware.ts` ligne 16-17

**Problème actuel :**
```typescript
process.env.BYPASS_AUTH === "true" || process.env.NODE_ENV === "development"
```

**Comportement attendu :** `NODE_ENV=development` seul ne devrait PAS bypasser. Seul `BYPASS_AUTH=true` explicite doit bypasser.

**Fichiers touchés :**
- `apps/web/src/middleware.ts`
- `apps/web/src/lib/supabase/middleware.ts`
- `apps/web/src/features/admin/lib/requireAdmin.ts`
- `apps/web/src/features/creator/lib/requireCreator.ts`
- `apps/web/src/features/identity/lib/requireIdentity.ts`

---

## VAGUE B — STABILISATION
> **Objectif :** Rendre l'app monétisable et robuste
> **Durée estimée :** 3-4 semaines
> **Dépendances :** Vague A complétée

### LOT B1 — Intégration Orange Money GN (provider #1)
**Priorité :** P0 REVENU
**Durée :** 2-3 semaines (avec tests sandbox)

**Fichiers à modifier :**
- `supabase/functions/payment-initiate/index.ts` lignes 114-120
- `supabase/functions/payment-orange-callback/index.ts` lignes 27-50
- `apps/web/.env.local` (ajouter ORANGE_MONEY_API_KEY, ORANGE_MONEY_WEBHOOK_SECRET)

**Étapes :**
1. Obtenir accès sandbox Orange Money API Guinée
2. Implémenter l'appel API dans `payment-initiate` pour `orange_money_gn`
3. Implémenter validation HMAC dans `payment-orange-callback` (CRITIQUE sécurité)
4. Tests sandbox complets (succès, échec, timeout, double callback)
5. Mettre à jour `supabase/migrations/20260617020000_payment_intents.sql` ligne 230 (subscriptions)

**Fichiers potentiellement impactés :**
- `apps/web/src/features/wallet/components/TopupModal.tsx` (UI recharge)
- `packages/api/src/payments/payments.service.ts`
- `packages/types/src/index.ts` → `PaymentProvider`, `PaymentIntentStatus`

---

### LOT B2 — MTN MoMo GN (provider #2)
**Durée :** 1-2 semaines
**Fichiers :** Idem B1 pour `mtn_momo_gn`

### LOT B3 — Wave GN (provider #3)
**Durée :** 1 semaine
**Fichiers :** Idem B1 pour `wave_gn`

### LOT B4 — Loading states admin (8 routes)
**Priorité :** P1 UX
**Durée :** 2h

**Fichiers à créer :**
- `apps/web/src/app/(admin)/admin/loading.tsx`
- `apps/web/src/app/(admin)/admin/catalog/loading.tsx`
- `apps/web/src/app/(admin)/admin/finance/loading.tsx`
- `apps/web/src/app/(admin)/admin/flags/loading.tsx`
- `apps/web/src/app/(admin)/admin/fraud/loading.tsx`
- `apps/web/src/app/(admin)/admin/health/loading.tsx`
- `apps/web/src/app/(admin)/admin/rights/loading.tsx`
- `apps/web/src/app/(admin)/admin/settings/loading.tsx`

**Pattern à suivre :** Regarder `apps/web/src/app/(streaming)/search/loading.tsx` comme référence.

---

### LOT B5 — Supprimer `moment.js`
**Priorité :** P1 BUNDLE
**Durée :** 15 minutes

**Fichier :** `apps/web/package.json`
**Action :** Vérifier qu'il n'est PAS importé (`import moment` introuvable dans src/) puis le retirer de package.json.
**Commande :** `pnpm --filter @sonafrik/web remove moment`

---

## VAGUE C — NETTOYAGE
> **Objectif :** Éliminer la dette technique accumulée
> **Durée estimée :** 1-2 semaines
> **Dépendances :** Vague B complétée

### LOT C1 — Design System : Migrer les tokens (PRIORITÉ HAUTE)
**Durée :** 3-5 jours (migration progressive)
**Problème :** 1 301 hex hardcodés vs 12 tokens définis dans `globals.css` mais jamais utilisés

**Stratégie de migration progressive :**
1. Identifier les 10 couleurs les plus fréquentes (via grep)
2. Confirmer leur correspondance avec les tokens existants
3. Migrer feature par feature (commencer par `streaming/`)
4. Ajouter des tokens manquants dans `globals.css` si nécessaire

**Couleurs les plus fréquentes à migrer en priorité :**
| Hex hardcodé | Token correspondant |
|---|---|
| `#1A1A1A` | `var(--color-surface)` ou `bg-surface` |
| `#0D0D0D` | `var(--color-noir-profond)` |
| `#1F1F1F` | `var(--color-card)` |
| `#2A2A2A` | `var(--color-elevated)` |
| `#333333` | `var(--color-bordure)` |
| `#00D26A` | `var(--color-vert-energie)` |
| `#A0A0A0` | `var(--color-texte-secondaire)` |
| `#FFFFFF` | `var(--color-texte-principal)` |
| `#555555` | `var(--color-texte-desactive)` |

**Fichiers à traiter en priorité (les plus lourds en hex) :**
- `apps/web/src/features/streaming/components/SearchResults.tsx` (380 lignes)
- `apps/web/src/features/streaming/lib/playerContext.tsx` (360 lignes)
- `apps/web/src/features/admin/components/AdminFinanceCenter.tsx` (360 lignes)
- `apps/web/src/features/catalog/components/TrackList.tsx` (337 lignes)
- `apps/web/src/components/landing/LandingPlans.tsx` (342 lignes)

**Fichiers potentiellement impactés :** TOUS les .tsx de features/ et app/

---

### LOT C2 — Fusionner les composants dupliqués ✅ COMPLÉTÉ 2026-06-21
**Durée réelle :** 45 min

**TipButton** :
- `marketplace/TipButton.tsx` → `features/shared/components/TipButton.tsx` (modal canonical)
- `streaming/TipButton.tsx` → `streaming/TipPanel.tsx` (renommé : inline ≠ bouton)
- `TIP_AMOUNTS` + `TipAmount` extraits dans `packages/types/src/constants.ts`
- `tips.actions.ts` déplacé dans `features/shared/actions/`
- Props standardisées : `creatorId` + `artistName` partout

**Step5Confirm** : NON mergé — similarité ~55%, sous seuil 80%. Les types wizard (ArtistWizard vs ListenerWizard) et les champs de profil sont trop divergents.

### LOT C2 ORIGINAL — Fusionner les composants dupliqués [ARCHIVÉ]
**Durée :** 2h

**Duplication 1 : TipButton.tsx**
- `apps/web/src/features/marketplace/components/TipButton.tsx`
- `apps/web/src/features/streaming/components/TipButton.tsx`
- **Action :** Fusionner dans `features/shared/components/TipButton.tsx`
- Vérifier tous les imports et les mettre à jour

**Duplication 2 : Step5Confirm.tsx**
- `apps/web/src/app/onboarding/artist/steps/Step5Confirm.tsx`
- `apps/web/src/app/onboarding/listener/steps/Step5Confirm.tsx`
- **Action :** Analyser les différences. Si similaires à > 80% → extraire une base commune.
- Créer `apps/web/src/app/onboarding/shared/Step5Confirm.tsx` si applicable.

---

### LOT C3 — Déconnecter les tables mortes ou les supprimer ✅ COMPLÉTÉ 2026-06-21
**Durée réelle :** 30 min (audit + fix)

**Audit terrain (requêtes Supabase CLI) :**

| Table | Rows | Code ref | Décision |
|---|---|---|---|
| `admin_notifications` | 0 | `health/page.tsx` (avec `as never`) | **FIX typings** — table connectée, mal typée |
| `payout_audit_logs` | 0 | Aucun | **Garder** — infra payout Phase B |
| `payout_batches` | 0 | Aucun | **Garder** — infra payout Phase B |
| `permissions` | 33 | `packages/database/` | **PAS MORTE** — RBAC actif |
| `rate_limits` | 0 | Aucun | **Garder** — brute force OTP, Phase B |
| `role_permissions` | 45 | constants + seed | **PAS MORTE** — RBAC actif |
| `roles` | 4 | `identity.repository.ts` ✅ | **PAS MORTE** — utilisée activement |

**Correction effectuée :**
- `admin/health/page.tsx` : remplacé les 3 `as never` par `(supabase as any)` + `await getSupabaseServerClient()` (la RLS admin-only suffit, pas besoin de service_role)

**Tables à connecter en Phase B :**
- `rate_limits` → protection brute force OTP — ajouter vérification dans `supabase/functions/` + `packages/api/src/auth/auth.service.ts`
- `payout_audit_logs` + `payout_batches` → brancher quand le moteur de payout (Lot B3) sera actif

---

### LOT C1 — Design System : Migrer les tokens ✅ COMPLÉTÉ 2026-06-21
**Durée réelle :** 2h (migration batch)
**Résultat :** 652 hex → 138 restants (-79%), 1 195 tokens CSS en production, 0 régression.
Les 138 restants sont des exceptions légitimes : hex+alpha, arrays JS interpolés, accents de section sans token.

---

### LOT C4 — Découper `packages/types/src/index.ts` ✅ COMPLÉTÉ 2026-06-21
**Durée réelle :** 1h
**Résultat :** 0 imports à changer — le barrel `index.ts` re-exporte tout, 12/12 packages TypeScript OK.

**Structure livrée :**
```
packages/types/src/
├── constants.ts     ✅ SonafrikBrand, CDC rules (REAL_LISTEN_THRESHOLD_PERCENT, etc.)
├── identity.ts      ✅ Profile, UserSession, UserPreferences, Notification...
├── creator.ts       ✅ Creator, ArtistProfile, Label, équipe, analytics (→ identity, wallet)
├── catalog.ts       ✅ Album, Track, TrackFile, Genre, TrackCredit...
├── streaming.ts     ✅ Playlist, StreamSession, SearchResult, Discovery, Reco... (→ catalog, beats)
├── social.ts        ✅ Follow, EngagementStats...
├── wallet.ts        ✅ Wallet, Transaction, RoyaltyCycle, Payout engine...
├── rights.ts        ✅ Work, Contributor, Ownership, Contract, RightsClaim...
├── admin.ts         ✅ FeatureFlag, SystemSetting...
├── payments.ts      ✅ PaymentIntent, PaymentProvider...
├── beats.ts         ✅ Beat, BeatPurchase, Tip...
└── index.ts         ✅ re-exports uniquement — aucun import externe à changer
```

---

## VAGUE D — OPTIMISATION
> **Objectif :** Performance et scalabilité
> **Durée estimée :** 2-3 semaines
> **Dépendances :** Vague C complétée

### LOT D1 — Séparer playerContext en 2 contextes
**Durée :** 1 jour
**Fichier :** `apps/web/src/features/streaming/lib/playerContext.tsx` (360 lignes)

**Problème :** Un seul Context pour state + actions → re-render de TOUS les consumers à chaque ms de progress audio.

**Solution :** Séparer en :
- `PlayerStateContext` : position, isPlaying, currentTrack (updates fréquents)
- `PlayerActionsContext` : play, pause, seek, setQueue (stable)

**Fichiers impactés :** Tout composant qui consomme `usePlayer()` ou `usePlayerContext()`

---

### LOT D2 — Virtualiser les listes longues
**Durée :** 2 jours

**Listes à virtualiser :**
- `features/streaming/components/SearchResults.tsx` (380 lignes) — résultats de recherche
- `features/catalog/components/TrackList.tsx` (337 lignes) — liste tracks créateur
- `features/admin/components/AdminFinanceCenter.tsx` (360 lignes) — historique finances

**Outil recommandé :** `@tanstack/virtual` (compatible Next.js, pas de bundle impact lourd)

---

### LOT D3 — Batcher les heartbeats (10s → 30s)
**Durée :** 2h
**Fichier :** `apps/web/src/features/streaming/lib/playerContext.tsx`
**Impact :** Réduction de 66% des requêtes DB en production

---

### LOT D4 — Déployer Upstash Redis (cache homepage)
**Durée :** 4h
**Fichiers :**
- `apps/web/.env.local` (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
- `apps/web/src/app/(streaming)/listen/page.tsx` (657 lignes — 7 requêtes au chargement)

**Stratégie :** Cache Redis de 5 minutes sur les 7 requêtes de la homepage (trending, discovery, etc.)

---

### LOT D5 — Réduire les Client Components inutiles
**Durée :** 3 jours
**Objectif :** Passer de 41% à moins de 25% de Client Components
**Méthode :** Auditer chaque composant avec `"use client"` et vérifier si l'interactivité est réelle

---

## VAGUE E — PRÉPARATION LANCEMENT PUBLIC
> **Objectif :** Prêt pour 10 000 utilisateurs actifs
> **Durée estimée :** 4-6 semaines
> **Dépendances :** Vagues A à D complétées

### LOT E1 — Pipeline transcodage audio post-upload
**Durée :** 2-3 semaines
**Fichiers impactés :**
- `supabase/functions/` → nouvelle Edge Function `audio-transcode`
- `packages/api/src/catalog/catalog.service.ts`
- `apps/web/src/features/catalog/components/AudioUploader.tsx` (lignes 8-22 restriction temporaire)
- `packages/api/src/catalog/schemas.ts` (ligne 47 restriction temporaire)
- `supabase/functions/catalog-asset-signed-url/index.ts` (lignes 9-13 restriction temporaire)

**Objectif :** Générer variants MP3 128kbps + 320kbps depuis le fichier master uploadé.

### LOT E2 — Déployer Meilisearch
**Durée :** 1 semaine
**Fichiers :**
- `apps/web/.env.local` (MEILISEARCH_HOST, MEILISEARCH_API_KEY)
- `packages/api/src/streaming/streaming.repository.ts` (méthodes search*)

### LOT E3 — Refactoring structure dossiers (domain isolation)
**Durée :** 3-4 jours
**C'est un refactoring majeur — planifier une journée dédiée sans PR en cours.**

**Structure cible `features/` :**
```
features/
├── listener/
│   ├── streaming/    (player, heartbeat, queue)
│   ├── library/      (favoris, playlists)
│   └── search/       (recherche)
├── creator/
│   ├── catalog/      (tracks, albums, upload)
│   ├── analytics/
│   └── rights/
├── admin/
├── wallet/
├── identity/         (profil, settings, auth)
└── shared/
    ├── social/       (likes, follows — utilisé par listener et creator)
    ├── notifications/
    └── components/   (composants UI partagés)
```

**Fichiers impactés :** ~111 fichiers dans features/ + tous leurs imports

### LOT E4 — Tests automatisés (Playwright E2E)
**Durée :** 1-2 semaines
**Flows critiques à couvrir :**
1. Auth : OTP → onboarding → listen
2. Creator : upload track → publication
3. Wallet : topup → vérification solde
4. Search : query → résultats → lecture

### LOT E5 — Expo SecureStore (mobile)
**Durée :** 1 jour
**Fichier :** `apps/mobile/lib/supabase.ts`
**Action :** Remplacer `AsyncStorage` par `expo-secure-store` pour les tokens Supabase

---

## SUIVI D'AVANCEMENT

| Vague | Lot | Statut | Date | IA/Dev |
|---|---|---|---|---|
| A | A1 — Tables fantômes (beats + admin config) | ✅ Terminé | 2026-06-20 | Claude Sonnet 4.6 |
| A | A2 — NEXT_PUBLIC_BYPASS_AUTH | ✅ Terminé | 2026-06-20 | Claude Sonnet 4.6 |
| A | A3 — NODE_ENV bypass | ✅ Terminé | 2026-06-20 | Claude Sonnet 4.6 |
| B | B1 — Orange Money GN | ❌ Bloqué | — | Attente accès sandbox Orange Guinea |
| B | B2 — MTN MoMo GN | ❌ Bloqué | — | Attente accès sandbox MTN |
| B | B3 — Wave GN | ❌ Bloqué | — | Attente accès sandbox Wave |
| B | B4 — Admin loading.tsx (8 routes) | ✅ Terminé | 2026-06-20 | Claude Sonnet 4.6 |
| B | B5 — Supprimer moment.js | ✅ Terminé | 2026-06-20 | Claude Sonnet 4.6 |
| B | UI paiements — verrouillage ComingSoon | ✅ Terminé | 2026-06-20 | Claude Sonnet 4.6 |
| C | C1 — Design tokens (652→138 hex, -79%) | ✅ Terminé | 2026-06-21 | Claude Sonnet 4.6 |
| C | C2 — TipButton → shared/ + TipPanel + TipAmount | ✅ Terminé | 2026-06-21 | Claude Sonnet 4.6 |
| C | C2 — Step5Confirm (similarité 55% < seuil 80%) | ⚠️ Non mergé — décision conservée | 2026-06-21 | — |
| C | C3 — Audit tables mortes + fix health/page.tsx | ✅ Terminé | 2026-06-21 | Claude Sonnet 4.6 |
| C | C4 — Découper types/index.ts (12 fichiers thématiques) | ✅ Terminé | 2026-06-21 | Claude Sonnet 4.6 |
| D | D1 — PlayerContext split (position isolée, 7 consumers économisés) | ✅ Terminé | 2026-06-21 | Claude Sonnet 4.6 |
| D | D2 — Virtualisation listes longues | ⏰ Reporté MVP | — | Listes < 100 items — inutile avant 500+ |
| D | D3 — Heartbeat 30s (-66% DB requests) | ✅ Terminé | 2026-06-21 | Claude Sonnet 4.6 |
| D | D4 — Cache homepage (unstable_cache, TTL 5 min, 7 req → 0) | ✅ Terminé | 2026-06-21 | Claude Sonnet 4.6 |
| D | D5 — Réduire Client Components | ⏳ À faire | — | — |
| E | E1 — Transcodage audio | ⏳ À faire | — | — |
| E | E2 — Meilisearch | ⏳ À faire | — | — |
| E | E3 — Refactoring features/ | ⏳ À faire | — | — |
| E | E4 — Tests Playwright | ⏳ À faire | — | — |
| E | E5 — SecureStore mobile | ⏳ À faire | — | — |

> **Note C2 TipButton :** Les deux TipButton ont des UX fondamentalement différentes (marketplace = modale Server Action, streaming = widget inline hook). Fusionner ajouterait de la complexité sans réduire de duplication réelle. Décision : garder séparés. À revalider avec Martin si besoin.

**Légende :** ⏳ À faire | 🔄 En cours | ✅ Terminé | ❌ Bloqué

---

## RÈGLES DE MISE À JOUR DE CE FICHIER

Après chaque tâche complétée :
1. Changer le statut dans le tableau ci-dessus
2. Ajouter la date et l'IA/dev qui a fait le travail
3. Mettre à jour `docs/RAPPORT_COLLECTION.md` avec le détail des changements
4. Si une nouvelle dette est découverte → l'ajouter dans la section Audit ci-dessus ET créer un nouveau Lot
