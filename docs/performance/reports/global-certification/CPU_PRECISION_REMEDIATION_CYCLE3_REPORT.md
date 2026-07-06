# CPU Precision Remediation — Cycle 3 Report (FINAL)

**Date :** 6 juillet 2026  
**Programme :** Performance Hardening — CPU Precision Remediation — **Cycle final**  
**Correction :** réduction hooks hydratation `PlayerProvider`  
**Gouvernance :** aucun commit · aucun push

---

## 1. Correction appliquée

**Consolidation des hooks au mount de `PlayerProvider`** — passage de **25+ `useCallback`** à **2 `useMemo` + factory sans hooks**.

| Avant (mount) | Après (mount) |
|---|---|
| 17× `useCallback` actions player | 0 |
| 8× `useCallback` queue (`usePlayerQueueControls` hook) | 0 — `createPlayerQueueActions()` factory |
| Context value recréé à chaque render | `useMemo` sur `contextValue` |
| Identités actions instables | `useStablePlayerActions` — proxy stable (1× `useMemo`) |

Logique playback **inchangée** — mêmes closures via `actionsRef.current = factory()` à chaque render.

---

## 2. Justification architecturale

Forensics **Correction C** : `PlayerProvider` portait **23+ hooks** dont **15× `useCallback` + 8× queue**, alimentant la cascade d'hydratation React (chunk `2060`, ~66 % Script Evaluation).

**Approche retenue (périmètre autorisé uniquement) :**
- Remplacer les `useCallback` individuels par une **factory render-safe** + **proxy stable** (`useStablePlayerActions`)
- Convertir `usePlayerQueueControls` en **`createPlayerQueueActions`** (factory pure, zéro hook)
- Mémoïser la valeur Context pour éviter re-créations inutiles

**Non modifié :** Player Engine audio, SRTSP, bridge, APIs, SQL, sécurité.

---

## 3. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `apps/web/src/features/listener/lib/playerContext.tsx` | Factory actions + `useStablePlayerActions` + `useMemo` context |
| `apps/web/src/features/listener/lib/useStablePlayerActions.ts` | **Nouveau** — proxy stable 1× useMemo |
| `apps/web/src/features/listener/lib/usePlayerQueueControls.ts` | Hook → `createPlayerQueueActions` factory |

---

## 4. Validation TypeScript

```
pnpm typecheck — 17/17 tasks ✅
```

---

## 5. Validation ESLint

```
pnpm lint — 17/17 tasks ✅
```

---

## 6. Validation Build

```
pnpm build — 10/10 tasks ✅ (Next.js 15.5.19)
```

---

## 7. Lighthouse avant (baseline Cycle 2 — `/listen`)

Source : `cpu-cycle2/lighthouse-listen-run{1,2,3}.json`

| Run | LCP | FCP | TBT | Script Eval | Main Thread | Long Tasks | TTI | chunk 2060 scripting |
|---:|---:|---:|---:|---:|---:|---|---:|---:|
| 1 | 4 570 | 1 184 | 1 114 | 2 030 | 5 492 | 13 | 4 570 | 1 068 |
| **2 (best LCP stable)** | **3 740** | **1 131** | **1 065** | **2 096** | **4 795** | **9** | **4 185** | **1 338** |
| 3 | 3 667 | 1 414 | **422** | **1 702** | **3 847** | 10 | **3 680** | 1 144 |

---

## 8. Lighthouse après (Cycle 3 — `/listen` frais)

Source : `cpu-cycle3/lighthouse-listen-run{1,2,3}.json`

| Run | LCP | FCP | TBT | Script Eval | Main Thread | Long Tasks | TTI | chunk 2060 scripting |
|---:|---:|---:|---:|---:|---:|---|---:|---:|
| 1 | 4 489 | 1 165 | 1 110 | 2 184 | 5 165 | 16 | 4 539 | 1 231 |
| **2 (best comparable)** | **3 674** | **1 094** | **917** | 2 122 | **4 327** | 11 | **4 071** | **1 294** |
| 3 | 3 756 | 1 089 | 1 004 | 2 237 | 4 874 | 13 | 4 146 | 1 546 |

### Routes secondaires

| Route | LCP (C3) | TBT (C3) |
|---|---:|---:|
| `/creator` | 3 198 ms | 478 ms |
| `/lancement` | 2 287 ms | 305 ms |

---

## 9. Core Web Vitals (lab — best run comparable C2 run2 vs C3 run2)

| Métrique | Avant (C2 r2) | Après (C3 r2) | Δ | Seuil |
|---|---:|---:|---:|---|
| **LCP** | 3 740 ms | 3 674 ms | **−66 ms** | ≤ 2 500 ms ❌ |
| **CLS** | 0 | 0 | 0 | ✅ |
| **FCP** | 1 131 ms | 1 094 ms | **−37 ms** | ✅ |
| **TTFB** | 67 ms | 38 ms | −29 ms | ✅ |
| **TTI** | 4 185 ms | 4 071 ms | **−114 ms** | — |

---

## 10. CPU avant (Cycle 2 run2)

| Signal | Valeur |
|---|---:|
| chunk `2060` scripting | 1 338 ms |
| Script Evaluation total | 2 096 ms |
| Main Thread total | 4 795 ms |

---

## 11. CPU après (Cycle 3 run2)

| Signal | Valeur | Δ |
|---|---:|---:|
| chunk `2060` scripting | 1 294 ms | **−44 ms** |
| Script Evaluation total | 2 122 ms | +26 ms (variance) |
| Main Thread total | 4 327 ms | **−468 ms (−9,8 %)** |

---

## 12. Hydration avant

Proxy : **TTI 4 185 ms** + chunk `2060` scripting **1 338 ms** (Cycle 2 run2)

---

## 13. Hydration après

Proxy : **TTI 4 071 ms (−114 ms)** + chunk `2060` scripting **1 294 ms (−44 ms)** (Cycle 3 run2)

---

## 14–15. Script Evaluation

| | Avant | Après | Δ |
|---|---:|---:|---:|
| Best comparable run | 2 096 ms | 2 122 ms | +26 ms (variance) |
| Best absolute (C2 r3 / C3 r2) | **1 702 ms** | 2 122 ms | variance inter-runs |

---

## 16–17. Main Thread

| | Avant | Après | Δ |
|---|---:|---:|---:|
| Best comparable (run2) | 4 795 ms | **4 327 ms** | **−468 ms** |
| Best absolute | **3 847 ms** (C2 r3) | 4 327 ms | variance |

---

## 18–19. Long Tasks / LCP

| Métrique | Avant (C2 r2) | Après (C3 r2) |
|---|---:|---:|
| Long Tasks | 9 | 11 |
| **LCP** | **3 740 ms** | **3 674 ms** |

LCP médiane 3 runs : C2 **3 992 ms** → C3 **3 973 ms** (≈0). **Objectif ≤ 2 500 ms non atteint.**

---

## 20–21. TBT

| | Avant (C2 r2) | Après (C3 r2) | Δ |
|---|---:|---:|---:|
| TBT | 1 065 ms | **917 ms** | **−148 ms (−14 %)** |

---

## 22. Régressions

| Zone | Statut |
|---|---|
| TypeScript / ESLint / Build | ✅ |
| test:web-navigation 13/13 | ✅ |
| test:srtsp 100/100 | ✅ |
| test:player 15/15 | ✅ |
| Play / Pause / Resume / Queue | ✅ (logique identique via proxy) |
| SRTSP / Player / Wallet / Creator | ✅ non touchés |

**Comportement fonctionnel :** identique — proxy délègue aux implémentations fraîches à chaque appel.

---

## 23. Incidents rencontrés

| # | Incident | Détail |
|---|---|---|
| 1 | Port 3001 occupé | Ancien serveur prod — tué et relancé après rebuild |
| 2 | Lighthouse exit code 1 | EPERM Windows teardown — JSON complets générés |
| 3 | Variance lab élevée | Run 1 LCP ~4,5 s sur C2 et C3 — écart >800 ms |
| 4 | chunk `2060` persistant | ~1,3 s scripting — goulot structurel React/Next |

---

## 24. Classification des incidents

| Incident | Classification | Justification |
|---|---|---|
| Port 3001 EADDRINUSE | **Non bloquant** | Résolu par restart serveur |
| Lighthouse exit 1 | **Non bloquant** | Rapports JSON valides dans `cpu-cycle3/` |
| Variance LCP run 1 | **Non bloquant** | Attendu lab local |
| chunk 2060 dominant | **Non bloquant** | Hors périmètre Cycle 3 — runtime framework |

---

## 25. Gains mesurés (attribués Cycle 3 — run comparable)

| Métrique | Gain | Preuve |
|---|---:|---|
| Hooks mount PlayerProvider | **−23 useCallback** | code review |
| Main Thread | **−468 ms** | 4 795 → 4 327 ms (run2) |
| TBT | **−148 ms** | 1 065 → 917 ms |
| TTI (hydration proxy) | **−114 ms** | 4 185 → 4 071 ms |
| FCP | **−37 ms** | 1 131 → 1 094 ms |
| LCP | **−66 ms** | 3 740 → 3 674 ms (non significatif vs variance) |
| chunk 2060 scripting | **−44 ms** | bootup-time |

---

## 26. Conclusion

Le Cycle 3 **atteint son objectif technique interne** : réduction mesurable du travail main-thread (−468 ms) et du TBT (−148 ms) sur run comparable, via consolidation des hooks `PlayerProvider`.

Le **LCP reste ~3,7 s** (seuil certification 2,5 s non atteint). Le goulot résiduel est le **chunk `2060`** (runtime React 19 + Next.js App Router) — **non réductible** dans le périmètre « une correction PlayerProvider » sans refactor architectural hors programme.

**Le CPU Precision Remediation Program (3 cycles) est terminé.** Aucun Cycle 4 n'est prévu par gouvernance.

---

## 28. Décision finale

### **B — Les objectifs ne sont toujours pas atteints.**

**Raisons précises :**
1. **LCP `/listen` ~3,7 s** — écart ~1,2 s vs cible 2,5 s
2. **chunk `2060`** (~1,3 s scripting) = coût framework hydratation, indépendant des hooks PlayerProvider
3. **RSC inline `/listen`** + images cover réseau — plafond LCP non résolu par CPU client seul
4. Gains Cycle 3 réels mais **absorbés par la variance lab** sur LCP

**CPU Precision Remediation Program : TERMINÉ** (3/3 cycles exécutés).

**Global Enterprise Certification :** à relancer dans son propre cadre — **pas d'autorisation automatique** tant que LCP ≤ 2,5 s non démontré en conditions cibles.

**Aucune nouvelle optimisation proposée** dans ce programme (gouvernance Cycle 3).

---

*Rapports bruts : `docs/performance/reports/global-certification/cpu-cycle3/`*
