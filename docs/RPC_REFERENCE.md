# SONAFRIK — Référence des fonctions RPC Supabase

> Généré le 2026-06-12 · Source : `supabase/migrations/` · Appelants : `packages/api/src/` et `apps/web/src/`

---

## Table des matières

1. [Auth & Onboarding](#1-auth--onboarding)
2. [Identity OS — Profils & Notifications](#2-identity-os--profils--notifications)
3. [Creator OS — Artistes, Labels, Équipes](#3-creator-os--artistes-labels-équipes)
4. [Catalog OS — Albums & Morceaux](#4-catalog-os--albums--morceaux)
5. [Streaming — Sessions & Lecture](#5-streaming--sessions--lecture)
6. [Discovery & Recommandation](#6-discovery--recommandation)
7. [Social — Follows, Likes, Engagement](#7-social--follows-likes-engagement)
8. [Wallet & Abonnements](#8-wallet--abonnements)
9. [Analytics Créateur](#9-analytics-créateur)
10. [Royalties (Admin)](#10-royalties-admin)
11. [Payout (Admin)](#11-payout-admin)
12. [Sécurité & Audit](#12-sécurité--audit)
13. [Helpers internes (triggers)](#13-helpers-internes-triggers)

---

## 1. Auth & Onboarding

### `assign_role_for_account_type(p_user_id, p_account_type, p_assigned_by?)`

**Fichier :** `20250610100000_sprint2_identity_auth.sql`  
**Tables :** `roles`, `user_roles`  
**SECURITY DEFINER :** Oui — attribue un rôle applicatif sans exposer les tables `roles`/`user_roles` directement au client  
**Appelée depuis :** `packages/api/src/auth/auth.repository.ts:46`, `supabase/migrations/20260612100000_rpc_complete_onboarding.sql` (interne)  
**Description :** Attribue le rôle (`auditeur`, `artiste`, `auditeur_artiste`) correspondant au type de compte lors de l'onboarding. Lève une exception si le type est invalide ou si le rôle est introuvable.

---

### `complete_onboarding(p_full_name, p_account_type)`

**Fichier :** `20260612100000_rpc_complete_onboarding.sql`  
**Tables :** `profiles`, `user_roles`  
**SECURITY DEFINER :** Oui — utilise `auth.uid()` côté serveur, impossible à falsifier ; update + attribution de rôle en une seule transaction atomique  
**Appelée depuis :** ⚠️ Non appelée depuis le frontend actuellement (migration récente)  
**Description :** Met à jour le profil (`full_name`, `account_type`, `onboarding_completed=true`) et appelle `assign_role_for_account_type` de façon atomique. Remplace le UPDATE direct du browser sur `profiles`. Retourne le profil mis à jour en JSONB.

---

### `log_audit_event(p_actor_id, p_action, p_entity_type?, p_entity_id?, p_metadata?, ...)`

**Fichier :** `20250610100000_sprint2_identity_auth.sql`  
**Tables :** `audit_logs`  
**SECURITY DEFINER :** Oui — accessible uniquement au `service_role` ; évite tout accès direct des clients à `audit_logs`  
**Appelée depuis :** Migrations (triggers internes), `20260612100000_rpc_complete_onboarding.sql`  
**Description :** Insert bas niveau dans `audit_logs`. Ne peut pas être appelée directement par un client authentifié (REVOKE PUBLIC).

---

### `log_audit_event_authenticated(p_action, p_entity_type?, p_entity_id?, p_metadata?)`

**Fichier :** `20250610100002_sprint2_audit_rpc.sql`  
**Tables :** `audit_logs`  
**SECURITY DEFINER :** Oui — utilise `auth.uid()` comme acteur, accessible aux `authenticated`  
**Appelée depuis :** `packages/api/src/auth/auth.repository.ts:61`, `packages/api/src/catalog/catalog.repository.ts:253`, `packages/api/src/creator/creator.repository.ts:296`, `packages/api/src/identity/identity.repository.ts:190`, `packages/api/src/streaming/streaming.repository.ts:451`  
**Description :** Variante client-safe de `log_audit_event` : injecte `auth.uid()` automatiquement. Utilisée pour tracer les actions utilisateur (soumission vérification, upload, etc.).

---

## 2. Identity OS — Profils & Notifications

### `mark_notification_read(p_notification_id)`

**Fichier :** `20250610110000_sprint3_identity_os.sql`  
**Tables :** `notifications`, `audit_logs`  
**SECURITY DEFINER :** Oui — filtre sur `user_id = auth.uid()` pour garantir qu'un utilisateur ne peut lire que ses propres notifications  
**Appelée depuis :** `packages/api/src/identity/identity.repository.ts:123`  
**Description :** Marque une notification comme lue (`read_at = now()`). Lève une exception si la notification est introuvable, n'appartient pas à l'utilisateur, ou est déjà lue.

---

### `mark_all_notifications_read()`

**Fichier :** `20250610110000_sprint3_identity_os.sql`  
**Tables :** `notifications`, `audit_logs`  
**SECURITY DEFINER :** Oui — opère uniquement sur `user_id = auth.uid()`  
**Appelée depuis :** `packages/api/src/identity/identity.repository.ts:130`  
**Retourne :** `INTEGER` — nombre de notifications marquées lues  
**Description :** Marque en masse toutes les notifications non lues de l'utilisateur courant.

---

### `get_my_recent_activity(p_limit?)`

**Fichier :** `20260611010000_security_hardening.sql`  
**Tables :** `audit_logs` (lecture)  
**SECURITY DEFINER :** Oui — expose uniquement les entrées `actor_id = auth.uid()` ; limite à 100 entrées max  
**Appelée depuis :** ⚠️ Non appelée depuis le frontend actuellement  
**Retourne :** `TABLE(id, action, entity_type, metadata, created_at)`  
**Description :** Journal d'audit personnel de l'utilisateur (20 derniers événements par défaut). Permet à l'utilisateur de détecter des accès suspects sans exposer les logs des autres.

---

## 3. Creator OS — Artistes, Labels, Équipes

### `is_artist_account(p_user_id?)`

**Fichier :** `20250610120000_sprint4_creator_os.sql`  
**Tables :** `profiles` (lecture)  
**SECURITY DEFINER :** Oui — helper stable utilisé dans RLS  
**Appelée depuis :** `packages/api/src/catalog/catalog.service.ts:35`, `packages/api/src/creator/creator.service.ts:41`  
**Retourne :** `BOOLEAN`  
**Description :** Vérifie si un utilisateur a un compte artiste (`artiste` ou `auditeur_artiste`) avec onboarding complété. Utilisée comme garde dans Creator OS et Catalog OS.

---

### `is_creator_member(p_creator_id, p_user_id?)`

**Fichier :** `20250610120000_sprint4_creator_os.sql`  
**Tables :** `creators`, `creator_roles` (lecture)  
**SECURITY DEFINER :** Oui — helper RLS stable  
**Appelée depuis :** Politiques RLS (interne)  
**Retourne :** `BOOLEAN`  
**Description :** Retourne `true` si l'utilisateur est propriétaire ou membre de l'équipe du creator.

---

### `can_manage_creator(p_creator_id, p_user_id?)`

**Fichier :** `20250610120000_sprint4_creator_os.sql`  
**Tables :** `creators`, `creator_roles`, `user_roles` (lecture)  
**SECURITY DEFINER :** Oui — helper RLS stable  
**Appelée depuis :** Politiques RLS (interne)  
**Retourne :** `BOOLEAN`  
**Description :** `true` si l'utilisateur est admin, propriétaire du creator, ou a le rôle `owner`/`manager` dans l'équipe.

---

### `can_edit_creator(p_creator_id, p_user_id?)`

**Fichier :** `20250610120000_sprint4_creator_os.sql`  
**Tables :** `creators`, `creator_roles` (lecture)  
**SECURITY DEFINER :** Oui — helper RLS stable  
**Appelée depuis :** Politiques RLS (interne)  
**Retourne :** `BOOLEAN`  
**Description :** Étend `can_manage_creator` avec le rôle `editor`. Utilisée pour les politiques d'UPDATE sur `artist_profiles`, `albums`, `tracks`.

---

### `is_label_member(p_label_id, p_user_id?)` / `can_manage_label(p_label_id, p_user_id?)`

**Fichier :** `20250610120000_sprint4_creator_os.sql`  
**Tables :** `labels`, `label_members` (lecture)  
**SECURITY DEFINER :** Oui — helpers RLS stables  
**Appelée depuis :** Politiques RLS (interne)  
**Description :** Vérifient l'appartenance et les droits d'administration sur un label.

---

### `ensure_creator_for_current_user()`

**Fichier :** `20250610120000_sprint4_creator_os.sql`  
**Tables :** `creators`, `creator_roles`, `artist_profiles`, `audit_logs`  
**SECURITY DEFINER :** Oui — crée des entités liées sans exposer les tables en écriture directe  
**Appelée depuis :** `packages/api/src/catalog/catalog.repository.ts:18`, `packages/api/src/creator/creator.repository.ts:26`  
**Retourne :** `UUID` — ID du creator  
**Description :** Provisionne le Creator OS pour l'utilisateur courant (idempotent : retourne l'ID existant si déjà créé). Crée `creators`, `creator_roles(owner)`, et `artist_profiles` avec un slug auto-généré.

---

### `submit_creator_verification(p_verification_id)`

**Fichier :** `20250610120000_sprint4_creator_os.sql`  
**Tables :** `creator_verifications`, `audit_logs`  
**SECURITY DEFINER :** Oui — vérifie `can_edit_creator` avant la mise à jour  
**Appelée depuis :** `packages/api/src/creator/creator.repository.ts:284`  
**Description :** Passe une vérification de `draft`/`rejected` → `pending`. Lève une exception si l'utilisateur n'a pas les droits ou si le statut est invalide.

---

### `review_creator_verification(p_verification_id, p_status, p_rejection_reason?)`

**Fichier :** `20250610120000_sprint4_creator_os.sql`  
**Tables :** `creator_verifications`, `audit_logs`  
**SECURITY DEFINER :** Oui — requiert `is_admin(auth.uid())`  
**Appelée depuis :** ⚠️ Non appelée depuis le frontend actuellement  
**Description :** Approuve ou rejette une vérification (admin uniquement). Met à jour `artist_profiles.verified` si approuvé.

---

## 4. Catalog OS — Albums & Morceaux

### `submit_album_for_review(p_album_id)`

**Fichier :** `20250610130000_sprint5_catalog_os.sql`  
**Tables :** `albums`, `audit_logs`  
**SECURITY DEFINER :** Oui — vérifie les droits creator via RLS  
**Appelée depuis :** `packages/api/src/catalog/catalog.repository.ts:238`  
**Description :** Passe un album de `draft`/`rejected` → `pending_review`. Lève une exception si l'album n'a pas de titre ou de pochette.

---

### `review_album_publication(p_album_id, p_status, p_rejection_reason?)`

**Fichier :** `20250610130000_sprint5_catalog_os.sql`  
**Tables :** `albums`, `tracks`, `audit_logs`  
**SECURITY DEFINER :** Oui — requiert `is_admin(auth.uid())`  
**Appelée depuis :** ⚠️ Non appelée depuis le frontend actuellement  
**Description :** Publie ou rejette un album (admin). Si `published`, publie aussi tous les morceaux `pending_review` de l'album.

---

### `submit_track_for_review(p_track_id)`

**Fichier :** `20250610130000_sprint5_catalog_os.sql`  
**Tables :** `tracks`, `audit_logs`  
**SECURITY DEFINER :** Oui — vérifie les droits creator  
**Appelée depuis :** `packages/api/src/catalog/catalog.repository.ts:243`  
**Description :** Passe un morceau de `draft`/`rejected` → `pending_review`.

---

### `search_catalog(p_query, p_limit?, p_offset?, p_type?)`

**Fichier :** `20260612020000_sprint42_search_os_enterprise.sql`  
**Tables :** `tracks`, `albums`, `artist_profiles`, `creators` (lecture)  
**SECURITY DEFINER :** Non (lecture publique filtrée RLS)  
**Appelée depuis :** `packages/api/src/streaming/streaming.repository.ts:279`  
**Description :** Recherche full-text avec `unaccent` sur titres, noms d'artiste et genres. Retourne morceaux et albums publiés. Supporte la pagination via `p_offset`.

---

### `f_unaccent(text)`

**Fichier :** `20260612020000_sprint42_search_os_enterprise.sql`  
**Tables :** Aucune  
**SECURITY DEFINER :** Non  
**Appelée depuis :** Interne à `search_catalog`  
**Description :** Wrapper immutable sur l'extension `unaccent` pour normaliser les accents lors de la recherche. Non appelée directement depuis le frontend.

---

## 5. Streaming — Sessions & Lecture

### `start_stream_session(p_track_id, p_platform?, p_quality_kbps?, p_device_id?, p_total_duration_seconds?)`

**Fichier :** `20250610140000_sprint6_streaming_os.sql` · surchargée dans `20260612010000_sprint41_antifraude_stream_sessions.sql`  
**Tables :** `stream_sessions`, `tracks`  
**SECURITY DEFINER :** Oui — crée une session liée à `auth.uid()` ; vérifie que le morceau est publié  
**Appelée depuis :** `packages/api/src/streaming/streaming.repository.ts:31`  
**Retourne :** `UUID` — ID de session  
**Description :** Démarre une session d'écoute. La version sprint41 ajoute une détection d'anti-fraude (sessions concurrentes, délai minimum entre sessions répétées sur le même morceau).

---

### `update_stream_heartbeat(p_session_id, p_position_seconds)`

**Fichier :** `20250610140000_sprint6_streaming_os.sql`  
**Tables :** `stream_sessions`  
**SECURITY DEFINER :** Oui — filtre sur `user_id = auth.uid()`  
**Appelée depuis :** `packages/api/src/streaming/streaming.repository.ts:43`  
**Description :** Met à jour la position de lecture (heartbeat toutes les ~10s). Calcul de `total_listened_seconds` côté serveur (Real Listen V7.2 — CDC Règle #1).

---

### `complete_stream_session(p_session_id, p_position_seconds, p_total_duration_seconds)`

**Fichier :** `20250610140000_sprint6_streaming_os.sql`  
**Tables :** `stream_sessions`  
**SECURITY DEFINER :** Oui — filtre sur `user_id = auth.uid()`  
**Appelée depuis :** `packages/api/src/streaming/streaming.repository.ts:55`  
**Retourne :** `BOOLEAN` — `true` si écoute valide (≥ 90% de la durée)  
**Description :** Clôture une session et calcule `listen_percentage` côté serveur. Le seuil Real Listen V7.2 est 90% — une écoute en dessous n'est pas comptabilisée pour les royalties.

---

### `toggle_favorite(p_entity_type, p_entity_id)`

**Fichier :** `20250610140000_sprint6_streaming_os.sql`  
**Tables :** `favorites`  
**SECURITY DEFINER :** Oui — opère sur `user_id = auth.uid()`  
**Appelée depuis :** `packages/api/src/streaming/streaming.repository.ts:217`, `packages/api/src/social/social.repository.ts:18,48`  
**Retourne :** `BOOLEAN` — `true` = ajouté, `false` = retiré  
**Description :** Toggle atomique : si le favori existe → DELETE, sinon → INSERT (ON CONFLICT DO NOTHING). `entity_type` : `track`, `album`, `artist`.

---

### `is_favorited(p_entity_type, p_entity_id)`

**Fichier :** `20250610140000_sprint6_streaming_os.sql`  
**Tables :** `favorites` (lecture)  
**SECURITY DEFINER :** Oui — filtre sur `user_id = auth.uid()`  
**Appelée depuis :** `packages/api/src/streaming/streaming.repository.ts:226`, `packages/api/src/social/social.repository.ts:27,57`  
**Retourne :** `BOOLEAN`  
**Description :** Vérifie si l'utilisateur courant a mis en favori une entité.

---

### `save_playback_position(p_track_id, p_position_seconds)`

**Fichier :** `20250610140000_sprint6_streaming_os.sql`  
**Tables :** `playback_positions`  
**SECURITY DEFINER :** Oui — upsert sur `(user_id, track_id)` avec `user_id = auth.uid()`  
**Appelée depuis :** `packages/api/src/streaming/streaming.repository.ts:249`  
**Description :** Sauvegarde la position de lecture pour la reprendre plus tard (Continue d'écouter). Upsert idempotent.

---

### `get_playback_position(p_track_id)`

**Fichier :** `20250610140000_sprint6_streaming_os.sql`  
**Tables :** `playback_positions` (lecture)  
**SECURITY DEFINER :** Oui — filtre sur `user_id = auth.uid()`  
**Appelée depuis :** `packages/api/src/streaming/streaming.repository.ts:257`  
**Retourne :** `INTEGER` — secondes (0 si jamais sauvegardé)  
**Description :** Retourne la dernière position sauvegardée pour un morceau.

---

### `has_streaming_permission(p_user_id?)`

**Fichier :** `20250610140000_sprint6_streaming_os.sql` · remplacée dans `20250610150000_sprint8_wallet_os.sql`  
**Tables :** `profiles` (lecture)  
**SECURITY DEFINER :** Oui  
**Appelée depuis :** `packages/api/src/streaming/streaming.repository.ts:445`  
**Retourne :** `BOOLEAN`  
**Description :** Version finale (Sprint Wallet OS) : `true` si l'utilisateur est premium actif OU dans sa période d'essai de 7 jours (CDC Règle #2 — `created_at + 7 days > now()`).

---

### `is_premium_user(p_user_id?)`

**Fichier :** `20250610140000_sprint6_streaming_os.sql` · remplacée dans `20250610150000_sprint8_wallet_os.sql`  
**Tables :** `profiles` (lecture)  
**SECURITY DEFINER :** Oui  
**Appelée depuis :** ⚠️ Non appelée directement depuis le frontend (la vérification passe par `has_streaming_permission`)  
**Retourne :** `BOOLEAN`  
**Description :** Version finale : `true` si `is_premium = true` et `premium_expires_at IS NULL OR premium_expires_at > now()`.

---

## 6. Discovery & Recommandation

### `get_discovery_feed(p_limit?)`

**Fichier :** `20260612050000_sprint60_discovery_engine_enterprise.sql`  
**Tables :** `tracks`, `albums`, `artist_profiles`, `stream_sessions` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/discovery/discovery.repository.ts:12`, `apps/web/src/app/(streaming)/listen/page.tsx:55`  
**Description :** Feed de découverte personnalisé : mix de morceaux tendance, nouveautés et recommandations basées sur l'historique d'écoute.

---

### `get_new_releases(p_type?, p_days?, p_limit?)`

**Fichier :** `20260612050000_sprint60_discovery_engine_enterprise.sql`  
**Tables :** `albums`, `tracks`, `artist_profiles` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/discovery/discovery.repository.ts:20`, `apps/web/src/app/(streaming)/listen/page.tsx:56`  
**Description :** Nouveautés des X derniers jours. `p_type` : `track` | `album`. Filtre sur `publication_status = 'published'`.

---

### `get_suggested_artists(p_limit?)`

**Fichier :** `20260612050000_sprint60_discovery_engine_enterprise.sql`  
**Tables :** `creators`, `artist_profiles` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/discovery/discovery.repository.ts:35`, `apps/web/src/app/(streaming)/listen/page.tsx:57`  
**Description :** Artistes suggérés basés sur les genres favoris de l'utilisateur et la popularité.

---

### `get_suggested_albums(p_limit?)`

**Fichier :** `20260612050000_sprint60_discovery_engine_enterprise.sql`  
**Tables :** `albums`, `artist_profiles` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/discovery/discovery.repository.ts:43`  
**Description :** Albums suggérés pour la section de découverte.

---

### `get_trending_tracks(p_window?, p_limit?)`

**Fichier :** `20260612030000_sprint51_recommendation_os_enterprise.sql`  
**Tables :** `stream_sessions`, `tracks`, `artist_profiles` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/recommendation/recommendation.repository.ts:8`, `apps/web/src/app/(streaming)/listen/page.tsx:54`  
**Description :** Top morceaux sur une fenêtre temporelle (`p_window` : `1d`, `7d`, `30d`). Comptabilise uniquement les écoutes valides (`is_valid_listen = true`).

---

### `get_similar_tracks(p_track_id, p_limit?)`

**Fichier :** `20260612030000_sprint51_recommendation_os_enterprise.sql`  
**Tables :** `tracks`, `albums`, `favorites` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/recommendation/recommendation.repository.ts:17`  
**Description :** Morceaux similaires basés sur les genres, l'artiste et l'historique co-écoute.

---

### `get_recommendations(p_limit?)`

**Fichier :** `20260612030000_sprint51_recommendation_os_enterprise.sql`  
**Tables :** `tracks`, `stream_sessions`, `favorites` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/recommendation/recommendation.repository.ts:26`  
**Description :** Recommandations personnalisées pour l'utilisateur courant.

---

## 7. Social — Follows, Likes, Engagement

### `toggle_follow(p_creator_id)`

**Fichier :** `20260612040000_sprint52_social_engagement_os.sql`  
**Tables :** `follows`  
**SECURITY DEFINER :** Non (opère sous RLS)  
**Appelée depuis :** `packages/api/src/social/social.repository.ts:80`  
**Retourne :** `BOOLEAN` — `true` = suivi, `false` = désabonné  
**Description :** Toggle follow/unfollow d'un artiste.

---

### `is_following(p_creator_id)`

**Fichier :** `20260612040000_sprint52_social_engagement_os.sql`  
**Tables :** `follows` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/social/social.repository.ts:89`  
**Retourne :** `BOOLEAN`  
**Description :** Vérifie si l'utilisateur courant suit un artiste.

---

### `get_follow_count(p_creator_id)`

**Fichier :** `20260612040000_sprint52_social_engagement_os.sql`  
**Tables :** `follows` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/social/social.repository.ts:98`  
**Retourne :** `BIGINT`  
**Description :** Nombre d'abonnés d'un artiste.

---

### `get_like_count(p_entity_type, p_entity_id)`

**Fichier :** `20260612040000_sprint52_social_engagement_os.sql`  
**Tables :** `favorites` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/social/social.repository.ts:36`  
**Retourne :** `BIGINT`  
**Description :** Nombre de favoris pour une entité (`track`, `album`, `artist`).

---

### `get_engagement_stats(p_entity_type, p_entity_id)`

**Fichier :** `20260612040000_sprint52_social_engagement_os.sql`  
**Tables :** `favorites`, `stream_sessions` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/social/social.repository.ts:132`  
**Description :** Statistiques d'engagement agrégées (likes, streams, is_favorited par l'utilisateur courant).

---

### `get_creator_engagement_stats(p_creator_id)`

**Fichier :** `20260612040000_sprint52_social_engagement_os.sql`  
**Tables :** `follows`, `favorites`, `stream_sessions` (lecture)  
**SECURITY DEFINER :** Non  
**Appelée depuis :** `packages/api/src/social/social.repository.ts:148`  
**Description :** Stats d'engagement globales d'un artiste (followers, total likes, total streams).

---

## 8. Wallet & Abonnements

### `get_wallet_balance(p_user_id?)`

**Fichier :** `20250610150000_sprint8_wallet_os.sql`  
**Tables :** `wallets` (lecture)  
**SECURITY DEFINER :** Oui — `STABLE`, retourne uniquement le solde  
**Appelée depuis :** `packages/api/src/wallet/wallet.service.ts:89`  
**Retourne :** `NUMERIC` — solde en GNF  
**Description :** Retourne le solde du portefeuille. Utilise `COALESCE(balance_gnf, 0)`.

---

### `topup_wallet(p_amount_gnf, p_payment_method, p_payment_reference?, p_description?)`

**Fichier :** `20260612000000_sprint33_topup_wallet_rpc.sql`  
**Tables :** `wallets`, `transactions`, `wallet_ledger`  
**SECURITY DEFINER :** Oui — SELECT FOR UPDATE, transaction ACID complète, idempotence sur `payment_reference`  
**Appelée depuis :** `packages/api/src/wallet/wallet.service.ts:117`  
**Retourne :** `JSONB` — `{success, transaction_id, new_balance_gnf, idempotent}`  
**Description :** Recharge atomique du portefeuille. Méthodes acceptées : `orange_money`, `mtn_momo`, `wave`, `card`, `internal`. Minimum 1 000 GNF. Protège contre le double crédit (idempotence par `payment_reference`).

---

### `subscribe_premium(p_plan_type?)`

**Fichier :** `20250610150000_sprint8_wallet_os.sql`  
**Tables :** `wallets`, `wallet_ledger`, `profiles`  
**SECURITY DEFINER :** Oui — débit portefeuille + activation premium en une transaction  
**Appelée depuis :** `packages/api/src/wallet/wallet.service.ts:142`  
**Retourne :** `JSONB` — `{success, expires_at, amount_debited_gnf, plan_type}`  
**Description :** Souscrit ou prolonge un abonnement premium. `monthly` : 50 000 GNF · `annual` : 480 000 GNF (CDC Règle #2). Lève `insufficient_balance` si le solde est insuffisant.

---

### `add_payout_account(p_type, p_display_name, p_account_holder_name, p_phone_number?, p_iban?, p_bank_name?, p_is_default?)`

**Fichier :** `20250610150000_sprint8_wallet_os.sql`  
**Tables :** `payout_accounts`  
**SECURITY DEFINER :** Oui  
**Appelée depuis :** `packages/api/src/wallet/wallet.service.ts:161`  
**Retourne :** `UUID` — ID du compte de paiement  
**Description :** Enregistre un compte de retrait (Orange Money, MTN, IBAN). Si `is_default = true`, déclasse les autres comptes.

---

### `request_withdrawal(p_payout_account_id, p_amount_gnf)`

**Fichier :** `20250610150000_sprint8_wallet_os.sql`  
**Tables :** `wallets`, `wallet_ledger`, `withdrawals`  
**SECURITY DEFINER :** Oui — SELECT FOR UPDATE, réservation immédiate du solde  
**Appelée depuis :** `packages/api/src/wallet/wallet.service.ts:179`  
**Retourne :** `UUID` — ID du retrait  
**Description :** Crée une demande de retrait. Minimum 5 000 GNF. Débite immédiatement le solde (réservation) et crée une entrée ledger immuable.

---

## 9. Analytics Créateur

> Toutes ces fonctions : **SECURITY DEFINER · Non**, appelées sous RLS · `_assert_creator_owner` vérifie que `auth.uid()` est bien le propriétaire.

### `get_creator_stream_stats(p_creator_id)`

**Fichier :** `20260612060000_sprint70_creator_analytics_pro.sql`  
**Appelée depuis :** `packages/api/src/analytics/analytics.repository.ts:15`  
**Retourne :** `CreatorStreamStats` — streams totaux, uniques, durée moyenne, croissance  
**Description :** Vue synthétique des streams du créateur (30 derniers jours vs période précédente).

---

### `get_creator_stream_timeline(p_creator_id, p_days)`

**Fichier :** `20260612060000_sprint70_creator_analytics_pro.sql`  
**Appelée depuis :** `packages/api/src/analytics/analytics.repository.ts:27`  
**Retourne :** `TABLE` — `{date, stream_count, unique_listeners}`  
**Description :** Série temporelle quotidienne pour le graphe d'évolution.

---

### `get_creator_top_tracks(p_creator_id, p_limit)`

**Fichier :** `20260612060000_sprint70_creator_analytics_pro.sql`  
**Appelée depuis :** `packages/api/src/analytics/analytics.repository.ts:39`  
**Description :** Top N morceaux du créateur classés par streams valides (30 jours).

---

### `get_creator_top_albums(p_creator_id, p_limit)`

**Fichier :** `20260612060000_sprint70_creator_analytics_pro.sql`  
**Appelée depuis :** `packages/api/src/analytics/analytics.repository.ts:51`  
**Description :** Top N albums du créateur classés par streams valides.

---

### `get_creator_audience_stats(p_creator_id)`

**Fichier :** `20260612060000_sprint70_creator_analytics_pro.sql`  
**Appelée depuis :** `packages/api/src/analytics/analytics.repository.ts:60`  
**Description :** Répartition géographique, démographique et par plateforme de l'audience.

---

### `get_creator_revenue_stats(p_creator_id)`

**Fichier :** `20260612060000_sprint70_creator_analytics_pro.sql`  
**Appelée depuis :** `packages/api/src/analytics/analytics.repository.ts:69`  
**Description :** Revenus royalties du créateur — total distribué, en attente, taux moyen par stream.

---

## 10. Royalties (Admin)

> Toutes ces fonctions requièrent `_assert_admin()` → `is_admin(auth.uid())`.

### `open_royalty_cycle(p_period_start, p_period_end, ...)`

**Fichier :** `20260612070000_sprint80_royalty_engine_enterprise.sql`  
**Tables :** `royalty_cycles`  
**Appelée depuis :** `packages/api/src/royalties/royalty.repository.ts:19`  
**Description :** Ouvre un nouveau cycle de royalties pour une période donnée (admin uniquement).

---

### `calculate_royalties(p_cycle_id)`

**Fichier :** `20260612070000_sprint80_royalty_engine_enterprise.sql`  
**Tables :** `royalty_cycles`, `royalty_allocations`, `stream_sessions`  
**Appelée depuis :** `packages/api/src/royalties/royalty.repository.ts:33`  
**Description :** Calcule les royalties par creator sur la base des streams valides du cycle. Répartit le fonds selon les parts de marché.

---

### `distribute_royalties(p_cycle_id)`

**Fichier :** `20260612070000_sprint80_royalty_engine_enterprise.sql`  
**Tables :** `royalty_allocations`, `wallets`, `wallet_ledger`  
**Appelée depuis :** `packages/api/src/royalties/royalty.repository.ts:42`  
**Description :** Distribue les royalties calculées vers les portefeuilles creators. Transaction atomique sur tous les créateurs du cycle.

---

### `get_royalty_cycle_summary(p_cycle_id)`

**Fichier :** `20260612070000_sprint80_royalty_engine_enterprise.sql`  
**Appelée depuis :** `packages/api/src/royalties/royalty.repository.ts:51`  
**Description :** Résumé d'un cycle : montant total, nombre de créateurs, statut.

---

### `get_creator_royalty_history(p_creator_id, p_limit?)`

**Fichier :** `20260612070000_sprint80_royalty_engine_enterprise.sql`  
**Appelée depuis :** `packages/api/src/royalties/royalty.repository.ts:63`  
**Description :** Historique des versements royalties d'un créateur (visible aussi par le créateur lui-même via RLS).

---

### `get_active_royalty_cycle()`

**Fichier :** `20260612070000_sprint80_royalty_engine_enterprise.sql`  
**Appelée depuis :** `packages/api/src/royalties/royalty.repository.ts:72`  
**Description :** Retourne le cycle royalties actuellement ouvert (ou `NULL` si aucun).

---

## 11. Payout (Admin)

> Toutes ces fonctions opèrent sur la table `withdrawals` et requièrent des droits admin.

### `approve_payout_request(p_withdrawal_id)`

**Fichier :** `20260612080000_sprint90_enterprise_payout_engine.sql`  
**Tables :** `withdrawals`  
**Appelée depuis :** `packages/api/src/payout/payout.repository.ts:12`  
**Description :** Approuve un retrait → passe en `approved`.

---

### `reject_payout_request(p_withdrawal_id, p_reason)`

**Fichier :** `20260612080000_sprint90_enterprise_payout_engine.sql`  
**Tables :** `withdrawals`, `wallets`, `wallet_ledger`  
**Appelée depuis :** `packages/api/src/payout/payout.repository.ts:24`  
**Description :** Rejette un retrait et rembourse le solde réservé.

---

### `process_payout_request(p_withdrawal_id, p_batch_id?)`

**Fichier :** `20260612080000_sprint90_enterprise_payout_engine.sql`  
**Tables :** `withdrawals`, `payout_batches`  
**Appelée depuis :** `packages/api/src/payout/payout.repository.ts:36`  
**Description :** Marque le retrait comme en cours de traitement (intégration paiement mobile money).

---

### `mark_payout_paid(p_withdrawal_id, p_reference)`

**Fichier :** `20260612080000_sprint90_enterprise_payout_engine.sql`  
**Tables :** `withdrawals`  
**Appelée depuis :** `packages/api/src/payout/payout.repository.ts:48`  
**Description :** Confirme le paiement effectif avec la référence de transaction externe.

---

### `cancel_payout_request(p_withdrawal_id, p_reason?)`

**Fichier :** `20260612080000_sprint90_enterprise_payout_engine.sql`  
**Tables :** `withdrawals`, `wallets`, `wallet_ledger`  
**Appelée depuis :** `packages/api/src/payout/payout.repository.ts:60`  
**Description :** Annule un retrait et rembourse le solde réservé.

---

### `get_user_payouts(p_limit?)` · `get_payout_summary()` · `get_admin_payout_queue(p_status, p_limit)` · `create_payout_batch(p_name, p_notes?)`

**Fichier :** `20260612080000_sprint90_enterprise_payout_engine.sql` (lignes 400+)  
**Appelées depuis :** `packages/api/src/payout/payout.repository.ts:69,78,87,96`  
**Description :**
- `get_user_payouts` — historique des retraits de l'utilisateur courant
- `get_payout_summary` — résumé admin : montants en attente, approuvés, payés
- `get_admin_payout_queue` — file d'attente admin filtrée par statut
- `create_payout_batch` — crée un lot de paiement pour traitement groupé

---

## 12. Sécurité & Audit

### `is_admin(p_user_id)`

**Fichier :** `20250610100001_sprint2_rls_policies.sql`  
**Tables :** `user_roles`, `roles` (lecture)  
**SECURITY DEFINER :** Oui — helper `STABLE` utilisé dans toutes les politiques RLS admin  
**Appelée depuis :** Politiques RLS (interne), `can_manage_creator`, `can_manage_label`, `review_*`  
**Description :** Vérifie si un utilisateur a le rôle `admin`. Renforcé dans sprint8 avec `SET search_path = public` (prévient le search_path hijacking).

---

### `has_permission(p_user_id, p_permission_code)`

**Fichier :** `20260611010000_security_hardening.sql`  
**Tables :** `user_roles`, `role_permissions`, `permissions` (lecture)  
**SECURITY DEFINER :** Oui — `STABLE`, accessible aux `authenticated`  
**Appelée depuis :** ⚠️ Non appelée depuis le frontend actuellement  
**Description :** Vérification déclarative fine des permissions (ex. `catalog.publish`, `wallet.admin`). Prévu pour remplacer les vérifications de rôle hardcodées.

---

## 13. Helpers internes (triggers)

> Ces fonctions ne sont **jamais appelées directement** depuis le frontend — elles sont exécutées par des triggers PostgreSQL.

| Fonction | Trigger sur | Description |
|---|---|---|
| `set_updated_at()` | Toutes les tables avec `updated_at` | Met `updated_at = now()` avant chaque UPDATE |
| `prevent_audit_logs_mutation()` | `audit_logs` UPDATE/DELETE | Lève une exception — `audit_logs` est INSERT-only (Règle #6) |
| `prevent_stream_events_mutation()` | `stream_events` UPDATE/DELETE | Immuabilité des événements de stream |
| `fill_stream_event_track_id()` | `stream_events` INSERT | Dénormalise `track_id` depuis la session |
| `prevent_wallet_ledger_mutation()` | `wallet_ledger` UPDATE/DELETE | Ledger financier immuable |
| `handle_new_user()` | `auth.users` INSERT | Crée le profil dans `public.profiles` |
| `handle_new_user_preferences()` | `profiles` INSERT | Crée `user_preferences` + notification bienvenue |
| `create_wallet_for_new_profile()` | `profiles` INSERT | Crée le portefeuille dans `wallets` |
| `update_playlist_track_count()` | `playlist_tracks` INSERT/DELETE | Maintient `playlists.track_count` à jour |

---

## Résumé — RPCs non utilisées actuellement

| Fonction | Raison supposée |
|---|---|
| `complete_onboarding` | Migration récente — frontend encore sur l'ancien flux |
| `review_creator_verification` | Interface admin non encore implémentée |
| `review_album_publication` | Interface admin non encore implémentée |
| `has_permission` | Prévue pour remplacement futur de `is_admin` checks |
| `get_my_recent_activity` | Page "Sécurité du compte" non encore implémentée |
| `is_premium_user` | La vérification passe par `has_streaming_permission` |

---

*Document maintenu manuellement — mettre à jour à chaque ajout de migration contenant `CREATE OR REPLACE FUNCTION`.*
