# ISRC Engine — Registry

## In-memory registry (Phase 2.5)

`ISRCRegistryImpl` provides:

| Operation | Description |
|---|---|
| `register(isrc)` | Add entry (throws on duplicate) |
| `lookup(isrc)` | Find by canonical value |
| `exists(isrc)` | Boolean check |
| `updateStatus(isrc, status)` | Lifecycle transition |
| `findByStatus(status)` | Filter by status |

## Status lifecycle

```
available → reserved → active
                ↓
            available (release)
                
active / available / reserved → archived
active / available / reserved → deleted
```

## Reservation service

`ISRCReservationService` manages concurrent access:

- `reserve(isrc, actorId, correlationId)` — mutex-protected
- `release(isrc, ...)` — return to available
- `commit(isrc, ...)` — mark active

## Persistence (Phase 3)

`ISRCRepository` interface + `InMemoryISRCRepository` reference implementation.

Supabase adapter will implement `ISRCRepository` without modifying registry logic.

## Thread safety

All mutating registry operations use `AsyncMutex` with configurable timeout.
