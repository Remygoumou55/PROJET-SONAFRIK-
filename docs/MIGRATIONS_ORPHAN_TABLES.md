# Migrations & tables orphelines — inventaire

> Dernière mise à jour : 30 juin 2026  
> Projet : `cxjpburiiazzvlczzupy` — **114+ migrations**

## Tables peu/pas utilisées par `packages/api`

| Table | Statut | Action MVP |
|---|---|---|
| `creators` | Doublon `artist_profiles` | Ne pas étendre — roadmap consolidation |
| `studios` | Feature non implémentée | Gelée |
| `creator_roles` | RBAC créateur non branché | Gelée |
| `label_members` | Partiellement référencée | Documenter alias `team_members` |
| `labels` | Partielle | Gelée post-MVP |

## Flags MVP ajoutés (20260630100000)

- `profile_os` = OFF
- `awards_admin` = OFF
- `beat_store_admin` = OFF

## Workflow obligatoire

1. Nouvelle migration → `supabase/migrations/YYYYMMDDHHMMSS_<nom>.sql`
2. `supabase db query --linked --file ...`
3. Vérifier RLS : `SELECT tablename, relrowsecurity FROM pg_class ...`

## Ne pas supprimer en prod

Les tables orphelines restent en DB avec RLS=true — suppression = migration destructive nécessitant confirmation fondateur.
