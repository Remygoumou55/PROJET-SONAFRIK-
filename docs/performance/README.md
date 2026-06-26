# SONAFRIK — Performance & UX Certification

> Programme officiel MVP · Mis à jour au 26 juin 2026

---

## Documents

| Fichier | Rôle |
|---|---|
| [`PERFORMANCE_UX_CERTIFICATION.md`](./PERFORMANCE_UX_CERTIFICATION.md) | Programme complet phases A→N |
| [`LIVE_CONTROL_PERFORMANCE.md`](./LIVE_CONTROL_PERFORMANCE.md) | Checklist validation manuelle Rémy |
| [`AFRICA_MODE.md`](./AFRICA_MODE.md) | Profils réseau 2G/3G/4G/instable |
| [`reports/PERFORMANCE_CERTIFICATION_REPORT.md`](./reports/PERFORMANCE_CERTIFICATION_REPORT.md) | Rapport certification performance |
| [`reports/UX_CERTIFICATION_REPORT.md`](./reports/UX_CERTIFICATION_REPORT.md) | Rapport certification UX |
| [`reports/BUNDLE_ANALYSIS_REPORT.md`](./reports/BUNDLE_ANALYSIS_REPORT.md) | Analyse bundles Next.js |
| [`reports/CORE_WEB_VITALS_REPORT.md`](./reports/CORE_WEB_VITALS_REPORT.md) | LCP · INP · CLS · FCP · TTFB |

---

## Commandes

```powershell
pnpm probe:performance-discovery   # Phase A — audit automatique
pnpm probe:performance             # Gate certification (discovery + docs)
```

---

## État actuel (26 juin 2026)

```
❌ PERFORMANCE & UX CERTIFICATION PROGRAM REFUSÉ
```

**Motif :** discovery complété, mesures CWV/bundle/LIVE CONTROL non exécutées.

**Prochaine étape :** LIVE CONTROL Rémy → mesures Lighthouse → optimisations flag par flag.

---

## Architecture freeze

Ne pas modifier pour ce programme :

- Runtime Foundation · Session Engine · Playback Runtime
- Wallet · Royalties · Publication Platform · Metadata Engine

Optimisations = `apps/web/`, hooks, assets, cache, feature flags `performance_*`.

---

*Source de vérité projet : [`docs/EXECUTION_LOG.md`](../EXECUTION_LOG.md)*
