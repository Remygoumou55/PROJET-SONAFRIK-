# Error Mapping

Vendor errors must **never** reach the Metadata Engine raw.

## Hierarchy

| Class | Code | When |
|---|---|---|
| `PersistenceError` | base | All persistence failures |
| `RepositoryError` | `persistence_unknown` | Generic repo failure |
| `TransactionError` | `persistence_transaction` | Commit/rollback conflict |
| `TimeoutError` | `persistence_timeout` | Operation timeout |
| `ConflictError` | `persistence_conflict` | Optimistic lock |
| `DuplicateError` | `persistence_duplicate` | Unique violation |
| `NotFoundError` | `persistence_not_found` | Missing record |
| `ConstraintError` | `persistence_constraint` | FK/check violation |
| `StorageError` | `persistence_storage` | Unclassified storage error |
| `PersistenceNotReadyError` | `persistence_not_ready` | Tables not migrated |

## Normalizer

```typescript
import { mapVendorError } from "@sonafrik/persistence";

try {
  await adapter.saveEntry(entry, ctx);
} catch (e) {
  throw mapVendorError(e); // never raw PostgrestError
}
```

## Mappings

| Vendor signal | Normalized |
|---|---|
| `23505`, `unique`, `duplicate` | `DuplicateError` |
| `PGRST116`, `not found`, `0 rows` | `NotFoundError` |
| `relation ... does not exist` | `PersistenceNotReadyError` |
| `timeout`, `timed out` | `TimeoutError` |
| `conflict`, `version` | `ConflictError` |
| `constraint`, `foreign key`, `23503` | `ConstraintError` |

Types: `PersistenceErrorCode` in `@sonafrik/types/metadata/persistence`.
