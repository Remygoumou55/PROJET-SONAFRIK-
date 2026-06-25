# DOMAIN MAP — SONAFRIK

> Cartographie officielle des domaines métier et leurs emplacements code.  
> Dernière mise à jour : 2026-06-25 (SPRING 2 programme)

## Règle fondamentale

Un domaine = un périmètre métier isolé. Les composants partagés vont dans `shared/`.  
**Listener ↔ Creator : import interdit.**

---

## Cartographie Web (`apps/web/src/features/`)

| Domaine UI | Dossier | Route group | Rôle |
|---|---|---|---|
| **Listener** | `listener/` | `(listener)/` | Écoute, player, bibliothèque, recherche auditeur |
| **Creator** | `creator/` | `(creator)/` | Catalogue, analytics créateur, droits, équipe |
| **Admin** | `admin/` | `admin/` | Modération, finance, flags, santé |
| **Wallet** | `wallet/` | `wallet/` | Solde, royalties UI, retraits UI |
| **Identity** | `identity/` | `auth/`, `profile/`, `settings/` | Auth, profil, préférences |
| **Shared** | `shared/` | transversal | Social (likes/follows), notifications, UI shell |
| **Launch** | `launch/` | `lancement/` | Page pré-lancement |

### Alias historiques (ne pas recréer)

| Ancien | Actuel | Statut |
|---|---|---|
| `streaming/` (web) | `listener/` | ✅ Migré (Vague F4) |
| `catalog/` (web racine) | `creator/catalog/` | ✅ Migré |

---

## Cartographie API (`packages/api/src/`)

| Domaine API | Dossier | Consommateurs autorisés |
|---|---|---|
| **streaming** | `streaming/` | listener (web/mobile), admin (lecture) |
| **metadata** | `metadata/` | publication, admin |
| **publication** | `publication/` | creator/catalog |
| **catalog** | `catalog/` | creator |
| **creator** | `creator/` | creator dashboard |
| **analytics** | `analytics/` | creator (⚠️ chevauche streaming analytics) |
| **rights** | `rights/` | creator, admin |
| **wallet** | `wallet/` | wallet UI, admin |
| **identity** | `identity/` | identity, auth |
| **social** | `social/` | listener, creator (via shared) |
| **admin** | `admin/` | admin UI |

### SPRING 2 — nouveaux modules prévus (`packages/api/src/streaming/`)

```
streaming/
├── application/          ← SPRING 2.1 — CQRS, DTO, use cases (comme metadata)
├── runtime/              ← SPRING 2.1 — coordinateur playback
├── session/              ← SPRING 2.2 — Session Engine
├── playback/             ← SPRING 2.3 — Playback Runtime Engine
├── analytics/            ← SPRING 2.4 — Analytics Engine (agrégations)
├── antifraud/            ← SPRING 2.5 — Anti-Fraud Engine
├── ledger/               ← SPRING 2.6 — Stream Ledger (source vérité financière)
└── integration/          ← SPRING 2.8 — bridges + feature flags
```

Le module `streaming/` existant (`streaming.service.ts`, `streaming.repository.ts`) reste **legacy path** jusqu'à SPRING 2.8.

---

## Cartographie Persistence (`packages/persistence/` + Supabase)

| Ressource | Tables / fonctions | Domaine propriétaire |
|---|---|---|
| Sessions playback | `stream_sessions` | streaming/session |
| Événements playback | `stream_events` (INSERT ONLY) | streaming/session |
| Reprise lecture | `playback_positions` | streaming/playback |
| **Stream Ledger** (à créer 2.6) | `stream_ledger_entries` (proposé) | streaming/ledger |
| Royalties | `royalty_cycles`, `royalty_calculations` | wallet (lecture seule depuis ledger en 2.6) |
| Wallet | `wallets`, `wallet_ledger` (IMMUTABLE) | wallet |
| Catalogue | `tracks`, `track_files`, `albums` | catalog |
| Métadonnées | `metadata_*` | metadata |

---

## Cartographie Edge Functions (`supabase/functions/`)

| Function | Domaine | Rôle actuel | Évolution SPRING 2 |
|---|---|---|---|
| `stream-start` | streaming/playback | URL signée + session | Devient adaptateur transport (2.3) |
| `stream-progress` | streaming/session + antifraud | Heartbeat + anti-fraude basique | Délègue Session + Anti-Fraud engines (2.2, 2.5) |
| `stream-complete` | streaming/session | Real Listen 90 % | Délègue Session Engine + émet événement ledger (2.2, 2.6) |

---

## Flux financier cible (post SPRING 2.6)

```
Écoute validée (Real Listen ≥90 %)
        ↓
Stream Ledger (append-only, idempotent)
        ↓
Royalty Engine (existant — NON modifié en SPRING 2)
        ↓
wallet_ledger / royalty_calculations
```

**SPRING 2 ne modifie pas** le wallet, les retraits, ni le moteur royalties — il pose le **ledger intermédiaire** comme contrat.

---

## Mobile (`apps/mobile/`)

| Domaine | Statut MVP | Alignement SPRING 2 |
|---|---|---|
| Player / tabs | Partiel | Consomme `@sonafrik/api/streaming` — même bridge 2.8 |

---

## Matrice d'interaction autorisée

| De → Vers | listener | creator | wallet | streaming API | ledger |
|---|---|---|---|---|---|
| listener | ✅ | ❌ | ❌ (UI route only) | ✅ | ❌ |
| creator | ❌ | ✅ | ❌ | ✅ (analytics read) | ❌ |
| wallet | ❌ | ❌ | ✅ | ❌ | ✅ (read via service) |
| streaming/ledger | ❌ | ❌ | ❌ (event only) | ✅ | ✅ |
