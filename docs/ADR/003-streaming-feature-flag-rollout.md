# ADR-003 — Rollout progressif Streaming Runtime par feature flags

**Statut :** Accepté  
**Date :** 2026-06-25  
**Contexte :** SPRING 2.8 — intégration MVP sans régression

## Contexte

La Publication Platform (Phase 5) a validé le pattern :
- flags `enabled=false` par défaut en DB
- `PublicationIntegrationService` bridge legacy ↔ orchestrateur
- rollback instantané (désactiver flag = retour RPC legacy)

Le player web et mobile sont en production — toute régression Real Listen bloque la chaîne royalties.

## Décision

Répliquer le pattern pour chaque sous-phase SPRING 2 :

| Flag (proposé) | Sous-phase |
|---|---|
| `streaming_runtime_enabled` | 2.1 — active Application + Runtime |
| `streaming_session_engine_enabled` | 2.2 |
| `streaming_playback_engine_enabled` | 2.3 |
| `streaming_analytics_engine_enabled` | 2.4 |
| `streaming_antifraud_engine_enabled` | 2.5 |
| `stream_ledger_enabled` | 2.6 |
| `streaming_mvp_integration_enabled` | 2.8 — bascule complète |

`StreamingIntegrationService` (à créer en 2.8) wrappe `StreamingService` legacy.

## Règles de rollout

1. **Un flag à la fois** en staging → prod
2. **Canary** : activer pour `%` users via `system_settings` (extension future) ou admin test accounts
3. **Rollback** : `UPDATE feature_flags SET enabled=false` — effet immédiat prochain heartbeat
4. **Observabilité** : métriques `streaming_runtime_*` (succès, échecs, rollbacks, latence)

## Conséquences

Coexistence 2 code paths pendant plusieurs sprints — acceptable pour zéro downtime.

## Alternatives rejetées

| Alternative | Raison |
|---|---|
| Big-bang cutover | Risque régression Real Listen inacceptable |
| Branch longue sans merge | Divergence legacy/nouveau |

Voir `docs/streaming/FeatureFlags.md` pour matrice détaillée.
