# Documentation SONAFRIK — Index
## Mis à jour au 26 juin 2026

---

## Source de vérité unique

**[`docs/EXECUTION_LOG.md`](./EXECUTION_LOG.md)** — État actuel du projet, certifications, sprints.

C'est le **seul** document à lire pour connaître l'état réel. Score MVP mesuré : **76/100**.

---

## Documents actifs

| Document | Rôle | Fiabilité |
|---|---|---|
| [`EXECUTION_LOG.md`](./EXECUTION_LOG.md) | Journal technique · Source unique | ⭐⭐⭐⭐⭐ |
| [`MVP_SCOPE_LOCK.md`](./MVP_SCOPE_LOCK.md) | Périmètre produit MVP | ⭐⭐⭐⭐ |
| [`P0-2-PHASE-2-ORANGE-MONEY.md`](./P0-2-PHASE-2-ORANGE-MONEY.md) | Checklist intégration Orange Money | ⭐⭐⭐⭐⭐ |
| [`ADR/`](./ADR/) | Décisions d'architecture | ⭐⭐⭐⭐ |
| [`streaming/`](./streaming/) | Specs streaming (avance sur le code) | ⭐⭐⭐⭐ |
| [`AI_GOVERNANCE.md`](./AI_GOVERNANCE.md) | Règles gouvernance IA | ⭐⭐⭐⭐ |
| [`CDC-v9.0.md`](./CDC-v9.0.md) | Cahier des charges | ⭐⭐⭐⭐ |

---

## Documents archivés (ne plus utiliser comme état actuel)

| Document | Raison d'archivage |
|---|---|
| [`archive/PLAN_CORRECTION_360.md`](./archive/PLAN_CORRECTION_360.md) | Figé au 23 juin — score 88/100 obsolète |
| [`archive/RAPPORT_COLLECTION.md`](./archive/RAPPORT_COLLECTION.md) | Stale depuis 24 juin — remplacé par EXECUTION_LOG |

Stubs redirect : [`PLAN_CORRECTION_360.md`](./PLAN_CORRECTION_360.md) · [`RAPPORT_COLLECTION.md`](./RAPPORT_COLLECTION.md)

---

## Audits figés (historique uniquement)

| Document | Note |
|---|---|
| [`MASTER_PLAN.md`](./MASTER_PLAN.md) | Audit 24 juin — score 78/100, voir EXECUTION_LOG pour l'état actuel |
| [`RAPPORT-CERTIFICATION-GLOBALE.md`](./RAPPORT-CERTIFICATION-GLOBALE.md) | Certification 103/103 (pré-Vague F) |
| [`AUDIT-GLOBAL-HANDOFF-IA.md`](./AUDIT-GLOBAL-HANDOFF-IA.md) | Handoff IA — scores périmés |

---

## Score MVP au 26 juin 2026 : 76/100

| Dimension | Score |
|---|---|
| Architecture | 92/100 |
| Build & types | 95/100 |
| Streaming & catalog | 90/100 |
| UI & pages | 85/100 |
| Sécurité | 88/100 |
| Chaîne financière | 45/100 |
| Tests | 45/100 |

---

## État des P0/P1

### Terminés
- P0-1 : Git consolidé
- P0-3 : CI **129/129**
- P0-2 Phase 1 : `wallet_ledger` > 0 (9 entrées, 1 cycle)
- P1 : `/lancement` données réelles DB
- P1 : CORS fermé — 14 edge functions

### En cours / À venir
- Tests wallet/paiements (0 tests)
- Orange Money Phase 2 (credentials prod)
- Validation E2E chaîne financière complète

---

## Commandes de vérification

```powershell
pnpm probe:certification   # 129 checks
pnpm build && pnpm lint && pnpm typecheck
```
