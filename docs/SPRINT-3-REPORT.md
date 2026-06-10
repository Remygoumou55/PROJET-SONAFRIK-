# Sprint 3 — Identity OS

**Statut :** ✅ TERMINÉ · **Date :** 10 Juin 2026

## Objectif

Construire un **Identity OS complet** — profil étendu, avatar (URLs signées), préférences utilisateur, centre de notifications in-app, gestion des sessions actives et suppression de compte — web et mobile.

## Livrables

### Base de données

**Extension `profiles` :** `bio`, `city`, `country_code`, `avatar_path`

**Nouvelles tables :**
- `user_preferences` — langue, audio, confidentialité, notifications, timezone
- `notifications` — centre in-app (catégories system/social/artist/billing/security)

**Migrations :**
- `20250610110000_sprint3_identity_os.sql`
- `20250610110001_sprint3_identity_rls.sql`

**Storage :** bucket privé `avatars` (5 Mo, JPEG/PNG/WebP)

**RPC :** `mark_notification_read`, `mark_all_notifications_read`

**Triggers :** auto-création préférences + notification bienvenue à l'insert profile

### Règles CDC respectées

- ✅ RLS Zero Trust sur `user_preferences` et `notifications`
- ✅ Avatars via **URLs pré-signées** edge function (Règle #10)
- ✅ `audit_logs` INSERT ONLY sur actions identity
- ✅ Messages d'erreur en français (`IDENTITY_ERROR_MESSAGES`)
- ✅ Dark `#0D0D0D` · français par défaut

### Packages

| Package | Contenu |
|---------|---------|
| `@sonafrik/types` v0.2 | `UserPreferences`, `Notification`, `IdentityContext`, labels FR |
| `@sonafrik/database` | Types `user_preferences`, `notifications`, RPC sprint 3 |
| `@sonafrik/api` v0.3 | `IdentityService`, `IdentityRepository`, schémas Zod |

### Edge Function

`supabase/functions/avatar-signed-url/` — actions `upload` et `read`

### Web — feature `identity/`

| Route | Fonction |
|-------|----------|
| `/profile` | Dashboard profil (header, rôles, stats) |
| `/profile/edit` | Édition profil + upload avatar |
| `/settings` | Vue d'ensemble Identity OS |
| `/settings/preferences` | Langue, audio, confidentialité, alertes |
| `/settings/notifications` | Liste + marquer lu / tout lu |
| `/settings/sessions` | Sessions actives + révocation |
| `/settings/account` | Infos compte + suppression soft-delete |

**Middleware :** routes `/profile` et `/settings` protégées · redirect auth si connecté

### Mobile — tabs CDC

**Accueil · Explorer · Bibliothèque · Profil**

Stack profil : index · edit · preferences · notifications · sessions · account

## Configuration requise

```bash
supabase db push          # Appliquer migrations sprint 3
supabase functions deploy avatar-signed-url
```

Variables inchangées (Sprint 2) : `NEXT_PUBLIC_SUPABASE_*` / `EXPO_PUBLIC_SUPABASE_*`

## Validation

```bash
pnpm build      # ✅ 0 erreur
pnpm lint       # ✅
pnpm typecheck  # ✅
```

## Prochain sprint

**Sprint 4 — Creator OS** : profils artiste, vérifications, labels (hors périmètre MVP streaming).

---

*SONAFRIK · NOTRE BIEN COMMUN*
