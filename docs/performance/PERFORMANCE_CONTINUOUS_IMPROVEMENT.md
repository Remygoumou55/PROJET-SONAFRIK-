# SONAFRIK — Performance Continuous Improvement (PCI)

## Gouvernance officielle post-certification

**Date d'entrée en vigueur :** 6 juillet 2026  
**Statut Performance Hardening Program :** 🟢 GLOBAL ENTERPRISE CERTIFIED — **TERMINÉ**  
**Mode actuel :** **Performance Continuous Improvement (PCI)**

---

## 1. État officiel

| Élément | Statut |
|---|---|
| Performance Hardening Program (Sprints 1–7) | 🟢 **TERMINÉ · FREEZE** |
| Investigations forensiques | **FREEZE** |
| Remédiations CPU (Cycles 1–3) | **FREEZE** |
| Global Enterprise Certification | 🟢 **CERTIFIÉE** (score 85/100) |
| **GLOBAL FREEZE (programme hardening)** | **ACTIF** — aucun nouveau sprint performance sans décision exceptionnelle |
| Développement métier | **AUTORISÉ** sous gouvernance PCI |

> **GLOBAL FREEZE** = gel du **programme de hardening** (sprints, forensics, cycles CPU).  
> Ce n'est **pas** un gel du développement produit.

---

## 2. Règle fondamentale

```
Performance FIRST
        mais
Business FIRST
```

Les performances ne doivent **plus bloquer** le développement normal. Toute optimisation est **opportuniste**, **mesurée** et **compatible** avec la feuille de route métier.

---

## 3. Budgets de performance

Les objectifs deviennent des **budgets évolutifs** (révisables avec la croissance produit).

| Métrique | Budget cible | Objectif ambitieux | Mesure |
|---|---:|---:|---|
| **LCP** | **≤ 3,5 s** | ≤ 2,5 s | Lighthouse mobile 4G · médiane 3 runs |
| **CLS** | **≤ 0,10** | ≤ 0,05 | Lighthouse |
| **INP** | **≤ 200 ms** | ≤ 150 ms | RUM / lab |
| **TBT** | **≤ 300 ms** | ≤ 200 ms | Lighthouse |
| **FCP** | ≤ 1,8 s | ≤ 1,2 s | Lighthouse |
| **TTFB** | ≤ 800 ms | ≤ 400 ms | Lighthouse |

### Baseline certifiée GEC (6 juil. 2026 — référence PCI)

| Route | LCP | TBT | CLS |
|---|---:|---:|---|
| `/listen` | ~3,7 s | 485–1 121 ms | 0 |
| `/creator` | ~3,3 s | ~385 ms | 0 |
| `/lancement` | **2,15 s** ✅ | ~145 ms | 0,046 |

Source : `reports/global-certification/gec-official-closure/`

**Toute régression au-dessus de la baseline + budget = incident PCI.**

---

## 4. Classification des régressions

| Niveau | Définition | Action |
|---|---|---|
| **P0** | Blocage critique — exploitation impossible ou budget largement dépassé sur page P0 | **Interdit de fusionner** |
| **P1** | Important — dégradation mesurable > 15 % vs baseline sur métrique budget | Corriger avant release majeure |
| **P2** | À corriger prochainement — dégradation 5–15 % | Backlog PCI sprint suivant |
| **P3** | Amélioration continue — micro-régression ou dette | Opportuniste |

**Aucune régression P0 ne peut être fusionnée.**

---

## 5. Surveillance continue

### Déclencheur

À chaque **nouvelle fonctionnalité importante** (nouvelle page P0, nouveau layout, nouveau runtime client, nouveau bundle > 20 kB, toucher Player/SRTSP/wallet).

### Checklist automatique

| Étape | Commande / outil |
|---|---|
| Build production | `pnpm build` |
| TypeScript | `pnpm typecheck` |
| ESLint | `pnpm lint` |
| Tests régression | `pnpm test:web-navigation` · `pnpm test:srtsp` · `pnpm test:player` |
| Lighthouse | Pages P0 touchées · 3 runs · médiane |
| Core Web Vitals | Extraire LCP · CLS · INP · FCP · TTFB · TBT |
| Bundle analysis | `pnpm build` → First Load JS routes touchées |
| CPU profile | Si runtime touché (player, layout listener, bridge) |

### Livrable obligatoire

**Mini rapport PCI** — template : [`PCI_MINI_REPORT_TEMPLATE.md`](./PCI_MINI_REPORT_TEMPLATE.md)  
Dépôt : `docs/performance/reports/pci/<YYYY-MM-DD>-<feature-slug>.md`

---

## 6. Revues de performance

Revue PCI obligatoire **avant** :

- chaque version majeure (web ou mobile) ;
- toute mise en production importante ;
- chaque publication mobile (Expo/EAS) ;
- toute nouvelle architecture temps réel (SRTSP, LDSE, hubs).

Format : baseline GEC + budgets §3 + classification régression §4.

---

## 7. Backlog continu (autorisé)

Optimisations **indépendantes des features métier** — processus git normal (commit/push habituel) :

- bundles · imports · images · audio · cache
- préchargement intelligent · React · Next.js
- mémoire · batterie mobile · réseau mobile · Web Vitals

### Interdit sans ADR + décision exceptionnelle

- Nouveau Sprint Performance Hardening
- Modification Session Engine (LOCKED)
- Refonte Player / SRTSP / Event Contracts
- Optimisation « programme » multi-sprints

---

## 8. Contraintes invariantes

Toute optimisation PCI doit :

- être **mesurée** avant/après ;
- être **documentée** (mini rapport ou entrée `EXECUTION_LOG.md`) ;
- **ne pas casser** le comportement fonctionnel ;
- respecter **SRTSP** · **Player** · **APIs** · **sécurité** · **isolation silos**.

---

## 9. Zones FREEZE (ne pas rouvrir)

| Zone | Raison |
|---|---|
| Sprints 1–7 Performance Hardening | Certifiés GEC |
| Main Thread Forensics | Clôturé |
| CPU Precision Remediation Cycles 1–3 | Clôturé |
| Application Shell Decomposition (programme) | Livré |
| Global Enterprise Certification | Clôturée |

Référence historique : `reports/global-certification/`

---

## 10. Références

| Document | Rôle |
|---|---|
| [`GLOBAL_ENTERPRISE_CERTIFICATION_OFFICIAL_CLOSURE.md`](./reports/global-certification/GLOBAL_ENTERPRISE_CERTIFICATION_OFFICIAL_CLOSURE.md) | Certification finale |
| [`CORE_WEB_VITALS_REPORT.md`](./reports/CORE_WEB_VITALS_REPORT.md) | Seuils historiques MVP |
| [`PCI_MINI_REPORT_TEMPLATE.md`](./PCI_MINI_REPORT_TEMPLATE.md) | Template surveillance |
| [`docs/EXECUTION_LOG.md`](../EXECUTION_LOG.md) | Journal actif |

---

*Performance Continuous Improvement — SONAFRIK Enterprise Performance Governance · v1.0 · 6 juillet 2026*
