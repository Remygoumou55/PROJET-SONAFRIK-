# ADR-001 — Architecture en couches du Streaming Runtime

**Statut :** Accepté  
**Date :** 2026-06-25  
**Contexte :** SPRING 2 — Streaming Runtime Enterprise Program

## Contexte

Le streaming MVP (Sprint 6) fonctionne via :
- `StreamingService` monolithique (`packages/api/src/streaming/`)
- 3 edge functions (`stream-start`, `stream-progress`, `stream-complete`)
- RPC PostgreSQL (`start_stream_session`, `update_stream_heartbeat`, `complete_stream_session`)
- Real Listen V7.2 (seuil 90 % serveur)

La logique est **dispersée** entre edge functions, service et SQL. Cela bloque :
- analytics fiables à l'échelle
- anti-fraude évolutif
- ledger financier traçable vers royalties

Le succès du **Metadata Platform** (Application → Orchestrator → Persistence) démontre le pattern viable sur SONAFRIK.

## Décision

Adopter une architecture en **8 couches** pour le Streaming Runtime :

```
UI (inchangée)
  → Streaming Application Services (CQRS)
    → Streaming Runtime (coordinateur)
      → Session Engine | Playback Engine | Analytics Engine | Anti-Fraud Engine
        → Stream Ledger (append-only)
          → Persistence (Supabase + adapters)
```

Les edge functions deviennent des **adaptateurs transport** — pas des moteurs métier.

## Conséquences

**Positives**
- Source de vérité unique pour sessions et événements financiers
- Testabilité (engines headless, ≥95 % coverage)
- Rollout progressif par feature flags (comme Publication Phase 5)
- Scalabilité : engines stateless, ledger append-only

**Négatives**
- Coexistence legacy + nouveau pendant 2.1→2.8
- Effort documentation et certification
- Migration progressive edge → application (risque régression si mal flaggé)

## Alternatives rejetées

| Alternative | Raison rejet |
|---|---|
| Enrichir `StreamingService` monolithique | Dette exponentielle, non testable à 98 % ledger |
| Remplacer par microservices externes | Over-engineering MVP (<10k users) — CDC |
| Tout en SQL/RPC uniquement | Anti-fraude et ledger nécessitent logique applicative typée |

## Conformité

- `CLAUDE.md` — Repository + Service Layer
- `MVP_SCOPE_LOCK.md` — écoute Real Listen préservée
- `DEPENDENCY_RULES.md` — isolation wallet/streaming
