# Dashboard Artiste — SRTSP Event Consumption (Phase 3.3)

| Événement | Écoute | Effet Dashboard |
|---|---|---|
| `publication.submitted` | ✅ | Compteur En revue + activité |
| `publication.approved` | ✅ | Publications / publié |
| `publication.rejected` | ✅ | En revue ↓ |
| `publication.deleted` | ✅ | KPIs catalogue |
| `publication.cancelled` | ✅ | Résumé cohérent |
| `catalog.track.published` | ✅ | Morceaux publiés |
| `creator.artist.updated` | ✅ | Hero profil |
| `wallet.balance.updated` | ✅ | Carte wallet (préparation) |
| `creator.analytics.invalidate` | ✅ | KPIs streams (préparation) |
| `catalog.invalidate` | ✅ | Invalidation ciblée |

## Ignorés (bruit wizard)

- `publication.draft.*`
- `publication.audio.uploaded`
- `publication.cover.uploaded`
- `publication.metadata.completed`

**Hook :** `useCreatorDashboardSrtspLive` — `useLiveQuery` + `useEventSubscription`
