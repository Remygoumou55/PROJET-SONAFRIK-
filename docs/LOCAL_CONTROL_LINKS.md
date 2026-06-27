# Liens de contrôle local — SONAFRIK

> Base : **http://localhost:3000** · Dev : `cd apps/web && pnpm dev:clean`  
> Dernière mise à jour : **27 juin 2026**

---

## Mode Live Control — aucune redirection

Pour que **chaque URL reste sur sa page** (pas de redirect vers `/listen`, pas de connexion forcée) :

Dans `apps/web/.env.local`, activer **les 3 variables** :

```env
BYPASS_AUTH=true
NEXT_PUBLIC_BYPASS_AUTH=true
NEXT_PUBLIC_LOCAL_AUDIT_MODE=true
```

Redémarrer le serveur après modification. Le middleware, la landing, la connexion et les guards utilisent `isLocalControlMode()` — **aucune redirection automatique**.

> Ne jamais activer sur Vercel / production.

---

## Toutes les routes — liens indépendants

### Public (sans session)

| Page | URL |
|---|---|
| Landing | http://localhost:3000/ |
| Lancement | http://localhost:3000/lancement |
| CGU | http://localhost:3000/legal/terms |
| Confidentialité | http://localhost:3000/legal/privacy |

### Auth

| Page | URL |
|---|---|
| Connexion / OTP | http://localhost:3000/auth/connexion |
| Inscription (→ connexion) | http://localhost:3000/auth/inscription |
| Mot de passe oublié | http://localhost:3000/auth/mot-de-passe-oublie |

### Onboarding

| Page | URL |
|---|---|
| Choix rôle | http://localhost:3000/onboarding/role |
| Onboarding auditeur | http://localhost:3000/onboarding/listener |
| Onboarding artiste | http://localhost:3000/onboarding/artist |

### Auditeur (listener)

| Page | URL |
|---|---|
| Accueil écoute | http://localhost:3000/listen |
| Beat Store | http://localhost:3000/listen/beats |
| Recherche | http://localhost:3000/search |
| Bibliothèque | http://localhost:3000/library |
| Notifications | http://localhost:3000/notifications |

### Créateur (creator)

| Page | URL |
|---|---|
| Dashboard | http://localhost:3000/creator |
| Analytics | http://localhost:3000/creator/analytics |
| Catalogue | http://localhost:3000/creator/catalog |
| Morceaux | http://localhost:3000/creator/catalog/tracks |
| Sorties | http://localhost:3000/creator/catalog/releases |
| Droits | http://localhost:3000/creator/rights |
| Labels | http://localhost:3000/creator/labels |
| Équipe | http://localhost:3000/creator/team |
| Vérification | http://localhost:3000/creator/verification |
| Identité artiste | http://localhost:3000/creator/identity |

### Portefeuille (wallet)

| Page | URL |
|---|---|
| Wallet | http://localhost:3000/wallet |
| Royalties | http://localhost:3000/wallet/royalties |
| Retrait | http://localhost:3000/wallet/payout |

### Profil & réglages (identity)

| Page | URL |
|---|---|
| Profil | http://localhost:3000/profile |
| Éditer profil | http://localhost:3000/profile/edit |
| Réglages | http://localhost:3000/settings |
| Compte | http://localhost:3000/settings/account |
| Préférences | http://localhost:3000/settings/preferences |
| Notifications | http://localhost:3000/settings/notifications |
| Paiement | http://localhost:3000/settings/payment |
| Sessions | http://localhost:3000/settings/sessions |
| Aide | http://localhost:3000/settings/help |

### Admin

| Page | URL |
|---|---|
| Dashboard admin | http://localhost:3000/admin |
| Live Control | http://localhost:3000/admin/live-control |
| Catalogue | http://localhost:3000/admin/catalog |
| Finance | http://localhost:3000/admin/finance |
| Fraude | http://localhost:3000/admin/fraud |
| Feature flags | http://localhost:3000/admin/flags |
| Santé | http://localhost:3000/admin/health |
| Droits | http://localhost:3000/admin/rights |
| Réglages | http://localhost:3000/admin/settings |

---

## Routes dynamiques — IDs réels (DB live)

| Route | Lien direct | Donnée |
|---|---|---|
| Artiste public | http://localhost:3000/listen/artist/c1000001-0000-4000-8000-000000000001 | **Alpha Diallo** |
| Artiste RMG | http://localhost:3000/listen/artist/8f55a13e-eae7-473c-85f3-505bdee4e6e7 | **RMG** |
| Album | http://localhost:3000/listen/album/a0b00001-0000-4000-8000-000000000001 | **Conakry Vibes** |
| Playlist publique | http://localhost:3000/library/playlist/f1000001-0000-4000-8000-000000000001 | **Top Guinée Juillet 2026** |
| Droits créateur | http://localhost:3000/creator/rights/01000001-0000-4000-8000-000000000001 | **workId** (table `works`) |

> `/creator/rights/[id]` attend un **`workId`**, pas un `contractId`.

### Albums seed

- http://localhost:3000/listen/album/a0b00001-0000-4000-8000-000000000002 — Nuits Africaines
- http://localhost:3000/listen/album/a0b00002-0000-4000-8000-000000000001 — Cœur de Fouta
- http://localhost:3000/listen/album/a0b00003-0000-4000-8000-000000000001 — Griot Électrique
- http://localhost:3000/listen/album/a0b00004-0000-4000-8000-000000000001 — Rue Kaloum

### Artistes publics

- http://localhost:3000/listen/artist/c1000001-0000-4000-8000-000000000001 — Alpha Diallo
- http://localhost:3000/listen/artist/c1000002-0000-4000-8000-000000000002 — Faya
- http://localhost:3000/listen/artist/c1000003-0000-4000-8000-000000000003 — Djeli Sow
- http://localhost:3000/listen/artist/c1000004-0000-4000-8000-000000000004 — MC Fly
- http://localhost:3000/listen/artist/8f55a13e-eae7-473c-85f3-505bdee4e6e7 — RMG

### Playlists

| Titre | URL |
|---|---|
| Top Guinée Juillet 2026 | http://localhost:3000/library/playlist/f1000001-0000-4000-8000-000000000001 |
| Gospel du Dimanche | http://localhost:3000/library/playlist/f1000002-0000-4000-8000-000000000002 |
| Afro Vibes GN | http://localhost:3000/library/playlist/f1000003-0000-4000-8000-000000000003 |

---

## Régénérer les liens dynamiques

```powershell
cd apps/web
node scripts/fetch-control-links.mjs
```
