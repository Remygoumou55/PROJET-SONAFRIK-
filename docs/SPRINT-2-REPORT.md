# Sprint 2 — Authentication

**Statut :** ✅ TERMINÉ · **Date :** 10 Juin 2026

## Objectif

Système d'authentification complet : inscription · connexion OTP SMS · sessions · rôles · permissions · AUDIT_LOG actif.

## Livrables

### Base de données (7 tables)

`profiles` · `roles` · `permissions` · `role_permissions` · `user_roles` · `user_sessions` · `audit_logs`

**Migrations :**
- `20250610100000_sprint2_identity_auth.sql`
- `20250610100001_sprint2_rls_policies.sql`
- `20250610100002_sprint2_audit_rpc.sql`

**Seed :** `supabase/seed/sprint2_roles.sql`

### Règles CDC respectées

- ✅ RLS Zero Trust activé sur toutes les tables
- ✅ `audit_logs` INSERT ONLY — trigger bloque UPDATE/DELETE (Règle #6)
- ✅ Messages d'erreur en français (Règle #9)
- ✅ UUID · soft delete · timestamps audit

### Packages

| Package | Contenu |
|---------|---------|
| `@sonafrik/types` | Profile, UserSession, ACCOUNT_TYPE_OPTIONS, AUTH_ERROR_MESSAGES |
| `@sonafrik/database` | Client Supabase typé, types Database |
| `@sonafrik/api` | AuthService, AuthRepository, schémas Zod |

### Edge Function

`supabase/functions/audit-log/` — journalisation sécurisée côté serveur

### Applications

| App | Écrans |
|-----|--------|
| Web | `/auth/inscription` · `/auth/connexion` · middleware session |
| Mobile | `/auth` · `/auth/inscription` · `/auth/connexion` |

## Configuration requise

```bash
# Copier .env.example → apps/web/.env.local et apps/mobile/.env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

```bash
# Appliquer migrations (Supabase CLI)
supabase db push
psql -f supabase/seed/sprint2_roles.sql
```

## Validation

```bash
pnpm install && pnpm build && pnpm lint && pnpm typecheck
```

## Prochain sprint

**Sprint 3 — Identity OS** : profil, avatar, préférences, notifications

---

*SONAFRIK · Notre Bien Commun*
