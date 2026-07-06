# Catalogue Artiste — SRTSP Event Consumption (Phase 3.4)

| Événement | Écoute | Effet Catalogue Hub |
|---|---|---|
| `publication.submitted` | ✅ | KPIs + statuts en revue |
| `publication.approved` | ✅ | Morceau publié visible |
| `publication.rejected` | ✅ | Statut rejeté cohérent |
| `publication.deleted` | ✅ | Entrée retirée |
| `publication.cancelled` | ✅ | Résumé cohérent |
| `catalog.track.created` | ✅ | Nouveau morceau |
| `catalog.track.updated` | ✅ | Métadonnées actualisées |
| `catalog.track.deleted` | ✅ | Morceau retiré |
| `catalog.track.published` | ✅ | Publication effective |
| `catalog.album.published` | ✅ | Sortie / album actualisé |
| `catalog.invalidate` | ✅ | Invalidation cache ciblée |
| `creator.artist.updated` | ✅ | Hub profil (préparation) |

## Ignorés (bruit wizard / progress local)

- `publication.draft.*`
- `publication.audio.uploaded`
- `publication.cover.uploaded`
- `publication.metadata.completed`

## Surfaces consommatrices

| Surface | Hook |
|---|---|
| `/creator/catalog` (KPIs) | `useCatalogContextSrtspLive` |
| `/creator/catalog/releases` | `useReleasesSrtspLive` |
| `/creator/catalog/tracks` | `usePublicationsSrtspLive` *(Phase 3.2 — gelé)* |

**Adaptateur :** `creator-catalog-consumer.ts` — `shouldRefreshCreatorCatalog`
