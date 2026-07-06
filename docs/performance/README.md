# SONAFRIK — Performance & UX

> **Mode actuel :** Performance Continuous Improvement (PCI) · **6 juillet 2026**

---

## État officiel

```
🟢 GLOBAL ENTERPRISE CERTIFIED
Performance Hardening Program — TERMINÉ
GLOBAL FREEZE (hardening) — ACTIF
Mode — Performance Continuous Improvement (PCI)
```

Le développement métier **reprend** sous surveillance PCI.

---

## Documents actifs

| Fichier | Rôle |
|---|---|
| **[`PERFORMANCE_CONTINUOUS_IMPROVEMENT.md`](./PERFORMANCE_CONTINUOUS_IMPROVEMENT.md)** | **Gouvernance PCI officielle** — budgets, régressions, surveillance |
| [`PCI_MINI_REPORT_TEMPLATE.md`](./PCI_MINI_REPORT_TEMPLATE.md) | Template mini rapport par feature |
| [`reports/global-certification/GLOBAL_ENTERPRISE_CERTIFICATION_OFFICIAL_CLOSURE.md`](./reports/global-certification/GLOBAL_ENTERPRISE_CERTIFICATION_OFFICIAL_CLOSURE.md) | Certification finale GEC |
| [`reports/CORE_WEB_VITALS_REPORT.md`](./reports/CORE_WEB_VITALS_REPORT.md) | Seuils historiques MVP |
| [`reports/BUNDLE_ANALYSIS_REPORT.md`](./reports/BUNDLE_ANALYSIS_REPORT.md) | Analyse bundles |
| [`AFRICA_MODE.md`](./AFRICA_MODE.md) | Profils réseau 2G/3G/4G |

### Archive programme (FREEZE)

| Dossier | Contenu |
|---|---|
| [`reports/global-certification/`](./reports/global-certification/) | GEC · Forensics · CPU Cycles 1–3 · Shell decomposition |

---

## Budgets PCI (référence rapide)

| Métrique | Budget | Ambitieux |
|---|---|---|
| LCP | ≤ 3,5 s | ≤ 2,5 s |
| CLS | ≤ 0,10 | — |
| INP | ≤ 200 ms | — |
| TBT | ≤ 300 ms | — |

**P0 régression = interdit de fusionner.**

---

## Commandes

```powershell
pnpm build && pnpm typecheck && pnpm lint
pnpm test:web-navigation
pnpm test:srtsp
pnpm test:player
pnpm probe:performance          # gate discovery + docs
pnpm probe:performance-discovery
```

Lighthouse (manuel) : 3 runs mobile 4G · médiane · pages P0 touchées.

---

## Zones FREEZE

Ne pas rouvrir sans décision exceptionnelle :

- Sprints 1–7 Performance Hardening
- Investigations forensics · CPU Remediation Cycles 1–3
- Session Engine · Player Engine · SRTSP contracts

Optimisations PCI backlog = processus git normal.

---

*Source de vérité projet : [`docs/EXECUTION_LOG.md`](../EXECUTION_LOG.md)*
