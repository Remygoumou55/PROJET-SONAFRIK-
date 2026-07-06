# Mes publications — SRTSP Event Consumption Map (Phase 3.2)

| Événement | Source | Payload clé | Effet UI |
|---|---|---|---|
| `publication.draft.created` | publication | albumId, trackId, creatorId | Brouillon visible |
| `publication.draft.updated` | publication | idem | Liste à jour |
| `publication.audio.uploaded` | publication | idem | Fichiers reflétés |
| `publication.cover.uploaded` | publication | idem | Pochette reflétée |
| `publication.metadata.completed` | publication | idem | Métadonnées OK |
| `publication.submitted` | publication | idem | Statut → En revue |
| `publication.approved` | publication | idem | Statut → Publié |
| `publication.rejected` | publication | idem | Statut → Rejeté |
| `publication.cancelled` | publication | idem | Liste cohérente |
| `publication.deleted` | publication | idem | Entrée retirée |
| `catalog.invalidate` | catalog | creatorId | Refresh catalogue |
| `catalog.track.updated` | catalog | trackId, creatorId? | Mise à jour track |
| `catalog.track.deleted` | catalog | trackId, creatorId? | Suppression track |

**Filtre consommateur :** `shouldRefreshPublicationLibrary(event, creatorId)`

**Hooks :** `useLiveQuery` + `useEventSubscription` via `usePublicationsSrtspLive`
