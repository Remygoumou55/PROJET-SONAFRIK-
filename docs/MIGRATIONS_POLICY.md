# Politique migrations SQL

> **Audit 360 v4** — **90** migrations appliquées (27 juin 2026)

---

## Règles

1. **Une migration = un objectif** — pas de mega-fichiers > 200 lignes si évitable
2. **Nommage :** `YYYYMMDDHHMMSS_<domaine>_<action>.sql`
3. **Timestamps uniques** — ne jamais réutiliser un `YYYYMMDDHHMMSS` déjà présent
4. **Toujours** `BEGIN;` … `COMMIT;` + RLS policies pour tables nouvelles
5. **Ne jamais** modifier une migration déjà appliquée en prod — créer une migration corrective

## Collisions timestamp historiques (ordre alphabétique Supabase)

| Timestamp | Ordre d'application |
|---|---|
| `20260624160000` | 1. `streaming_session_engine_feature_flags.sql` → 2. `vague_c_likes_separation.sql` |
| `20260624180000` | 1. `performance_flags_safe_defaults.sql` → 2. `streaming_playback_runtime_feature_flags.sql` |
| `20260624200000` | 1. `vague_e_payout_audit_request.sql` → 2. `war_d_stream_analytics_rpc.sql` |
| `20260624210000` | 1. `revenue_destinations_phase2.sql` → 2. `war_d_performance_flags_africa_prefetch.sql` |

**Règle future :** incrémenter la minute (`…01`, `…02`) si deux migrations le même jour.

## Migrations historiques volumineuses

Les fichiers déjà appliqués (ex. certification, streaming OS) restent en place. Le drift est acceptable tant que :

- `supabase db query --linked` confirme l'état
- Les types sont régénérés si schéma change

## Workflow obligatoire

```powershell
supabase db query --linked --file supabase/migrations/<fichier>.sql
supabase db query --linked "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
pnpm build; pnpm lint; pnpm typecheck
```
