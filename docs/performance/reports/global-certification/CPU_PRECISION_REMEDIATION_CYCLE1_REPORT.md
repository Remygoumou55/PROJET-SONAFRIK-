# CPU Precision Remediation — Cycle 1 Report

**Date :** 6 juillet 2026  
**Programme :** Performance Hardening — CPU Precision Remediation  
**Cycle :** 1 uniquement — prefetch Wallet différé après LCP  
**Gouvernance :** aucun commit · aucun push

---

## 1. Correction appliquée

**Reporter le prefetch du layout Wallet après le LCP.**

- `Link prefetch={false}` pour `/wallet` tant que LCP non atteint
- Exclusion de `/wallet` du batch idle `useSmartPrefetch` pré-LCP
- Prefetch explicite de `/wallet` via `prefetchRoute` **après** signal LCP
- Même logique sur nav mobile et sidebar desktop

---

## 2. Justification

Rapport **Main Thread Execution Forensics** — Correction **B** (ROI #1) :

- `(wallet)/layout-*.js` : **161 ms scripting** + **long task 164 ms à 3 407 ms** (avant LCP 3 734 ms)
- Source : `MobileBottomNav` + `SidebarNavItem` — `useSmartPrefetch` + `Link prefetch`

---

## 3. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `apps/web/src/features/listener/hooks/useAfterLCP.ts` | **Nouveau** — observer `largest-contentful-paint` |
| `apps/web/src/features/listener/components/ListenerMobileBottomNav.tsx` | Prefetch wallet différé + prefetch post-LCP |
| `apps/web/src/features/listener/components/SidebarNavItem.tsx` | Prefetch wallet différé si `href === /wallet` |

---

## 4–6. Lighthouse & Core Web Vitals

### `/listen` — avant (baseline `shell-decomposition/lighthouse-listen-run3.json`)

| Métrique | Valeur |
|---|---:|
| LCP | 3 734 ms |
| FCP | 1 100 ms |
| TBT | 1 492 ms |
| CLS | 0 |
| Script Evaluation | 2 428 ms |
| Main Thread | 5 163 ms |
| Long Tasks | 15 |

### `/listen` — après Cycle 1 (3 runs frais)

| Run | LCP | FCP | TBT | Script Eval | Long Tasks |
|---:|---:|---:|---:|---:|---:|
| 1 | 6 381 | — | — | — | — |
| **2 (best)** | **3 746** | **1 388** | **883** | **2 129** | **10** |
| 3 | 4 075 | — | 1 129 | 2 287 | — |
| **Médiane** | **4 075** | — | **1 129** | **2 287** | — |

Rapports : `cpu-cycle1/lighthouse-listen-run{1,2,3}.json`

### `/creator` & `/lancement` (non ciblés — variance seule)

| Route | LCP après |
|---|---:|
| `/creator` | 3 160 ms |
| `/lancement` | 2 215 ms |

---

## 7–8. CPU avant / après (best run `/listen`)

| Métrique | Avant | Après (run 2) | Δ |
|---|---:|---:|---:|
| Main Thread total | 5 163 ms | 4 620 ms | **−543 ms** |
| Bootup scripting wallet layout | **161 ms** (top scripts) | **absent** du top bootup | **−161 ms** |
| Long task wallet avant LCP | **164 ms @ 3 407 ms** | **0** (absent long-tasks) | **✅ éliminé** |

---

## 9–10. Script Evaluation

| | Avant | Après (run 2) | Δ |
|---|---:|---:|---:|
| Script Evaluation | 2 428 ms | 2 129 ms | **−299 ms (−12 %)** |

---

## 11–12. Long Tasks

| | Avant | Après (run 2) |
|---|---:|---:|
| Count | 15 | **10** |
| Wallet layout task | 164 ms (avant LCP) | **Aucune** |

---

## 13–14. LCP

| | Avant | Après (best) | Après (médiane) |
|---|---:|---:|---:|
| LCP | 3 734 ms | 3 746 ms | 4 075 ms |

**Interprétation :** gain LCP non significatif (variance lab ±1 s). Le prefetch wallet n'était pas le goulot LCP principal.

---

## 15–16. TBT

| | Avant | Après (run 2) | Δ |
|---|---:|---:|---:|
| TBT | 1 492 ms | **883 ms** | **−609 ms (−41 %)** |

---

## 17. Régressions

| Zone | Statut |
|---|---|
| build / lint / typecheck | ✅ |
| test:web-navigation 13/13 | ✅ |
| test:srtsp 100/100 | ✅ |
| test:player 15/15 | ✅ |
| LCP element | ✅ cover SSR (`img.object-cover`) |
| Navigation /wallet post-LCP | ✅ prefetch déclenché après LCP |

---

## 18. Gains mesurés (attribués Cycle 1)

| Métrique | Gain mesuré (best run) | Preuve |
|---|---:|---|
| Wallet long task pré-LCP | **−164 ms** | long-tasks : absent vs start 3 407 ms |
| Wallet bootup top scripts | **−161 ms** | bootup-time : absent vs 161 ms |
| Script Evaluation | **−299 ms** | mainthread-work-breakdown |
| TBT | **−609 ms** | total-blocking-time |
| LCP | ~0 ms | variance |

---

## 19. Conclusion

Le Cycle 1 **atteint son objectif technique** : le layout Wallet n'est plus exécuté avant le LCP (preuve long-tasks + bootup). Gains CPU réels sur TBT et Script Evaluation.

Le **LCP reste > 2,5 s** — objectif global Performance Hardening **non atteint**.

---

## Décision Cycle 1

### **B — Les objectifs ne sont pas encore atteints.**

**Passer au Cycle 2 uniquement :** lazy `bridge.initialize()` au premier Play réel.

**Ne pas** lancer la Global Enterprise Certification à ce stade.

---

## Prochaine étape (hors ce rapport)

Cycle 2 — `useStreamingPlaybackBridge` : initialiser le bridge uniquement au premier `play()` utilisateur.
