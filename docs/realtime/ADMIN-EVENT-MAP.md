# Workspace Super Admin Hub — SRTSP Event Consumption (Phase 3.9)

## Snapshot & supervision globale (actifs)

| Événement | Effet Super Admin |
|---|---|
| `admin.snapshot.invalidate` | Cockpit · badges sidebar · KPIs |
| `admin.fraud.updated` | Fraude · analytics live |
| `admin.catalog.updated` | File modération |
| `admin.user.updated` | Utilisateurs · artistes |
| `admin.withdrawal.updated` | Queue retraits |
| `admin.analytics.refreshed` | Dashboard analytics |
| `wallet.transaction.completed` | Revenus · finance |
| `withdrawal.approved` / `rejected` | Retraits |
| `payment.completed` | Finance |

## Publications & modération (actifs)

| Événement | Effet |
|---|---|
| `publication.submitted` | File catalogue pending |
| `publication.approved` / `rejected` / `deleted` | Modération |
| `catalog.track.*` | Catalogue admin |
| `catalog.invalidate` | Queue modération |

## Wallet (actifs)

| Événement | Effet |
|---|---|
| `wallet.updated` | Finance · retraits |
| `withdrawal.updated` | Queue payouts |
| `wallet.royalty.generated` | Revenus |

## Identité artiste (actifs)

| Événement | Effet |
|---|---|
| `creator.artist.updated` | Liste artistes |
| `artist.*` · `identity.*` | Vérifications |
| `profile.invalidate` | Bridge LDSE |

## Streaming supervision (actifs — read-only)

| Événement | Effet |
|---|---|
| `streaming.started` / `paused` / `ended` | Analytics live · fraude |

## Notifications & analytics (actifs)

| Événement | Effet |
|---|---|
| `notifications.item.created` | Supervision utilisateurs |
| `analytics.invalidate` | Dashboard analytics |

## Préparation (sans consommation active)

| Événement | Statut |
|---|---|
| `stream.play.recorded` | Compteurs écoutes agrégés |
| `royalty.adjusted` | Ajustements manuels |

## Ignorés

- `publication.draft.*` · upload wizard · metadata form

**Adaptateur :** `admin-hub-consumer.ts`  
**SSOT hook :** `useAdminSrtspLiveQuery.ts`  
**Total actifs :** 35+ (groupes snapshot · publication · catalog · wallet · identity · streaming · notifications · analytics)
