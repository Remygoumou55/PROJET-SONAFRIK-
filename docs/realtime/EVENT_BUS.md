# SRTSP — Event Bus

## Responsabilité

Publication synchrone in-process et distribution aux listeners typés.

## API

```typescript
import { EventBus } from "@sonafrik/realtime";

const bus = new EventBus();
bus.deliver(event);
bus.subscribe("catalog.track.updated", listener);
bus.subscribeAll(listener);
bus.getStats();
```

## Via moteur (recommandé)

```typescript
import { getSynchronizationEngine } from "@sonafrik/realtime";

const engine = getSynchronizationEngine();
engine.publish({ name, payload, source });
```

## Règles

- Pas de logique métier dans le bus
- Pas d'accès DB direct
- Singleton process-wide côté client (`getSynchronizationEngine`)
