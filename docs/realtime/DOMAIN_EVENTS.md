# SRTSP — Domain Events Reference

Source SSOT : `packages/core/realtime/src/registry/domain-events.ts`

## Catalog

- `catalog.track.created`
- `catalog.track.updated`
- `catalog.track.deleted`
- `catalog.track.published`
- `catalog.album.published`
- `catalog.invalidate`

## Publication workflow

- `publication.submitted`
- `publication.approved`
- `publication.rejected`

## Wallet

- `wallet.balance.updated`
- `wallet.royalty.generated`
- `wallet.withdrawal.updated`

## Streaming (futur intégration)

- `streaming.session.started`
- `streaming.session.paused`
- `streaming.session.ended`

## Listener / Social

- `listener.favorite.toggled`
- `listener.playlist.updated`
- `social.follow.toggled`

## Admin

- `admin.snapshot.invalidate`

## System

- `system.heartbeat`

Chaque définition inclut schéma Zod, version, source, destinations, description.
