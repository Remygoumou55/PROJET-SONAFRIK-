# Publication Transactions — Phase 4.5

## PublicationTransaction

Saga-style compensations :

```typescript
const tx = new PublicationTransaction();
await tx.runStep(step, execute, rollback);
// En cas d'échec → rollbackAll() automatique
```

## Garanties

- Aucun état partiel après échec
- Compensations exécutées en ordre inverse
- `RollbackFailedError` si compensation partielle

## Dry-run

Aucune transaction persistence réelle en Phase 4.5. Les rollbacks annulent uniquement l'état en mémoire (ISRC simulé, package, plan).
