# ADR-001 — Transport Abstraction Layer

**Statut :** Accepté  
**Date :** 2026-07-05  
**Contexte :** SRTSP Enterprise v1.1

## Décision

Le moteur SRTSP ne dépend d'aucune technologie transport. Toute connectivité passe par `TransportManager` implémentant `SrtspTransportLayer`.

## Adaptateurs

| Adaptateur | MVP | Statut |
|---|---|---|
| noop | Oui (défaut) | Actif |
| polling | Préparé | Testable, non connecté prod |
| supabase | Phase 2 | Stub |
| websocket | Phase 3 | Stub |
| sse | Phase 3 | Stub |

## Conséquences

- Reconnexion centralisée dans `TransportManager`
- Timeout connect configurable (`connectTimeoutMs`)
- Journal d'erreurs transport via `EventJournal`
