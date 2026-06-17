# SONAFRIK — Guide Administrateur

Ce guide est destiné à M. Rémy Goumou pour la gestion quotidienne de la plateforme.

---

## Accéder au back-office

1. Se connecter sur [sonafrik.vercel.app](https://sonafrik.vercel.app)
2. Naviguer vers `/admin` (ou utiliser le lien "Admin" dans le menu profil)
3. La page est protégée — seuls les comptes avec `role = 'admin'` y accèdent

> Pour attribuer le rôle admin à un compte, exécuter dans Supabase Dashboard → SQL Editor :
> ```sql
> UPDATE public.profiles SET role = 'admin' WHERE email = 'votre@email.com';
> ```

---

## Santé du système — /admin/health

Vérifiez cette page chaque matin avant d'ouvrir la plateforme au public :

- **✅ Base de données** : Supabase répond correctement (latence < 200 ms = vert)
- **✅ Storage** : Les fichiers audio/covers sont accessibles
- **✅ Wallets** : La table wallets est lisible
- **✅ Paiements** : Les confirmations de paiement sont enregistrées
- **Edge Functions** : À vérifier manuellement dans Supabase → Edge Functions

**Si un composant affiche ❌ :**
1. Vérifier le Dashboard Supabase pour des incidents en cours
2. Consulter les logs Vercel (Deployments → Logs)
3. Consulter Sentry pour des erreurs récentes

---

## Modérer le catalogue musical

### Approuver une soumission

1. Aller dans `/admin/catalog`
2. Les morceaux en `pending_review` apparaissent dans la liste
3. Écouter le morceau via le lecteur
4. Cliquer **Approuver** pour publier ou **Rejeter** avec une raison

> Les artistes reçoivent une notification automatique à chaque décision.

### Suspendre un morceau déjà publié

Dans Supabase SQL Editor :
```sql
UPDATE public.tracks
SET publication_status = 'suspended', rejection_reason = 'Contenu non conforme'
WHERE id = '<track-id>';
```

---

## Gérer les artistes

### Vérifier un artiste (badge vérifié)

Dans Supabase SQL Editor :
```sql
UPDATE public.artist_profiles
SET verified = true
WHERE user_id = '<user-id>';
```

### Suspendre un artiste

```sql
UPDATE public.profiles
SET role = 'suspended'
WHERE id = '<user-id>';
```

> Un artiste suspendu ne peut plus se connecter ni uploader de contenu.

---

## Modifier les tarifs abonnements

Les tarifs sont définis dans la table `subscription_plans` :

```sql
-- Voir les tarifs actuels
SELECT * FROM public.subscription_plans ORDER BY price_gnf;

-- Modifier un tarif (exemple : augmenter le mensuel)
UPDATE public.subscription_plans
SET price_gnf = 15000
WHERE plan_type = 'monthly';
```

> ⚠️ Un changement de tarif n'affecte pas les abonnements existants — uniquement les nouveaux.

---

## Consulter le journal d'audit

Toutes les actions sensibles sont enregistrées dans `audit_log` :

```sql
-- 50 dernières actions
SELECT actor_id, action, resource_type, resource_id, created_at
FROM public.audit_log
ORDER BY created_at DESC
LIMIT 50;

-- Actions d'un utilisateur spécifique
SELECT * FROM public.audit_log
WHERE actor_id = '<user-id>'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Gérer un paiement bloqué (payment_intent failed)

### Diagnostiquer

```sql
-- Voir les paiements récents en erreur
SELECT id, user_id, provider, amount_gnf, status, failed_at, metadata
FROM public.payment_intents
WHERE status IN ('failed', 'expired')
ORDER BY created_at DESC
LIMIT 20;
```

### Confirmer manuellement (si le paiement a réellement eu lieu)

Uniquement si vous avez la **preuve** que l'opérateur a débité le client :

```sql
SELECT public.confirm_payment_intent(
  '<intent-id-uuid>',
  '<reference-operateur>'
);
```

### Rembourser (marquer comme remboursé)

Si le client a été débité mais l'intent est en erreur, et que vous avez remboursé manuellement :

```sql
UPDATE public.payment_intents
SET status = 'refunded'
WHERE id = '<intent-id>';
```

---

## Alertes admin automatiques

La vue `public.admin_notifications` reçoit des alertes automatiques, notamment quand un opérateur génère 5+ échecs en 1 heure.

```sql
-- Voir les alertes non lues
SELECT * FROM public.admin_notifications
WHERE is_read = false
ORDER BY created_at DESC;

-- Marquer comme lues
UPDATE public.admin_notifications SET is_read = true WHERE is_read = false;
```

---

## Statistiques du tableau de bord

```sql
-- Stats globales du jour
SELECT * FROM public.admin_dashboard_stats;
```

Retourne :
- Utilisateurs actifs (30 derniers jours)
- Streams valides aujourd'hui
- Paiements confirmés aujourd'hui
- Solde total des wallets
- Paiements failed/expired aujourd'hui

---

## Contacts d'urgence

| Sujet | Contact |
|---|---|
| Panne Supabase | [status.supabase.com](https://status.supabase.com) |
| Panne Vercel | [vercel-status.com](https://vercel-status.com) |
| Sentry (monitoring erreurs) | Tableau de bord Sentry configuré |
| Support Orange Money GN | Portail développeur Orange |
| Support MTN MoMo | [momodeveloper.mtn.com](https://momodeveloper.mtn.com) |
