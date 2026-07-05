# SRTSP — Subscriptions

## SubscriptionManager

Permet aux modules de s'abonner avec filtres :

```typescript
engine.subscribe(
  { eventName: "catalog.track.published", destination: "publications" },
  (event) => { /* refresh */ },
);
```

## Filtres disponibles

| Filtre | Description |
|---|---|
| `eventName` | string ou string[] |
| `destination` | module cible (publications, wallet, …) |
| `source` | domaine émetteur |

## Exemples module

| Module | Écoute |
|---|---|
| Dashboard | `publication.approved`, `wallet.balance.updated` |
| Mes publications | `catalog.track.*`, `catalog.invalidate` |
| Wallet | `wallet.*`, `wallet.royalty.generated` |
| Library | `catalog.track.published`, `listener.playlist.updated` |

## React

```typescript
useEventSubscription("catalog.track.updated", handler);
```
