# Politique migrations SQL

> **Problème audit #24** — 88 migrations appliquées, fichiers volumineux non splittables rétroactivement.

---

## Règles

1. **Une migration = un objectif** — pas de mega-fichiers > 200 lignes si évitable
2. **Nommage :** `YYYYMMDDHHMMSS_<domaine>_<action>.sql`
3. **Toujours** `BEGIN;` … `COMMIT;` + RLS policies pour tables nouvelles
4. **Ne jamais** modifier une migration déjà appliquée en prod — créer une migration corrective

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
