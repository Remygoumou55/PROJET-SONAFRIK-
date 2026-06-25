# SONAFRIK — Streaming Runtime Enterprise (SPRING 2)

> Programme officiel post-certification Publication Platform (Metadata Phase 5).  
> **Statut programme :** ✅ CERTIFIÉ — 2026-06-25

## Documents

| Document | Rôle |
|---|---|
| [SPRING_2_PROGRAM.md](./SPRING_2_PROGRAM.md) | Programme complet — architecture, roadmap, sous-phases, certification |
| [STATE_MACHINE.md](./STATE_MACHINE.md) | **Référence absolue** — machines à états playback + session |
| [DOMAIN_EVENTS.md](./DOMAIN_EVENTS.md) | **Référence officielle** — catalogue Domain Events métier |
| [SEQUENCE_DIAGRAMS.md](./SEQUENCE_DIAGRAMS.md) | **Référence officielle** — scénarios d'exécution (séquences) |
| [Architecture.md](./Architecture.md) | Vue technique détaillée (as-is → to-be) |
| [Certification.md](./Certification.md) | Critères de certification par sous-phase |
| [FeatureFlags.md](./FeatureFlags.md) | Stratégie feature flags & rollback |
| [Risks.md](./Risks.md) | Registre des risques & mitigations |

## Références transverses

- `docs/DOMAIN_MAP.md` — cartographie des domaines
- `docs/DEPENDENCY_RULES.md` — règles d'import & couplage
- `docs/ADR/` — décisions d'architecture
- `docs/MVP_SCOPE_LOCK.md` — périmètre MVP préservé
- `docs/CDC-v9.0.md` — Real Listen ≥90 %, URLs signées serveur

## Sous-phases (ordre d'exécution)

```
SPRING 2.1  Foundation
SPRING 2.2  Playback Session Engine
SPRING 2.3  Playback Runtime Engine
SPRING 2.4  Streaming Analytics Engine
SPRING 2.5  Anti-Fraud Engine
SPRING 2.6  Stream Ledger
SPRING 2.7  Streaming Certification
SPRING 2.8  MVP Integration
```

**Aucune sous-phase n'est implémentée dans ce livrable** — planification uniquement.
