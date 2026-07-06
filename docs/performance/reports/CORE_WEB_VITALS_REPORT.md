# Core Web Vitals Report — SONAFRIK

> **Date :** 26 juin 2026 · **Mis à jour PCI :** 6 juillet 2026  
> **Statut :** 🟢 GEC certifiée — budgets opérationnels → [`PERFORMANCE_CONTINUOUS_IMPROVEMENT.md`](../PERFORMANCE_CONTINUOUS_IMPROVEMENT.md)

---

## Budgets PCI (opérationnels — post-GEC)

| Métrique | Budget cible | Objectif ambitieux |
|---|---|---|
| **LCP** | **≤ 3,5 s** | ≤ 2,5 s |
| **CLS** | ≤ 0,10 | ≤ 0,05 |
| **INP** | ≤ 200 ms | ≤ 150 ms |
| **TBT** | ≤ 300 ms | ≤ 200 ms |

Baseline certifiée : `reports/global-certification/gec-official-closure/`

---

## Seuils MVP historiques (pré-PCI)

| Métrique | Bon (Google) | **Cible SONAFRIK MVP** | Pénalité certification |
|---|---|---|---|
| **LCP** | ≤2.5s | **≤2.5s** (4G) · ≤4s (3G) | Bloquant P0 |
| **INP** | ≤200ms | **≤200ms** | Bloquant |
| **CLS** | ≤0.1 | **≤0.1** | Bloquant |
| **FCP** | ≤1.8s | **≤1.8s** (4G) | Avertissement |
| **TTFB** | ≤0.8s | **≤0.8s** (Vercel edge) | Avertissement |

---

## Pages P0 — mesures requises

| Page | LCP | INP | CLS | FCP | TTFB | Mesuré |
|---|---|---|---|---|---|---|
| `/listen` | — | — | — | — | — | ❌ |
| `/search` | — | — | — | — | — | ❌ |
| `/listen/artist/[id]` | — | — | — | — | — | ❌ |
| `/library` | — | — | — | — | — | ❌ |
| `/auth/connexion` | — | — | — | — | — | ❌ |
| `/creator` | — | — | — | — | — | ❌ |
| `/lancement` | — | — | — | — | — | ❌ |

---

## Méthodologie de mesure

### Lighthouse (obligatoire)

```
Chrome DevTools → Lighthouse
- Mode : Navigation
- Device : Mobile
- Throttling : Simulated 4G (baseline)
- Throttling : Slow 4G (Africa Mode)
- URL : chaque page P0
- 3 runs → médiane
```

### Vercel Speed Insights (prod)

- Déjà autorisé CSP : `vitals.vercel-insights.com`
- Activer monitoring prod post-lancement

### Champ (Real User Monitoring)

- Sentry performance `tracesSampleRate: 0.1` — existant
- Ajouter agrégation LCP/INP si certification prod

---

## Hypothèses discovery (non mesurées)

| Page | LCP élément probable | Risque CLS |
|---|---|---|
| `/listen` | Hero ou première row trending | Covers lazy — faible |
| `/search` | Input + premiers résultats | Faible |
| `/listen/artist/[id]` | Cover artiste large | Moyen si sans dimensions |
| `/library` | Liste playlists | Faible |
| Player fixe bottom | — | **Risque CLS** au mount WebPlayer |

**Action :** réserver espace player (`min-height`) avant hydration — à vérifier LIVE CONTROL.

---

## Facteurs positifs (architecture)

- RSC homepage `/listen` avec cache 300s
- `next/image` + blur placeholder `CoverImage`
- Font `display: swap` Montserrat
- `WebPlayer` `dynamic(ssr:false)` — évite hydration audio lourde

---

## Facteurs négatifs (risque CWV)

- 119 client components — hydration cost
- Player mount client — possible CLS
- Sentry replay script
- Pas de `sizes` explicites partout sur covers

---

## Procédure post-LIVE CONTROL

1. Rémy remplit tableau mesures dans ce fichier
2. Pages hors seuil → ticket optimisation + flag `performance_*`
3. Re-mesure après correctif
4. Toutes P0 vertes → mise à jour décision programme

---

## Décision

```
❌ CORE WEB VITALS — NON MESURÉ
```

**Prochaine action :** exécuter Lighthouse 3× sur `/listen` (mobile 4G) — première mesure officielle.

---

*Checklist : [`../LIVE_CONTROL_PERFORMANCE.md`](../LIVE_CONTROL_PERFORMANCE.md)*
