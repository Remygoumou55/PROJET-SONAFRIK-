# SRTSP v1.1 — FREEZE DÉFINITIF

**Package :** `@sonafrik/realtime` v1.1.0  
**Date freeze :** 2026-07-05  
**Statut :** 🧊 CERTIFICATION ENTERPRISE

## Périmètre gelé

```
packages/core/realtime/**
docs/realtime/**
```

## Modification autorisée uniquement si

- Bug critique prouvé avec reproduction
- Faille de sécurité documentée

## Interdit sans ADR

- Modifier les contrats d'événements (`SRTSP_DOMAIN_EVENTS`) sans migration version
- Brancher transport sans passer par `TransportManager`
- Contourner `EventGuard` ou RLS

## Intégration app (hors freeze package)

- `apps/web/src/features/shared/srtsp/` — bridge LDSE (v1.0)
- Modules certifiés : **NE PAS MODIFIER**
