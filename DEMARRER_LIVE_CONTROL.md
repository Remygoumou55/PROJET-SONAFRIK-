# SONAFRIK — Démarrer le Live Control MVP

> Contrôle visuel de **chaque page indépendamment** — sans redirection, sans connexion.

## 1. Variables d'environnement

Dans `apps/web/.env.local`, vérifier que ces 3 lignes sont à **`true`** :

```env
BYPASS_AUTH=true
NEXT_PUBLIC_BYPASS_AUTH=true
NEXT_PUBLIC_LOCAL_AUDIT_MODE=true
```

Sans ça, une session active redirige tout vers `/listen`.

## 2. Lancer l'application

```bash
cd "e:\PROJET SONAFRIK\apps\web"
pnpm dev:clean
```

## 3. Ouvrir le guide visuel

```
docs/GUIDE_LIVE_CONTROL_REMY.html
```

## 4. Liste complète des liens

```
docs/LOCAL_CONTROL_LINKS.md
```

Chaque URL reste sur sa page — pas de redirect, pas de login forcé.

## 5. Tableau de bord temps réel

```
http://localhost:3000/admin/live-control
```

## Référence technique

- Baseline DB : `docs/LIVE_CONTROL_PREP_BASELINE.md`
- Migration prep : `supabase/migrations/20260626100000_live_control_prep.sql`
