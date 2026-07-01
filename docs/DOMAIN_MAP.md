# DOMAIN MAP — SONAFRIK

> Cartographie officielle des domaines métier et leurs emplacements code.  
> Dernière mise à jour : **30 juin 2026** (Vague G — 3 silos Martin)

## Règle fondamentale

Un domaine = un périmètre métier isolé. Les composants partagés vont dans `shared/`.  
**Listener ↔ Creator : import interdit** (ESLint + probes F9–F12).

---

## Les 3 silos (vision produit)

| Silo | Rôle | Bug isolé ? |
|---|---|---|
| **Auditeur** | Écoute, bibliothèque, recherche, beats (gelé) | Oui — web features |
| **Artiste** | Catalogue, droits, analytics, dashboard | Oui — web features |
| **Admin** | Modération, finance, fraude, flags | Oui — web features |

**Transversal MVP :** `wallet/`, `identity/auth`, `shared/social` — changements documentés dans EXECUTION_LOG.

---

## Cartographie Web (`apps/web/src/features/`)

| Domaine UI | Dossier | Route group | Fichiers (~) | Rôle |
|---|---|---|---:|---|
| **Listener** | `listener/` | `(listener)/` | 79 | Player, discover, library, search, `beats/` |
| **Creator** | `creator/` | `(creator)/` | 53 | catalog/, rights/, analytics/, dashboard/ |
| **Admin** | `admin/` | `(admin)/` | 78 | Cockpit, fraude SSOT, modération |
| **Wallet** | `wallet/` | `/wallet` | 14 | Solde, royalties UI, payout UI |
| **Identity** | `identity/` | profile, settings, auth | 92 | Auth MVP + Profile OS **gelé** (`profile_os=false`) |
| **Shared** | `shared/` | transversal | 40 | social, notifications, LDSE |

### Retirés / gelés

| Ancien | Actuel | Statut |
|---|---|---|
| `marketplace/` | `listener/beats/` | ✅ Supprimé Vague G — README tombstone |
| `streaming/` (web) | `listener/` | ✅ Migré Vague F |
| `catalog/` (web racine) | `creator/catalog/` | ✅ Migré |
| `launch/` (features) | `app/lancement/` + `components/lancement/` | Pas de domaine features |

### CSS registry (`apps/web/src/app/globals.css`)

| Bundle | Silo | MVP |
|---|---|:---:|
| `listen-home-bundle.css` | Auditeur | ✅ |
| `creator.css` | Artiste | ✅ |
| `admin-bundle.css` | Admin | ✅ |
| `identity.css` + `identity-account.css` | Identity | ✅ |
| `identity-post-mvp-bundle.css` | Identity OS | ❌ dormant |
| `wallet.css` | Wallet | ✅ |

---

## Cartographie API (`packages/api/src/`)

| Domaine API | Dossier | Silo | Migration planifiée |
|---|---|---|---|
| **listener** | `listener/` | Auditeur | — |
| **creator** | `creator/` | Artiste | — |
| **admin** | `admin/` | Admin | — |
| **catalog** | `catalog/` | Artiste | → `creator/catalog/` (Vague I) |
| **rights** | `rights/` | Artiste | → `creator/rights/` (Vague I) |
| **analytics** | `analytics/` | Artiste | → `creator/analytics/` (Vague I) |
| **streaming** | `streaming/` | Transversal | **LOCKED** — Session Engine |
| **wallet** | `wallet/` | Transversal | MVP |
| **social** | `social/` | Shared | MVP |
| **creator/career** | `creator/career/` | Artiste | **GELÉ** — flag `career_os` |

---

## Cartographie Persistence (Supabase)

| Ressource | Tables / RPC | Domaine propriétaire |
|---|---|---|
| Sessions playback | `stream_sessions`, `stream_events` | streaming/session (LOCKED) |
| Wallet | `wallets`, `wallet_ledger` | wallet |
| Catalogue | `tracks`, `albums`, `track_files` | catalog → creator |
| Royalties | `royalty_cycles` | wallet / admin |

---

## Références

- Plan correction : [`PLAN-CORRECTION-360-V2.md`](./PLAN-CORRECTION-360-V2.md)
- Audit V2 : [`AUDIT-V2-FORENSIQUE.md`](./AUDIT-V2-FORENSIQUE.md)
- Règles imports : [`DEPENDENCY_RULES.md`](./DEPENDENCY_RULES.md)
