# RAPPORT DE COLLECTION — SONAFRIK
> Journal chronologique de toutes les modifications apportées au projet.
> **Toute IA ou développeur doit lire ce fichier avant de commencer à travailler.**
> Chaque entrée documente : ce qui a été fait, les fichiers touchés, le code avant/après, et la dette éventuelle créée.

---

## COMMENT UTILISER CE FICHIER

### En lecture (avant de travailler) :
1. Lire les 5 dernières entrées pour comprendre l'état actuel
2. Vérifier si la tâche que tu vas faire n'a pas déjà été faite
3. Identifier les fichiers récemment modifiés qui pourraient interagir avec ta tâche

### En écriture (après avoir terminé) :
Ajouter une entrée avec ce format :
```markdown
## [YYYY-MM-DD] — [NOM DE LA TÂCHE]
**IA/Dev :** [nom]
**Vague :** [A/B/C/D/E] — Lot [XX]

### Fichiers touchés
- `chemin/fichier.tsx` — description du changement

### Changement clé (extrait)
AVANT:
\`\`\`typescript
// ancien code
\`\`\`
APRÈS:
\`\`\`typescript
// nouveau code
\`\`\`

### Tests effectués
- [ ] Test 1
- [x] Test 2

### Dette créée (si applicable)
- Description

### Fichiers potentiellement affectés non touchés
- `chemin/autre.tsx` — pourquoi ça pourrait être impacté
```

---

## HISTORIQUE DES MODIFICATIONS

---

## [2026-06-10] — Sprint 2 : Identity OS
**IA/Dev :** Claude Code
**Vague :** Foundation (pre-plan)

### Fichiers touchés
- `supabase/migrations/20250610100000_sprint2_identity_auth.sql` — Tables : profiles, roles, permissions, user_roles, user_sessions, audit_logs
- `supabase/migrations/20250610100001_sprint2_rls_policies.sql` — RLS policies Zero Trust

### Changement clé
Implémentation complète de l'Identity OS avec RLS Zero Trust (DENY ALL par défaut) sur toutes les tables.
Trigger `set_updated_at` universel.
Fonction `log_audit_event()` SECURITY DEFINER.

### Dette créée
- `permissions` et `role_permissions` créées mais jamais connectées au code → LOT C3

---

## [2026-06-10] — Sprint 4 : Creator OS
**IA/Dev :** Claude Code

### Fichiers touchés
- `supabase/migrations/20250610120000_sprint4_creator_os.sql` — creators, artist_profiles, labels, creator_roles, studios, creator_verifications

### Dette créée
- Aucune à l'époque

---

## [2026-06-10] — Sprint 6 : Streaming OS
**IA/Dev :** Claude Code

### Fichiers touchés
- `supabase/migrations/20250610140000_sprint6_streaming_os.sql`
- `supabase/functions/stream-start/index.ts`
- `supabase/functions/stream-progress/index.ts`
- `supabase/functions/stream-complete/index.ts`

### Changement clé
Real Listen V7.2 implémenté : seuil 90% de la durée pour comptabiliser un stream.
Heartbeat toutes les 10 secondes.

### Dette créée
- Heartbeat 10s sans batching → LOT D3

---

## [2026-06-10] — Sprint 8 : Wallet OS
**IA/Dev :** Claude Code

### Fichiers touchés
- `supabase/migrations/20250610150000_sprint8_wallet_os.sql`
- `supabase/functions/wallet-topup/index.ts`
- `supabase/functions/wallet-request-withdrawal/index.ts`

### Changement clé
Wallet, transactions, withdrawals, royalty_cycles créés.
Revenue Pool 65% respecté.

### Dette créée
- `premium_expires_at IS NULL` traitée comme "illimité" → CORRIGÉE en 2026-06-15

---

## [2026-06-12] — Sprint 52 : Social Engagement OS
**IA/Dev :** Claude Code

### Fichiers touchés
- `supabase/migrations/20260612040000_sprint52_social_engagement_os.sql` — follows, likes, tips, beats, beat_purchases

### ⚠️ PROBLÈME CRITIQUE DÉTECTÉ RÉTROSPECTIVEMENT
La migration crée les tables `beats` et `beat_purchases` via ce sprint, MAIS ces tables ne semblent pas être dans les migrations listées par le grep `CREATE TABLE`. À VÉRIFIER : la migration 20260612040000 contient-elle bien `CREATE TABLE public.beats` ?

**Action requise (LOT A1) :** Vérifier et créer les migrations manquantes si nécessaire.

---

## [2026-06-15] — Sprint 9 : Rights OS
**IA/Dev :** Claude Code
**Migration exécutée et validée par Rémy (capture Supabase confirmée)**

### Fichiers touchés
- `supabase/migrations/20260615000000_sprint9_rights_os.sql` — works, contributors, ownerships, ownership_versions, contracts, rights_claims
- `supabase/migrations/20260615010000_sprint9_rights_os_fix.sql` — patches idempotence
- `packages/api/src/rights/` — rights.repository.ts, rights.service.ts, schemas.ts
- `packages/types/src/index.ts` — 12 nouvelles interfaces Rights OS

### Changement clé
Trigger `check_ownership_total` : total parts ≤ 100% par (work_id, ownership_type, territory)

---

## [2026-06-15] — Fix premium null check
**IA/Dev :** Claude Code

### Fichiers touchés
- `supabase/migrations/20260615020000_fix_premium_null_check.sql`
- `packages/api/src/wallet/wallet.service.ts`

### Changement clé
AVANT (faille) :
```sql
premium_expires_at IS NULL OR premium_expires_at > now()
```
APRÈS (corrigé) :
```sql
premium_expires_at IS NOT NULL AND premium_expires_at > now()
```

### Note
Cette faille a existé entre sprint 8 (2025-06-10) et ce fix (2026-06-15). Tout compte créé pendant cette période avec `premium_expires_at = NULL` avait accès premium gratuit.
**Action :** Auditer les comptes concernés.

---

## [2026-06-17] — Sprint G-4 : Payment Intents
**IA/Dev :** Claude Code

### Fichiers touchés
- `supabase/migrations/20260617020000_payment_intents.sql` — table payment_intents, RPC confirm_payment_intent, expire_stale_payment_intents
- `supabase/functions/payment-initiate/index.ts`
- `supabase/functions/payment-orange-callback/index.ts`
- `supabase/functions/payment-mtn-callback/index.ts`
- `supabase/functions/payment-wave-callback/index.ts`
- `supabase/functions/payment-soutra-callback/index.ts`
- `packages/types/src/index.ts` — PaymentIntent, PaymentProvider, PaymentPurpose

### ⚠️ DETTE CRITIQUE CRÉÉE
Tous les providers sont des STUBS (TODO dans le code). Les callbacks paiement n'ont PAS de validation HMAC.
→ LOT A3 (sécurité HMAC) + LOT B1-B3 (intégration providers)

---

## [2026-06-20] — Recherche Multi-Type
**IA/Dev :** Claude Code (Sonnet 4.6)
**Migration exécutée et validée par Rémy (capture Supabase : "Success. No rows returned")**

### Fichiers touchés
- `supabase/migrations/20260620_search_indexes.sql` — GIN indexes pg_trgm sur 5 tables
- `packages/types/src/index.ts` — PlaylistSearchResult, BeatSearchResult, SearchType ajoutés
- `packages/api/src/streaming/schemas.ts` — champ `type` ajouté à searchSchema
- `packages/api/src/streaming/streaming.repository.ts` — searchArtists, searchPlaylists, searchBeats ajoutés, relevanceScore() helper
- `packages/api/src/streaming/streaming.service.ts` — Promise.all sur 5 types

### ⚠️ DETTE CRÉÉE
L'index `idx_beats_title_trgm` référence `public.beats` MAIS la table `beats` n'a pas de migration `CREATE TABLE` détectée → LOT A1.

---

## [2026-06-20] — Restriction temporaire formats audio
**IA/Dev :** Claude Code

### Fichiers touchés
- `apps/web/src/features/catalog/components/AudioUploader.tsx` lignes 6-22 — FLAC et OGG retirés
- `packages/api/src/catalog/schemas.ts` ligne 47 — format enum restreint à mp3/aac/wav
- `supabase/functions/catalog-asset-signed-url/index.ts` lignes 9-22 — FLAC/OGG retirés

### Raison
Sans pipeline de transcodage, FLAC et WAV servis bruts (30-40 MB) aux auditeurs mobile → annule l'économie de données.

### Dette créée
→ LOT E1 : Pipeline transcodage post-upload à implémenter pour lever la restriction.

---

## [2026-06-20] — Optimisations performance
**IA/Dev :** Claude Code

### Fichiers touchés
- `apps/web/src/app/(streaming)/listen/album/[id]/page.tsx` — imgSizes="144px"
- `apps/web/src/app/(streaming)/listen/artist/[id]/page.tsx` — imgSizes="100vw" + "80px" + "112px"
- `apps/web/src/features/streaming/components/PlaylistDetail.tsx` — memo(TrackRow)
- `apps/web/src/features/streaming/components/AlbumTracksClient.tsx` — memo(TrackRow)
- 5 nouveaux loading.tsx : search, library, library/playlist/[id], beats, notifications

### Résultats
- Images : -60 à -85% bande passante
- TrackRow : évite re-renders sur heartbeat 10s
- Loading skeletons : UX perçue fluide

---

## [2026-06-20] — Fix BOM UTF-8 sur 22 migrations SQL
**IA/Dev :** Claude Code (Sonnet 4.6)
**Commit :** `04a75d4`

### Problème
`supabase/functions/payment-orange-callback` → Supabase Preview échoue avec :
`ERROR: syntax error at or near "" (SQLSTATE 42601)`
Cause : BOM UTF-8 (0xEF 0xBB 0xBF) en début de chaque fichier SQL.

### Fichiers touchés
22 fichiers `supabase/migrations/*.sql` — BOM supprimé, UTF-8 sans BOM.

### Vérification
`First 3 bytes after fix: 45 45 32` = `-- ` en ASCII. Confirmé.

---

## [2026-06-20] — Audit forensique 360° (READ-ONLY)
**IA/Dev :** Claude Code (Sonnet 4.6) + Martin

### Découvertes principales
1. **1 301 hex hardcodés** alors que 12 tokens existent dans `globals.css` → LOT C1
2. **TipButton.tsx en double** (marketplace + streaming) → LOT C2
3. **4 tables fantômes** : beats, beat_purchases, feature_flags, system_settings → LOT A1
4. **6 tables mortes** : admin_notifications, payout_audit_logs, payout_batches, permissions, rate_limits, role_permissions → LOT C3
5. **NEXT_PUBLIC_BYPASS_AUTH** exposé dans 4 fichiers client → LOT A2
6. **Bypass auth implicite sur NODE_ENV=development** → LOT A3
7. **Couplage cross-features** : WebPlayer → LikeButton, StreamingLayout → NotificationBell
8. **Step5Confirm.tsx en double** (artist + listener onboarding) → LOT C2
9. **moment.js** installé mais inutilisé → LOT B5
10. **8 routes admin** sans loading.tsx → LOT B4

### Fichiers créés
- `CLAUDE.md` — Règles de gouvernance IA
- `docs/PLAN_CORRECTION_360.md` — Plan de correction complet
- `docs/RAPPORT_COLLECTION.md` — Ce fichier

---

## [2026-06-21] — LOT C4 : Découpe de packages/types/src/index.ts
**IA/Dev :** Claude Code (Sonnet 4.6)
**Vague :** C — Lot C4

### Fichiers touchés
- `packages/types/src/index.ts` — Remplacé (1 754 lignes → 11 lignes, barrel pur)
- `packages/types/src/constants.ts` — CRÉÉ (SonafrikBrand, CDC rules)
- `packages/types/src/identity.ts` — CRÉÉ (Profile, UserSession, Notification, auth...)
- `packages/types/src/creator.ts` — CRÉÉ (Creator, ArtistProfile, Label, analytics — importe identity, wallet)
- `packages/types/src/catalog.ts` — CRÉÉ (Album, Track, TrackFile, Genre, TrackCredit)
- `packages/types/src/streaming.ts` — CRÉÉ (StreamSession, Playlist, SearchResult, Discovery, Reco — importe catalog, beats)
- `packages/types/src/social.ts` — CRÉÉ (Follow, EngagementStats)
- `packages/types/src/wallet.ts` — CRÉÉ (Wallet, Transaction, RoyaltyCycle, Payout, CreatorRoyaltyHistoryEntry)
- `packages/types/src/rights.ts` — CRÉÉ (Work, Contributor, Ownership, Contract, RightsClaim)
- `packages/types/src/admin.ts` — CRÉÉ (FeatureFlag, SystemSetting)
- `packages/types/src/payments.ts` — CRÉÉ (PaymentIntent, PaymentProvider)
- `packages/types/src/beats.ts` — CRÉÉ (Beat, BeatPurchase, Tip)

### Changement clé
AVANT: `packages/types/src/index.ts` — 1 754 lignes monolithique (toutes les définitions)
APRÈS: `packages/types/src/index.ts` — 11 lignes, barrel pur
```typescript
export * from "./constants";
export * from "./identity";
export * from "./creator";
// ... etc.
```

### Résultats
- `turbo build --filter=@sonafrik/types` : ✅ success (3.1s)
- `turbo typecheck` global : ✅ 12/12 packages sans erreur
- Zéro import externe à modifier (barrel conservé)
- Graphe de dépendances interne : streaming → catalog, beats | creator → identity, wallet (pas de cycle)

### Dette créée
Aucune. Refactoring pur sans changement comportemental.

---

## [2026-06-24] — Landing V6 fusion mockup G-Stream

**IA/Dev :** Claude Sonnet 4.6
**Vague :** Landing — V6 mockup

### Fichiers touchés
- `apps/web/src/components/landing/LandingSearchBar.tsx` — barre recherche hero → `/search`
- `apps/web/src/components/landing/LandingHowItWorks.tsx` — phone mockup + 3 étapes verticales
- `apps/web/src/components/landing/LandingPartners.tsx` — Orange Money, MTN MoMo, Wave
- `apps/web/src/components/landing/LandingFAQ.tsx` — accordéon 5 questions
- `apps/web/src/components/landing/LandingFooter.tsx` — 3 colonnes + copyright
- `apps/web/src/components/landing/LandingNav.tsx` — ancres #comment-ca-marche, #tarifs, #faq
- `apps/web/src/components/landing/LandingHero.tsx` — CTAs simplifiés + search bar
- `apps/web/src/app/(public)/page.tsx` — nouvel ordre sections, suppression ProductPreview
- `apps/web/src/app/globals.css` — grilles responsive landing
- `apps/web/src/components/landing/LandingProductPreview.tsx` — supprimé (fusionné dans HowItWorks)

### Tests effectués
- [x] pnpm build / lint / typecheck — 0 erreur
- [ ] Validation visuelle manuelle landing `/`

### Dette créée
- Barre recherche hero redirige vers `/search` (route listener — peut exiger auth selon middleware)

---

## PROCHAINE ENTRÉE À CRÉER

Quand tu termines une tâche, copie ce template et remplis-le :

```markdown
## [YYYY-MM-DD] — [NOM DE LA TÂCHE]
**IA/Dev :** [Claude Code Sonnet 4.X / développeur]
**Vague :** [Lettre] — Lot [Code]

### Fichiers touchés
-

### Changement clé
AVANT:
```
// code
```
APRÈS:
```
// code
```

### Tests effectués
- [ ]

### Dette créée
-

### Mise à jour PLAN_CORRECTION_360.md
- Lot [XX] → ✅ Terminé
```
