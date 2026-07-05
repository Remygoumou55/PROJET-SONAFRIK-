# SONAFRIK Real-Time Architecture (SRTSP v1.1)

## Vue d'ensemble

Package : `@sonafrik/realtime` v1.1.0 → `packages/core/realtime/`

**Enterprise v1.1** : contrats événements renforcés, TransportManager, EventJournal, Metrics API.

## Couches v1.1

```
Modules UI → SrtspProvider → SynchronizationEngine
  ├── EventRegistry + buildSrtspEventContract (SSOT contrats)
  ├── EventBus + SubscriptionManager + EventDispatcher
  ├── DeduplicationStore + EventQueue (retry/timeout)
  ├── OfflineBuffer + EventGuard + EventJournal
  ├── SrtspMonitor + getMetrics() API
  └── TransportManager (noop MVP · polling/supabase/ws/sse stubs)
```

## Metrics API (sans UI)

```typescript
engine.getMetrics(); // events, latency, retries, subscriptions, transport, errors
engine.getJournalRecent(20);
```

## Freeze

Voir `packages/core/realtime/FREEZE.md` — modification autorisée uniquement bug critique ou sécurité.

## Références

- `ADR-001-transport-abstraction.md`
- `EVENTS.md` · `EVENT_BUS.md` · `SUBSCRIPTIONS.md` · `HOOKS.md`
