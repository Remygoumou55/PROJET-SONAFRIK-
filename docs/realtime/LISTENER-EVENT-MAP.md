# Workspace Auditeur Hub — SRTSP Event Consumption (Phase 3.8)

## Événements catalogue (actifs)

| Événement | Effet Auditeur |
|---|---|
| `catalog.track.published` | Accueil · recherche · profil artiste · bibliothèque |
| `catalog.track.updated` | Métadonnées morceaux visibles |
| `catalog.track.deleted` | Retrait morceaux |
| `catalog.track.created` | Préparation catalogue public |
| `catalog.album.published` | Sorties profil artiste |
| `publication.approved` | Publication visible auditeur |
| `catalog.invalidate` | Refresh discovery ciblé |

## Événements bibliothèque (actifs)

| Événement | Effet |
|---|---|
| `listener.favorite.toggled` | Favoris · sidebar |
| `listener.playlist.updated` | Playlists · sidebar |

## Événements identité artiste (actifs)

| Événement | Effet |
|---|---|
| `creator.artist.updated` | Profil public `/listen/artist/[id]` |
| `artist.profile.updated` | Nom · bio · genres |
| `artist.avatar.updated` | Avatar |
| `artist.cover.updated` | Bannière |
| `artist.verification.updated` | Badge vérifié |
| `artist.badges.updated` | Badges |
| `artist.level.updated` | Niveau |
| `artist.statistics.updated` | Stats publiques |
| `profile.invalidate` · `identity.*` | Bridge LDSE → SRTSP |

## Notifications & social (actifs)

| Événement | Effet |
|---|---|
| `notifications.item.created` | Liste notifications |
| `social.follow.toggled` | Followers profil public |

## Préparation (sans consommation active)

| Événement | Statut |
|---|---|
| `streaming.session.*` | Historique récent — Session Engine LOCKED |
| `stream.play.recorded` | Compteurs écoutes |
| `wallet.royalty.generated` | N/A auditeur MVP |

## Ignorés

- `publication.draft.*` · upload wizard · metadata form

**Adaptateur :** `listener-hub-consumer.ts`  
**SSOT hook :** `useListenerSrtspLiveQuery.ts`
