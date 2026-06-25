# Publication Rollback — Phase 4.5

## Stratégie

Chaque étape du pipeline fournit un `rollback()` :

| Étape | Rollback |
|---|---|
| verify-context | no-op |
| validate-metadata | no-op (lecture seule) |
| simulate-isrc-reservation | efface `simulatedIsrc` |
| build-publication-package | efface `package` |
| validate-dependencies | no-op |
| prepare-persistence | efface `persistencePlan` |

## Déclenchement

Automatique via `PublicationTransaction.runStep()` à la première erreur.

## Échec rollback

Si une compensation échoue → `RollbackFailedError` avec liste des étapes en échec.

Helper : `executeWithRollback(transaction, step, execute, rollback)`.
