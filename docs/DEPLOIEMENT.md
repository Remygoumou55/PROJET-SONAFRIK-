# SONAFRIK — Guide de Déploiement (Production)

## Pré-requis

- Compte Vercel Pro actif
- Projet Supabase Pro actif (pour PITR)
- Domaine configuré (optionnel)
- Accès CLI : `vercel`, `supabase`, `pnpm`

---

## 1. Variables d'environnement Vercel

Configurer dans **Vercel Dashboard → Project → Settings → Environment Variables** :

### Obligatoires

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role ⚠️ |
| `NEXT_PUBLIC_APP_URL` | URL Vercel stable (ex: `https://sonafrik.vercel.app`) |

### Monitoring

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry → Project → Settings → DSN |

### Paiements (configurer avant lancement avec opérateurs réels)

Voir `.env.example` pour la liste complète : `ORANGE_MONEY_API_KEY`, `MTN_MOMO_*`, `WAVE_*`, `SOUTRA_*`.

> Validation : `pnpm check-env` avant tout déploiement.

---

## 2. Migrations Supabase

Exécuter dans l'ordre dans **Supabase Dashboard → SQL Editor** :

```
1. supabase/migrations/20260617020000_payment_intents.sql
2. supabase/migrations/20260617030000_rate_limits.sql
3. supabase/migrations/20260617040000_admin_alerts.sql
```

Ou via CLI (si configuré) :
```bash
supabase db push --db-url "$DATABASE_URL"
```

---

## 3. Edge Functions

```bash
supabase functions deploy payment-initiate         --project-ref <ref>
supabase functions deploy payment-orange-callback  --project-ref <ref>
supabase functions deploy payment-mtn-callback     --project-ref <ref>
supabase functions deploy payment-wave-callback    --project-ref <ref>
supabase functions deploy payment-soutra-callback  --project-ref <ref>
```

Configurer les secrets Edge Functions dans Supabase Dashboard → Edge Functions → Secrets :
- Toutes les variables `ORANGE_MONEY_*`, `MTN_MOMO_*`, `WAVE_*`, `SOUTRA_*`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 4. Déploiement Vercel

```bash
# Déploiement production
vercel --prod

# Ou via GitHub auto-deploy sur push main
git push origin main
```

---

## 5. Post-déploiement

```bash
# 1. Vérifier les variables
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm check-env

# 2. Smoke test complet
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm smoke

# 3. Vérifications manuelles (voir section 6)
```

---

## 6. Vérifications manuelles (10 checks)

1. [ ] `/listen` : tendances et artistes visibles
2. [ ] Lecture d'un morceau démo
3. [ ] Inscription d'un nouvel utilisateur
4. [ ] Connexion / déconnexion
5. [ ] Page `/profile` accessible
6. [ ] `/wallet` : solde affiché
7. [ ] TopupModal : 4 opérateurs visibles
8. [ ] `/admin` : inaccessible sans compte admin
9. [ ] `/admin/health` : tous les composants ✅
10. [ ] Sentry : envoyer une erreur test et vérifier dans le Dashboard

---

## 7. Rollback d'urgence

### Rollback Vercel (code)

```bash
# Lister les déploiements précédents
vercel list

# Promouvoir l'ancien déploiement en production
vercel rollback <deployment-url>
```

### Rollback Supabase (données)

Utiliser PITR — voir `docs/SAUVEGARDES.md` section 3.

### Rollback migration SQL

```sql
-- Si une migration a cassé quelque chose, utiliser PITR.
-- Jamais de DROP TABLE en production — toujours PITR.
```
