# Documentation SONAFRIK — Index
## Mis à jour au 26 juin 2026 · Réconciliation v2 complète

---

## En 30 secondes

1. Lire **[`EXECUTION_LOG.md`](./EXECUTION_LOG.md)** section **« ÉTAT MESURÉ AU 26 JUIN 2026 »**
2. Score MVP : **76/100** · Probes : **130/130** · DB live vérifiée
3. Ne **jamais** utiliser un fichier dans `archive/` comme état actuel

---

## Source de vérité unique

| Fichier | Rôle |
|---|---|
| **[`EXECUTION_LOG.md`](./EXECUTION_LOG.md)** | État projet, sprints, métriques DB, P0/P1 |
| **[`README.md`](./README.md)** | Ce index |

---

## Documents actifs (à jour)

| Document | Rôle |
|---|---|
| [`MVP_SCOPE_LOCK.md`](./MVP_SCOPE_LOCK.md) | Périmètre produit MVP · chaîne E2E |
| [`AI_GOVERNANCE.md`](./AI_GOVERNANCE.md) | Comportement IA · ordre de lecture |
| [`NOUVELLE_REGLE_DE_TRAVAIL.md`](./NOUVELLE_REGLE_DE_TRAVAIL.md) | Workflow S0–S23 page par page |
| [`P0-2-PHASE-2-ORANGE-MONEY.md`](./P0-2-PHASE-2-ORANGE-MONEY.md) | Checklist Orange Money GN |
| [`PAIEMENTS.md`](./PAIEMENTS.md) | Architecture paiements |
| [`DOMAIN_MAP.md`](./DOMAIN_MAP.md) | Cartographie domaines code |
| [`DEPENDENCY_RULES.md`](./DEPENDENCY_RULES.md) | Règles imports / couplage |
| [`CDC-v9.0.md`](./CDC-v9.0.md) | Cahier des charges |
| [`ADR/`](./ADR/) | Décisions d'architecture |
| [`streaming/SPRING_2_MVP_INTEGRATION.md`](./streaming/SPRING_2_MVP_INTEGRATION.md) | Intégration Runtime → app (discovery 26 juin) |
| [`streaming/LIVE_CONTROL_SPRING2.md`](./streaming/LIVE_CONTROL_SPRING2.md) | Checklist LIVE CONTROL Rémy |
| [`streaming/`](./streaming/) | Specs streaming (SPRING 2) |
| [`performance/`](./performance/) | Certification UX & Performance MVP |
| [`metadata/`](./metadata/) | Specs metadata / ISRC |
| [`DEV_LOGIN.md`](./DEV_LOGIN.md) | Comptes dev local |
| [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md) | Guide admin (vérifier noms tables) |
| [`RPC_REFERENCE.md`](./RPC_REFERENCE.md) | Référence RPC Supabase |
| [`CHECKLIST_LAUNCH.md`](./CHECKLIST_LAUNCH.md) | Checklist lancement |
| [`PAYMENTS_LAUNCH_CHECKLIST.md`](./PAYMENTS_LAUNCH_CHECKLIST.md) | Credentials + sandbox retraits |
| [`MVP_DB_SCOPE.md`](./MVP_DB_SCOPE.md) | Tables MVP vs gel post-MVP |
| [`MVP_PACKAGE_FREEZE.md`](./MVP_PACKAGE_FREEZE.md) | Gel metadata/persistence/mobile |
| [`MIGRATIONS_POLICY.md`](./MIGRATIONS_POLICY.md) | Politique migrations SQL |
| [`HTML_DOCS_INDEX.md`](./HTML_DOCS_INDEX.md) | Index guides HTML |

Racine : [`CLAUDE.md`](../CLAUDE.md) · Règles Cursor : [`.cursor/rules/`](../.cursor/rules/)

---

## Documents archivés (`docs/archive/`)

**Historique uniquement.** Stubs redirect à la racine `docs/`.

| Archive | Date figée | Pourquoi archivé |
|---|---|---|
| [`MASTER_PLAN.md`](./archive/MASTER_PLAN.md) | 24 juin | Score 78/100, ComingSoon obsolètes |
| [`PLAN_CORRECTION_360.md`](./archive/PLAN_CORRECTION_360.md) | 23 juin | Score 88/100, probes 103/103 |
| [`RAPPORT_COLLECTION.md`](./archive/RAPPORT_COLLECTION.md) | 24 juin | Remplacé par EXECUTION_LOG |
| [`RAPPORT-CERTIFICATION-GLOBALE.md`](./archive/RAPPORT-CERTIFICATION-GLOBALE.md) | 23 juin | Pré-Vague F, 103/103 |
| [`AUDIT-GLOBAL-HANDOFF-IA.md`](./archive/AUDIT-GLOBAL-HANDOFF-IA.md) | 23 juin | Handoff IA périmé |
| [`AUDIT-COMPLET-HISTORIQUE.md`](./archive/AUDIT-COMPLET-HISTORIQUE.md) | 20 juin | Chronologie audits V1–V3 |

Stubs : [`MASTER_PLAN.md`](./MASTER_PLAN.md) · [`PLAN_CORRECTION_360.md`](./PLAN_CORRECTION_360.md) · [`RAPPORT_COLLECTION.md`](./RAPPORT_COLLECTION.md) · [`RAPPORT-CERTIFICATION-GLOBALE.md`](./RAPPORT-CERTIFICATION-GLOBALE.md) · [`AUDIT-GLOBAL-HANDOFF-IA.md`](./AUDIT-GLOBAL-HANDOFF-IA.md) · [`AUDIT-COMPLET-HISTORIQUE.md`](./AUDIT-COMPLET-HISTORIQUE.md)

---

## État mesuré (26 juin 2026)

### CI & build
- Probes : **130/130**
- Build : 9/9 packages · 47 routes Next.js
- Typecheck : 15/15 packages

### DB live (`cxjpburiiazzvlczzupy`)
| Métrique | Valeur |
|---|---|
| Profils | 189 |
| Tracks publiés | 48 |
| Artistes | 59 |
| Streams valides | 5 524 |
| `wallet_ledger` | 9 |
| `royalty_cycles` | 1 |

### Score MVP : 76/100

| Dimension | Score |
|---|---|
| Architecture | 92 |
| Build & types | 95 |
| Streaming & catalog | 90 |
| UI & pages | 85 |
| Sécurité | 88 |
| Chaîne financière | 45 |
| Tests MVP | 45 |

### P0/P1 terminés
- P0-1 Git · P0-3 CI 129/129 · P0-2 Phase 1 wallet_ledger
- P1 `/lancement` DB réelle · P1 CORS 14 edge functions

### Bloquant lancement public
- Tests wallet/payments (0)
- Orange Money Phase 2 prod
- E2E chaîne financière complète

---

## Onboarding IA (ordre obligatoire)

```
1. docs/README.md          ← vous êtes ici
2. docs/EXECUTION_LOG.md   ← ÉTAT MESURÉ + 5 dernières entrées
3. docs/MVP_SCOPE_LOCK.md
4. CLAUDE.md
5. docs/CDC-v9.0.md
```

---

## Commandes

```powershell
pnpm probe:certification   # 129 checks — gate CI
pnpm probe:performance     # Performance & UX discovery gate
pnpm build && pnpm lint && pnpm typecheck
```

---

*Ne plus citer 88/100, 68/100, 78/100 ou 103/103 comme état actuel.*
