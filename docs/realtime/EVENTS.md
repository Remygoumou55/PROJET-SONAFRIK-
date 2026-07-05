# SRTSP — Domain Events

## Nomenclature

Format : `domaine.entité.action`

Exemple : `catalog.track.updated`

## Constantes officielles

Import : `@sonafrik/realtime/events` → `SRTSP_DOMAIN_EVENTS`

| Événement | Nom | Version | Destinations |
|---|---|---:|---|
| TrackCreated | `catalog.track.created` | 1 | catalog, publications, dashboard |
| TrackUpdated | `catalog.track.updated` | 1 | catalog, publications, dashboard |
| TrackDeleted | `catalog.track.deleted` | 1 | catalog, publications, dashboard |
| TrackPublished | `catalog.track.published` | 1 | catalog, publications, dashboard, library |
| PublicationSubmitted | `publication.submitted` | 1 | publications, admin, dashboard |
| PublicationApproved | `publication.approved` | 1 | publications, catalog, dashboard |
| PublicationRejected | `publication.rejected` | 1 | publications, dashboard |
| WalletUpdated | `wallet.balance.updated` | 1 | wallet, dashboard |
| RoyaltyGenerated | `wallet.royalty.generated` | 1 | wallet, dashboard, analytics |
| StreamingStarted | `streaming.session.started` | 1 | streaming, analytics |
| NotificationCreated | `notifications.item.created` | 1 | notifications, * |

## Enveloppe événement

Chaque événement possède :

- `id` — UUID
- `name` — nom officiel
- `version` — version schéma
- `payload` — validé Zod
- `source` — domaine émetteur
- `destinations[]` — modules cibles
- `timestamp` — ms epoch
- `dedupeKey` — idempotence
- `actor` — contexte user (optionnel)

## Mapping LDSE legacy

`LDSE_TO_SRTSP_EVENT_MAP` traduit les événements LDSE existants vers SRTSP sans modifier les modules certifiés.
