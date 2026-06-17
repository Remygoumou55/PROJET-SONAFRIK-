# SONAFRIK — Guide des Sauvegardes

## 1. Sauvegardes automatiques Supabase (PITR)

Supabase Pro active automatiquement le **Point-In-Time Recovery (PITR)**.

- Rétention : 7 jours (Pro) / 30 jours (Team/Enterprise)
- Granularité : restauration à la seconde près
- Coût : inclus dans le plan Pro

### Restaurer depuis le Dashboard Supabase

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard) → Projet SONAFRIK
2. Aller dans **Database** → **Backups**
3. Choisir **Point in Time** (PITR)
4. Sélectionner la date/heure cible (fuseau UTC)
5. Cliquer **Restore** → confirmer l'opération
6. Attendre la restauration (5-30 min selon la taille)
7. Vérifier l'intégrité avec le smoke-test : `pnpm smoke`

> ⚠️ La restauration PITR crée une **nouvelle instance** — l'ancienne reste accessible jusqu'à suppression manuelle.

---

## 2. Export local via pg_dump (développement uniquement)

**NE PAS exécuter en production sans accord préalable** — risque de charge sur la DB.

Script : `scripts/backup-export.sh`

```bash
#!/bin/bash
# Usage : ./scripts/backup-export.sh
# Pré-requis : pg_dump installé + DATABASE_URL dans l'environnement
# DATABASE_URL dans .env.local (voir .env.example)

mkdir -p backups
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump "$DATABASE_URL" \
  --no-owner --no-acl \
  -F c -f "backups/sonafrik_$DATE.dump"
echo "Backup créé : backups/sonafrik_$DATE.dump"
```

Restauration locale :
```bash
pg_restore --no-owner --no-acl -d "$DATABASE_URL" backups/sonafrik_20260617_120000.dump
```

---

## 3. Procédure de rollback de migration

### En développement uniquement

```bash
supabase db reset   # DANGER : efface toutes les données locales
```

### En production (Supabase PITR)

1. Identifier l'horodatage AVANT l'application de la migration incorrecte
2. Utiliser PITR pour restaurer (voir section 1)
3. Ne PAS réappliquer la migration problématique
4. Corriger la migration et la re-soumettre après validation

### Ordre d'exécution des migrations

Les migrations sont dans `supabase/migrations/` et doivent être appliquées dans l'ordre lexicographique (date en préfixe) :

| Migration | Contenu |
|---|---|
| `20260617020000_payment_intents.sql` | Table payment_intents + RPCs |
| `20260617030000_rate_limits.sql` | Rate limiting send_tip |
| `20260617040000_admin_alerts.sql` | Alertes admin + vue stats |

---

## 4. Vérification de l'intégrité post-restauration

Après toute restauration :

```bash
# 1. Smoke test complet
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm smoke

# 2. Vérification manuelle dans Supabase Dashboard
# - Table Editor : vérifier counts dans tracks, wallets, payment_intents
# - SQL Editor : SELECT public.expire_stale_payment_intents();
# - Auth : vérifier que les utilisateurs sont présents
```
