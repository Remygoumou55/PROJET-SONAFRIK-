# SONAFRIK — Démarrer le Live Control MVP

> Tout est déjà préparé en base et dans le code. **Une seule commande** à lancer.

## 1. Lancer l'application

```bash
cd "e:\PROJET SONAFRIK\apps\web"
pnpm dev
```

## 2. Ouvrir le guide visuel

Double-cliquer sur :

```
docs/GUIDE_LIVE_CONTROL_REMY.html
```

(ou l'ouvrir dans Chrome / Edge)

## 3. Tableau de bord temps réel

```
http://localhost:3000/admin/live-control
```

## 4. Connexion

Utiliser **remygoumou55@gmail.com** ou **+2230546508020** (OTP).

Votre compte a le rôle **admin** — accès `/admin/*` garanti.

## Variables déjà configurées (`apps/web/.env.local`)

| Variable | Valeur |
|---|---|
| `BYPASS_AUTH` | `false` |
| `NEXT_PUBLIC_BYPASS_AUTH` | `false` |
| `NEXT_PUBLIC_LOCAL_AUDIT_MODE` | `false` |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `true` |

Si vous relancez depuis zéro, copier `.env.example` → `.env.local` et appliquer ces 4 valeurs.

## Si quelque chose ne fonctionne pas

Envoyer à l'IA :

1. Capture d'écran de la page bloquante
2. Message d'erreur exact
3. Numéro d'étape du guide HTML

## Référence technique

- Baseline DB : `docs/LIVE_CONTROL_PREP_BASELINE.md`
- Migration prep : `supabase/migrations/20260626100000_live_control_prep.sql`
