# UX Certification Report — SONAFRIK MVP

> **Date :** 26 juin 2026 · **Statut :** 🔵 AUDIT DISCOVERY — non certifié  
> **Décision :** ❌ REFUSÉ (parcours LIVE CONTROL non signé)

---

## Résumé

| Zone | Note discovery | Commentaire |
|---|---|---|
| Loading / skeletons | 85/100 | 46 `loading.tsx`, tokens skeleton |
| Feedback utilisateur | 75/100 | Spinners OK, toasts limités |
| Animations | 60/100 | Violations CDC >300ms |
| Navigation | 80/100 | Prefetch root, Link prefetch listener |
| Cohérence visuelle | 88/100 | Tokens globals.css majoritaires |
| Accessibilité | 65/100 | Audit a11y non exécuté |
| Micro-interactions | 70/100 | Player OK, onboarding minimal |
| **GLOBAL UX** | **74/100** | |

---

## Écrans audités (discovery statique)

| Écran | Skeleton | Loading | Animations | Feedback erreur |
|---|---|---|---|---|
| `/listen` | ✅ Suspense | ✅ | 🟡 sections | Player banner |
| `/search` | ✅ dynamic | ✅ spinner | ✅ | Message vide |
| `/library` | ✅ | ✅ hook | ✅ | — |
| `/creator` | ✅ | ✅ | 🔴 count-up 1.5s | — |
| `/creator/analytics` | ✅ | 🟡 7 fetches | ✅ SVG | — |
| `/admin` | ✅ | ✅ RSC | ✅ | — |
| `/onboarding/*` | ❌ | ❌ segment | ✅ | — |
| `/legal/*` | ❌ | ❌ | ✅ | — |
| `/wallet` | ✅ | ✅ | ✅ | Modales lazy |

---

## Violations CDC animations

| Élément | Durée actuelle | Action recommandée |
|---|---|---|
| `.landing-pulse` | 2s | Landing public only — OK hors app |
| `.creator-pulse-cta` | 2s | Réduire 0.3s ou flag |
| `useCountUp` | 1500ms | 300ms max |
| `useAnimatedNumber` | 1200ms | 300ms max |
| `creator-fill-bar` | 0.8s | 0.3s |

---

## Zones « robotiques »

1. **Onboarding** — pas de skeleton, transition abrupte
2. **Recherche vide** — état initial peu guidé
3. **Analytics creator** — chargement long sans progression
4. **Erreurs réseau** — pas de toast global (player seulement)

---

## Améliorations proposées (sans alourdir)

| # | Amélioration | Effort | Flag |
|---|---|---|---|
| U1 | Skeleton onboarding 3 pages | S | `performance_skeleton_extended_enabled` |
| U2 | Barre progression analytics | S | — |
| U3 | Animations CDC conformes | M | `performance_animation_cdc_compliant_enabled` |
| U4 | Empty state search illustré | S | — |

---

## LIVE CONTROL

Checklist : [`../LIVE_CONTROL_PERFORMANCE.md`](../LIVE_CONTROL_PERFORMANCE.md)

**Statut :** 🟢 PRÊT — signature Rémy en attente.

---

## Décision

```
❌ UX CERTIFICATION — REFUSÉ
```

---

*Programme : [`../PERFORMANCE_UX_CERTIFICATION.md`](../PERFORMANCE_UX_CERTIFICATION.md)*
