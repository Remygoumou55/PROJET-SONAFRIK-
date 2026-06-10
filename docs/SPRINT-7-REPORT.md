# SPRINT 7 — Migrations SQL + RLS + expo-av

**Date :** 10 Juin 2026  
**Statut :** ✅ LIVRÉ — `pnpm build` · `pnpm lint` · `pnpm typecheck` = **0 erreur**

---

## Résumé exécutif

Sprint 7 rend le Streaming OS (Sprint 6) opérationnel en production. Les 6 tables streaming sont désormais créées en base, sécurisées par RLS, et le lecteur mobile utilise expo-av pour une vraie lecture audio.

---

## Livraisons

### 1. Migration `20250610140000_sprint6_streaming_os.sql`

**6 tables créées :**

| Table | Clé | Particularité |
|-------|-----|---------------|
| `playlists` | UUID | `track_count` dénormalisé, trigger `update_playlist_track_count` |
| `playlist_tracks` | (playlist_id, track_id) | Position ordonnée, trigger de comptage |
| `favorites` | (user_id, entity_type, entity_id) | Polymorphique : track/album/artist/playlist |
| `stream_sessions` | UUID | `listen_percentage NUMERIC(5,2)`, `fraud_flags TEXT[]` |
| `stream_events` | UUID | **INSERT ONLY** — trigger `prevent_stream_events_mutation` bloque UPDATE/DELETE |
| `playback_positions` | (user_id, track_id) | UPSERT via `save_playback_position` |

**Trigger `fill_stream_event_track_id`** — BEFORE INSERT sur `stream_events` : remplit automatiquement `track_id` depuis la session si absent.

**9 RPC functions :**

| Fonction | Description | Seuil |
|----------|-------------|-------|
| `start_stream_session` | Crée une session, vérifie que le track est publié | — |
| `update_stream_heartbeat` | Met à jour `last_heartbeat_at` et `total_listened_seconds` | — |
| `complete_stream_session` | **Calcul Real Listen V7.2** côté serveur | `≥ 90%` |
| `toggle_favorite` | Bascule un favori (retourne bool) | — |
| `is_favorited` | Vérifie si favoris | — |
| `save_playback_position` | UPSERT position de reprise | — |
| `get_playback_position` | Retourne la position sauvegardée | — |
| `has_streaming_permission` | Vérifie l'accès streaming (MVP : tous les authentifiés) | — |
| `is_premium_user` | Premium check (MVP : false, Wallet OS Sprint 8+) | — |

**Storage bucket `audio`** créé — `public: false` — jamais accessible directement (CDC Règle #10).

---

### 2. Migration `20250610140001_sprint6_streaming_rls.sql`

**RLS activé sur les 6 tables** avec politiques granulaires :

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `playlists` | Own + public + admin | Own uniquement | Own ou admin | Own ou admin |
| `playlist_tracks` | Playlists accessibles | Propriétaire playlist | Propriétaire playlist | Propriétaire playlist |
| `favorites` | Own uniquement | Own uniquement | — | Own uniquement |
| `stream_sessions` | Own ou admin | Own uniquement | Own uniquement | — |
| `stream_events` | Own ou admin | Own uniquement | **BLOQUÉ (trigger)** | **BLOQUÉ (trigger)** |
| `playback_positions` | Own uniquement | Own uniquement | Own uniquement | — |

**Storage `audio`** — Politique INSERT/UPDATE/DELETE pour les créateurs selon le chemin `{creator_id}/...`. Le SELECT est réservé aux Edge Functions (service_role) pour la génération d'URLs signées.

**6 nouvelles permissions** :
```
stream:play
stream:playlist:create
stream:playlist:edit
stream:library:manage
stream:analytics:view:own
admin:stream:analytics
```

Assignées automatiquement aux rôles `auditeur`, `artiste`, `auditeur_artiste`, `admin`.

---

### 3. Edge Function `stream-progress` — fix track_id

La session est désormais sélectionnée avec `track_id` pour renseigner correctement `stream_events.track_id`. Le trigger `fill_stream_event_track_id` garantit la cohérence même si le client ne transmet pas l'ID.

---

### 4. expo-av — Lecture audio mobile réelle

**Package ajouté :** `expo-av` dans `@sonafrik/mobile`

**`features/streaming/usePlayer.ts` — refonte complète :**

- `Audio.setAudioModeAsync` — Mode audio : lecture en arrière-plan, mode silencieux iOS
- `Audio.Sound.createAsync` — Chargement et lecture depuis l'URL pré-signée
- `sound.setOnPlaybackStatusUpdate` — Suivi position, durée, fin naturelle
- Heartbeat Real Listen V7.2 toutes les 10s via `getStatusAsync`
- `completeStream()` déclenché automatiquement à la fin naturelle du morceau
- `stop()` appelle `completeStream()` avec la position courante

---

## Validation finale

```
pnpm typecheck   ✅  12/12  — 0 erreur
pnpm lint        ✅  12/12  — 0 erreur
pnpm build       ✅   7/7   — 0 erreur
```

---

## Prérequis déploiement

Pour activer le Streaming OS en production :

```bash
# 1. Appliquer les migrations
supabase db push

# 2. Déployer les Edge Functions
supabase functions deploy stream-start
supabase functions deploy stream-progress
supabase functions deploy stream-complete

# 3. Variables d'environnement Edge Functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<votre_clé>
```

---

## Architecture complète Sprint 6+7

```
supabase/
  migrations/
    20250610140000_sprint6_streaming_os.sql   Tables + RPC
    20250610140001_sprint6_streaming_rls.sql  RLS + Storage + Permissions
  functions/
    stream-start/      URL pré-signée + session (CORRIGÉ)
    stream-progress/   Heartbeat anti-fraude (track_id fixé)
    stream-complete/   Validation Real Listen ≥90%

apps/mobile/
  package.json         + expo-av
  features/streaming/
    usePlayer.ts       Lecture audio réelle (expo-av)
    useSearch.ts       Recherche debounce
    useLibrary.ts      Playlists + favoris
```

---

## Notes pour Sprint 8

- **Wallet OS** : `wallets`, `wallet_ledger` (INSERT ONLY), `transactions`, `withdrawals`, `royalty_cycles`, `royalty_calculations`, `payout_accounts`
- Mettre à jour `is_premium_user()` une fois les abonnements en place
- Mettre à jour `has_streaming_permission()` pour vérifier le statut d'abonnement actif

---

*SONAFRIK · Notre Bien Commun · Sprint 7 livré le 10 Juin 2026*
