# Vague B — Rollback feature flags

> **40 flags** en production (`feature_flags` table) — juin 2026  
> UI admin : `/admin/flags` (réservé `is_admin()`)

## Principe

Tous les flags **expérimentaux** sont `enabled = false` par défaut en prod.  
Seuls **3 flags MVP** sont actifs en live :

| Flag | enabled | Raison |
|---|---|---|
| `rights_management` | true | Rights OS MVP |
| `search_multi_type` | true | Recherche auditeur |
| `tips_enabled` | true | Pourboires CDC |

## Rollback d'urgence (incident prod)

Exécuter en une transaction :

```sql
BEGIN;

UPDATE public.feature_flags
SET enabled = false, updated_at = now();

UPDATE public.feature_flags
SET enabled = true, updated_at = now()
WHERE name IN ('rights_management', 'search_multi_type', 'tips_enabled');

COMMIT;
```

Vérification :
```sql
SELECT name, enabled FROM feature_flags WHERE enabled = true ORDER BY name;
-- Attendu : 3 lignes
```

## Rollback ciblé (streaming runtime)

Si activation accidentelle des flags `streaming_*` ou `runtime_*` :

```sql
UPDATE public.feature_flags
SET enabled = false, updated_at = now()
WHERE name LIKE 'streaming_%'
   OR name LIKE 'runtime_%'
   OR name LIKE 'performance_%'
   OR name LIKE 'publication_%';
```

## Rollback performance (Africa Mode)

```sql
UPDATE public.feature_flags
SET enabled = false, updated_at = now()
WHERE name LIKE 'performance_%';
```

## Test manuel post-rollback

1. Connexion admin → `/admin/flags`
2. Vérifier que les toggles reflètent la DB (refresh page)
3. `pnpm probe:vague-b-stabilisation` → check `B3-flags-count`
4. Parcours auditeur : `/listen`, `/search`, `/wallet` — pas de régression

## Inventaire complet (40 flags)

### MVP actifs (3)
- `rights_management`
- `search_multi_type`
- `tips_enabled`

### Performance (8) — tous OFF
- `performance_africa_mode_enabled`
- `performance_animation_cdc_compliant_enabled`
- `performance_bundle_split_enabled`
- `performance_lazy_loading_enabled`
- `performance_prefetch_enabled`
- `performance_search_cache_enabled`
- `performance_skeleton_extended_enabled`
- `performance_streaming_ssr_enabled`

### Streaming + runtime (15) — tous OFF
- `streaming_runtime_enabled`
- `streaming_session_engine_enabled`
- `streaming_session_heartbeat_enabled`
- `streaming_session_expiration_enabled`
- `streaming_session_recovery_enabled`
- `streaming_playback_engine_enabled`
- `streaming_playback_signed_url_enabled`
- `streaming_playback_buffer_enabled`
- `streaming_playback_quality_enabled`
- `streaming_playback_recovery_enabled`
- `runtime_application_layer_enabled`
- `runtime_context_enabled`
- `runtime_contracts_enabled`
- `runtime_events_enabled`
- `runtime_ports_enabled`

### Publication orchestrator (3) — tous OFF
- `publication_orchestrator_enabled`
- `publication_persistence_enabled`
- `publication_real_publish_enabled`

### Metadata (1) — OFF
- `metadata_validation_enabled`
- `isrc_reservation_enabled`

### Hors MVP (gelés) — tous OFF
- `beat_store`, `tips`, `awards`, `fan_tribes`, `podcasts`, `ai_music_coach`
- `creator_analytics`, `social_sharing`, `mobile_app`

> Note : `tips` (legacy) et `tips_enabled` coexistent — utiliser `tips_enabled` uniquement.

## Procédure activation progressive (post LIVE CONTROL)

1. Activer **un seul** flag à la fois via `/admin/flags`
2. `pnpm build && pnpm typecheck`
3. Test manuel du parcours impacté
4. Si régression → rollback SQL ciblé ci-dessus
5. Documenter dans `docs/EXECUTION_LOG.md`
