# SRTSP — Connection State Machine

## États transport

```
        ┌─────────┐
        │ online  │◄────────────────┐
        └────┬────┘                 │
             │ navigator.offline     │ navigator.online
             ▼                       │
        ┌─────────┐    success    ┌┴────────┐
        │ offline │──────────────►│reconnect│
        └─────────┘               └─────────┘
             │                       │
             │ buffer events         │ retry transport
             └───────────────────────┘
```

## États événement publication

```
publish(input)
    │
    ├─► guard.assertCanPublish()
    ├─► registry.validatePayload()
    ├─► deduplication.isDuplicate? ──► drop (idempotent)
    ├─► offline? ──► OfflineBuffer
    └─► deliver()
            ├─► EventQueue.enqueue
            ├─► EventBus.deliver
            └─► EventDispatcher → destination handlers
```

## Idempotence

- Clé : `dedupeKey` explicite ou `name + JSON(payload)`
- Fenêtre TTL : 30 000 ms (configurable)
- Max entries : 10 000

## Retry queue

- Max retries : 3
- Backoff : 50ms × 2^attempt
