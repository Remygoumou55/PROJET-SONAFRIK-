# Connexion développement local — SONAFRIK

## Compte de test pré-configuré

| Champ     | Valeur                  |
|-----------|-------------------------|
| Email     | `dev@sonafrik.local`    |
| Mot de passe | `DevSonafrik2026!`  |
| Profil    | `auditeur_artiste`, onboarding terminé |
| Premium   | Non (gratuit)           |

## Étapes pour activer ce compte

### 1. Démarrer Supabase local

```bash
cd e:/PROJET SONAFRIK
supabase start
```

### 2. Exécuter le seed (une seule fois)

```bash
supabase db seed --db-url postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  supabase/seed/dev_test_account.sql
```

Ou via le Studio local (http://127.0.0.1:54323) → SQL Editor → coller le contenu du fichier.

### 3. Démarrer l'app web

```bash
pnpm dev
```

Aller sur http://localhost:3000/auth/connexion et se connecter avec les identifiants ci-dessus.

## Important

- Ce seed est **uniquement pour le développement local** (`supabase start`).
- Ne jamais exécuter ce seed en production ou staging.
- Si le compte existe déjà (après un second `db seed`), les `ON CONFLICT DO NOTHING` évitent les doublons.
- Le mot de passe est stocké avec bcrypt — modifier la constante `v_password` dans le seed si besoin.
- Aucune modification du code source (guards, middleware) n'a été faite.
  L'authentification est réelle — ce compte se connecte via `/auth/connexion`.
