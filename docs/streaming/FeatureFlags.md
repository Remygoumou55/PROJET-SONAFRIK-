# Streaming Runtime — Feature Flags

Progressive rollout — pattern identique Publication Platform Phase 5.

**Tous flags `enabled = false` par défaut en production.**

## Flags

| Flag DB | Sous-phase | Comportement si ON |
|---|---|---|
| `streaming_runtime_enabled` | 2.1 | `StreamingApplicationService` actif (shell) |
| `streaming_session_engine_enabled` | 2.2 | Session state machine remplace RPC direct |
| `streaming_playback_engine_enabled` | 2.3 | Playback Engine gère URLs + qualité |
| `streaming_analytics_engine_enabled` | 2.4 | Analytics Engine remplace RPC legacy |
| `streaming_antifraud_engine_enabled` | 2.5 | Anti-Fraud Engine scoring actif |
| `stream_ledger_enabled` | 2.6 | Écriture `stream_ledger_entries` sur valid listen |
| `streaming_mvp_integration_enabled` | 2.8 | `StreamingIntegrationService` route tout le flux |

## Matrice comportement (2.8)

| runtime | session | playback | antifraud | ledger | integration | Path |
|---|---|---|---|---|---|---|
| off | * | * | * | * | * | **Legacy 100 %** |
| on | off | off | off | off | off | Runtime dry-run log only |
| on | on | off | off | off | off | Session engine + legacy playback |
| on | on | on | on | on | on | **Full runtime** |

## Rollout recommandé

```
Staging:
  1. streaming_runtime_enabled
  2. streaming_session_engine_enabled
  3. streaming_playback_engine_enabled
  4. streaming_antifraud_engine_enabled
  5. stream_ledger_enabled (verify reconciliation)
  6. streaming_analytics_engine_enabled
  7. streaming_mvp_integration_enabled

Production canary:
  Step 2 → 1% users → 24h → 10% → 100%
  Monitor: valid_listen rate, fraud rate, p95 heartbeat
```

## Rollback (< 1 minute)

```sql
UPDATE public.feature_flags
SET enabled = false, updated_at = now()
WHERE name LIKE 'streaming_%' OR name = 'stream_ledger_enabled';
```

Effet : prochain `startStream()` utilise `StreamingService` legacy.

## Migration SQL (à exécuter en 2.1)

Fichier proposé : `supabase/migrations/YYYYMMDDHHMMSS_streaming_runtime_feature_flags.sql`

```sql
INSERT INTO public.feature_flags (name, enabled, description) VALUES
  ('streaming_runtime_enabled', false, 'Active Streaming Application + Runtime shell'),
  ('streaming_session_engine_enabled', false, 'Session state machine engine'),
  ('streaming_playback_engine_enabled', false, 'Playback runtime engine'),
  ('streaming_analytics_engine_enabled', false, 'Streaming analytics engine'),
  ('streaming_antifraud_engine_enabled', false, 'Anti-fraud scoring engine'),
  ('stream_ledger_enabled', false, 'Financial ledger for valid listens'),
  ('streaming_mvp_integration_enabled', false, 'Full MVP integration bridge')
ON CONFLICT (name) DO NOTHING;
```

## Télémétrie flags

`StreamingIntegrationService` enregistre :
- `recordFlagCheck()`
- `recordLegacyFallback()`
- `recordRuntimeSuccess()` / `recordRuntimeFailure()`

Mirror : `packages/api/src/streaming/observability/streaming-telemetry.ts` (à créer en 2.1).

## Code resolver

Proposé : `packages/api/src/streaming/integration/feature-flags.ts`  
Pattern : copie adaptée de `publication/integration/feature-flags.ts`.
