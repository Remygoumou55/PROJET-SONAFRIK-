# Analytics Créateur — SRTSP Event Consumption (Phase 3.5)

## Événements actifs (5)

| Événement | Effet Analytics |
|---|---|
| `publication.approved` | KPIs + top tracks après publication |
| `publication.deleted` | Graphiques / classements recalculés |
| `catalog.track.updated` | Statistiques morceau actualisées |
| `catalog.track.deleted` | Top tracks / timeline cohérents |
| `creator.analytics.invalidate` | Refresh ciblé cache Analytics |

## Préparation (sans consommation active)

| Événement | Statut |
|---|---|
| `stream.play.recorded` | Documenté — registry futur |
| `wallet.balance.updated` | Préparé Phase wallet |
| `wallet.royalty.generated` | Préparé Phase royalties |

## Ignorés (bruit wizard)

- `publication.draft.*`
- `publication.audio.uploaded`
- `publication.cover.uploaded`
- `publication.metadata.completed`

**Hook :** `useCreatorAnalyticsSrtspLive` — `useLiveQuery` + `useEventSubscription`  
**Adaptateur :** `creator-analytics-consumer.ts` — `shouldRefreshCreatorAnalytics`
