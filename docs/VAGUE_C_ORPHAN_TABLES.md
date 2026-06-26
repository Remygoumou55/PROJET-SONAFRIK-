# Vague C4 — Audit tables infrastructure

> Date : juin 2026 · Projet `cxjpburiiazzvlczzupy`

## Résumé

| Table | RLS | Utilisée en code | Statut MVP |
|---|---|---|---|
| `permissions` | ✅ | Seed Sprint 2 uniquement | **Infrastructure** — RBAC futur |
| `role_permissions` | ✅ | Seed Sprint 2 uniquement | **Infrastructure** — RBAC futur |
| `roles` | ✅ | `user_roles` + auth | **Active** (rôles utilisateur) |
| `user_roles` | ✅ | `is_admin`, guards | **Active** |
| `rate_limits` | ✅ | RPC `check_rate_limit` | **Active** (tips, RPCs sensibles) |

Les tables `permissions` / `role_permissions` ne sont **pas mortes** : elles alimentent le modèle RBAC documenté CDC (Identity OS). Le code applicatif utilise aujourd'hui `is_admin` RPC et `user_roles` plutôt qu'une résolution fine par permission.

## rate_limits

- Migration : `20260617030000_rate_limits.sql`
- Fonction : `check_rate_limit(identifier, action, max_count, window_seconds)`
- Accès : **service_role / SECURITY DEFINER** uniquement (pas d'accès client direct)
- Usage : limitation `send_tip` et RPCs financiers sensibles

Validation :
```sql
SELECT COUNT(*) FROM public.rate_limits;
SELECT proname FROM pg_proc WHERE proname = 'check_rate_limit';
```

## permissions / role_permissions

- Migration : `20250610100000_sprint2_identity_auth.sql`
- Seeds permissions wallet, streaming, creator (Sprint 4–8)
- **Non branchées** aux guards Next.js / middleware — intentionnel MVP

Action post-MVP : connecter `requirePermission('catalog.publish')` via service identity.

## Rollback / maintenance

Aucune suppression recommandée avant MVP validé — tables petites, RLS actif, zéro surface d'attaque client.
