# Publication Pipeline — Phase 4.5

## Architecture

Chaque étape implémente `PublicationPipelineStepHandler` :

```typescript
interface PublicationPipelineStepHandler {
  readonly stepId: string;
  readonly order: number;
  execute(state: PublicationPipelineState): Promise<PublicationPipelineState>;
  rollback(state: PublicationPipelineState): Promise<void>;
}
```

## Extensibilité

- `createDefaultPublicationPipeline(metadataService, extraSteps?)` — trie par `order`
- `createPublicationPipelineRegistry(steps)` — lookup par `stepId`

## État partagé

`PublicationPipelineState` transporte :

- contexte, requête
- metadata (DTO)
- `simulatedIsrc`, `isrcSimulated`
- `package`, `persistencePlan`

## Remplaçabilité

Toute étape peut être substituée ou complétée sans toucher `PublicationOrchestrator`.
