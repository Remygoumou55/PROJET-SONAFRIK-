# Tables metadata — Post-MVP (gelées)

Les 10 tables `metadata_*` en DB live sont **intentionnellement hors MVP Core**.

| Table | Usage actuel |
|---|---|
| `metadata_records` | `packages/persistence` + tests |
| `metadata_audit_log` | Idem |
| `metadata_fingerprint_records` | Idem |
| `metadata_isrc_registry` | Idem |
| `metadata_isrc_sequence` | Idem |
| `metadata_platform_health` | Idem |
| `metadata_registry_index` | Idem |
| `metadata_release_records` | Idem |
| `metadata_upc_registry` | Idem |
| `metadata_version_snapshots` | Idem |

## Décision War Plan C2

- **Ne pas supprimer** les tables (coût migration + publication Sprint futur)
- **Ne pas brancher UI** avant validation chaîne MVP Core E2E réelle
- Code `packages/metadata` + `packages/persistence` = **gelé** jusqu'à Sprint Publication validé

## Quand activer

Après : credentials prod + LIVE CONTROL + 1 parcours artiste publication E2E en staging.
