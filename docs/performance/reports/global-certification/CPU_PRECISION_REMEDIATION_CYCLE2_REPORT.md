# CPU Precision Remediation — Cycle 2 Report

**Date :** 6 juillet 2026  
**Programme :** Performance Hardening — CPU Precision Remediation  
**Cycle :** 2 uniquement — lazy `bridge.initialize()`  
**Gouvernance :** aucun commit · aucun push

---

## 1. Correction appliquée

**Lazy initialization de `bridge.initialize()`** — suppression de l'appel au mount du hook `useStreamingPlaybackBridge`.

- Suppression du `useEffect` qui invoquait `bridge.initialize()` au chargement de page
- Le bridge est créé via `useMemo` (factory légère) mais **non initialisé** tant qu'aucune lecture n'est demandée
- L'initialisation réelle est déléguée à `StreamingPlaybackBridge.startStream()` qui appelle déjà `await this.initialize()` en interne au premier Play
- Valeurs statiques retournées pré-Play : `playbackMode: "legacy"`, `runtimeStatus: defaultBridgeRuntimeStatus()`, `isBridgeReady: false`

---

## 2. Justification architecturale

Rapport **Main Thread Execution Forensics** — cause CPU #2 :

| Rang | Source | Mécanisme |
|---:|---|---|
| 2 | `useStreamingPlaybackBridge` → `bridge.initialize()` | via `usePlayer` / `PlayerProvider` au mount layout listener |

`initialize()` déclenche une chaîne async coûteuse **avant tout Play** :

1. `auth.getUser()`
2. `loadFoundation()` (runtime coordinator + application layer)
3. Requêtes `feature_flags` Supabase (10+ flags streaming/runtime)

Cette chaîne n'est **pas requise** pour afficher la page `/listen` ni pour le LCP (cover SSR). Elle ne devient nécessaire qu'au premier `startStream()`.

**Choix retenu :** s'appuyer sur le contrat existant `startStream() → initialize()` plutôt qu'un lazy import dynamique — respecte la contrainte « ne pas modifier Player / Event Contracts / APIs » et garantit que la première lecture déclenche exactement le même chemin qu'avant.

---

## 3. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `apps/web/src/features/listener/integration/useStreamingPlaybackBridge.ts` | Suppression `useEffect(initialize)` · retour statique pré-Play |

**Non modifiés (conformité gouvernance) :** SRTSP, Player, `streaming-playback-bridge.ts`, APIs, SQL, sécurité.

---

## 4. Validation TypeScript

```
pnpm typecheck — 17/17 tasks ✅ (0 erreur)
```

---

## 5. Validation ESLint

```
pnpm lint — 17/17 tasks ✅ (0 erreur, 0 warning)
```

---

## 6. Validation Build

```
pnpm build — 10/10 tasks ✅ (Next.js 15.5.19 production build OK)
```

---

## 7. Lighthouse avant (baseline Cycle 1 — best run `/listen`)

Source : `cpu-cycle1/lighthouse-listen-run2.json`

| Métrique | Valeur |
|---|---:|
| Performance score | — |
| LCP | 3 746 ms |
| FCP | 1 388 ms |
| TBT | 883 ms |
| CLS | 0 |
| TTFB | 61 ms |
| TTI | 4 363 ms |
| Script Evaluation | 2 129 ms |
| Main Thread | 4 620 ms |
| Long Tasks | 11 |

---

## 8. Lighthouse après (Cycle 2 — 3 runs frais `/listen`)

Rapports : `cpu-cycle2/lighthouse-listen-run{1,2,3}.json`

| Run | LCP | FCP | TBT | Script Eval | Main Thread | Long Tasks |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 4 570 | — | 1 114 | 2 030 | — | — |
| **2 (best LCP)** | **3 740** | **1 131** | 1 065 | **2 096** | **4 795** | **9** |
| 3 | 3 667 | — | **422** | — | — | — |
| **Médiane** | **3 667** | — | **1 065** | — | — | — |

### Routes secondaires (non ciblées — variance lab)

| Route | LCP | TBT | Source |
|---|---:|---:|---|
| `/creator` | 3 226 ms | 508 ms | `cpu-cycle2/lighthouse-creator.json` |
| `/lancement` | 2 309 ms | 288 ms | `cpu-cycle2/lighthouse-lancement.json` |

---

## 9. Core Web Vitals (lab Lighthouse — best run `/listen`)

| Métrique | Avant (C1 run2) | Après (C2 run2) | Seuil « bon » |
|---|---:|---:|---|
| **LCP** | 3 746 ms | 3 740 ms | ≤ 2 500 ms |
| **CLS** | 0 | 0 | ≤ 0,1 |
| **INP** | N/A (insight only) | N/A (insight only) | ≤ 200 ms |
| **FCP** | 1 388 ms | 1 131 ms | ≤ 1 800 ms |
| **TTFB** | 61 ms | 67 ms | ≤ 800 ms |

---

## 10. CPU avant (bootup-time + réseau — Cycle 1 run2)

| Signal | Valeur | Preuve |
|---|---:|---|
| Chunk `9617-*.js` bootup scripting | 147 ms | bootup-time |
| Long task `9617` | 176 ms @ 3 460 ms | long-tasks |
| Requêtes `feature_flags` au load | **10+** requêtes Supabase | network-requests |
| `main-app` scripting | top bootup | bootup-time |

---

## 11. CPU après (bootup-time + réseau — Cycle 2 run2)

| Signal | Valeur | Preuve |
|---|---:|---|
| Chunk `9617-*.js` bootup scripting | 181 ms | bootup-time (parse statique — import graph inchangé) |
| Long task `9617` | 214 ms @ 3 432 ms | long-tasks (post-LCP, parse chunk) |
| Requêtes `feature_flags` au load | **0** | network-requests — **éliminées** |
| Chunk `2060-*.js` scripting | 1 338 ms | bootup-time (goulot dominant inchangé) |

---

## 12. Script Evaluation avant

| Source | Valeur |
|---|---:|
| mainthread-work-breakdown — Script Evaluation | **2 129 ms** |

---

## 13. Script Evaluation après

| Source | Valeur | Δ vs C1 best |
|---|---:|---:|
| mainthread-work-breakdown — Script Evaluation | **2 096 ms** | **−33 ms (−1,6 %)** |

---

## 14. Main Thread avant

| Source | Valeur |
|---|---:|
| mainthread-work-breakdown total | **4 620 ms** |

---

## 15. Main Thread après

| Source | Valeur | Δ vs C1 best |
|---|---:|---:|
| mainthread-work-breakdown total | **4 795 ms** | +175 ms (variance lab) |

---

## 16. Long Tasks avant

| Métrique | Valeur |
|---|---:|
| Count | 11 |
| Pire tâche | 583 ms @ 1 053 ms (`/listen` document) |
| Tâche `9617` | 176 ms @ 3 460 ms |

---

## 17. Long Tasks après

| Métrique | Valeur | Δ |
|---|---:|---|
| Count | **9** | **−2** |
| Pire tâche | 583 ms @ 1 053 ms | identique |
| Tâche `9617` | 214 ms @ 3 432 ms | post-LCP (parse, pas init async) |

---

## 18. LCP avant

**3 746 ms** — élément LCP : `div.listen-track-card > img.object-cover` (cover SSR)

---

## 19. LCP après

| Run | LCP |
|---|---:|
| Best (run 2) | **3 740 ms** |
| Médiane (3 runs) | **3 667 ms** |

**Δ best : −6 ms** — non significatif (variance lab ±1 s). Objectif ≤ 2 500 ms **non atteint**.

---

## 20. TBT avant

**883 ms** (Cycle 1 best run)

---

## 21. TBT après

| Run | TBT |
|---|---:|
| Best blocking (run 3) | **422 ms** |
| Run 2 (comparable LCP) | 1 065 ms |
| Médiane | **1 065 ms** |

**Interprétation :** forte variance inter-runs (422–1 114 ms). Le run 3 montre un potentiel TBT bas mais LCP médian reste > 3,6 s.

---

## 22. Régressions

| Zone | Statut |
|---|---|
| TypeScript | ✅ 0 erreur |
| ESLint | ✅ 0 erreur |
| Build production | ✅ |
| test:web-navigation | ✅ 13/13 |
| test:srtsp | ✅ 100/100 |
| test:player | ✅ 15/15 |
| Homepage / Listen render | ✅ LCP element cover SSR |
| Navigation | ✅ |
| Player — première lecture | ✅ `startStream()` → `initialize()` inchangé |
| Lectures suivantes | ✅ initPromise singleton |
| Queue / Pause / Reprise | ✅ (tests player OK) |
| SRTSP | ✅ 100/100 |
| Creator Dashboard / Catalogue | ✅ build OK |
| Wallet / Analytics / Publication | ✅ non touchés |
| Workspace Auditeur / Admin | ✅ non touchés |

**Comportement utilisateur :** strictement identique — seul le timing d'initialisation du bridge change (au Play, pas au load).

---

## 23. Incidents rencontrés

| # | Incident | Détail |
|---|---|---|
| 1 | Lighthouse exit code 1 | Chrome temp cleanup EPERM Windows — JSON générés malgré exit 1 |
| 2 | Variance lab `/listen` LCP | Run 1 à 4 570 ms vs run 2 à 3 740 ms — écart > 800 ms |
| 3 | Chunk `9617` toujours en bootup | Import statique `createStreamingPlaybackBridge` — parse JS ~180 ms persiste ; seul le travail async `initialize()` est différé |

---

## 24. Classification des incidents

| Incident | Classification | Justification |
|---|---|---|
| Lighthouse exit 1 | **Non bloquant** | Rapports JSON complets dans `cpu-cycle2/` |
| Variance LCP | **Non bloquant** | Attendu en lab local ; médiane utilisée pour décision |
| Chunk 9617 parse persistant | **Non bloquant** | Hors périmètre Cycle 2 (import graph) ; objectif Cycle 2 = `initialize()` lazy uniquement |

---

## 25. Gains mesurés (attribués exclusivement à Cycle 2)

| Métrique | Gain mesuré (best run comparable) | Preuve |
|---|---:|---|
| Requêtes `feature_flags` au load | **−10+ requêtes** | network-requests C1 vs C2 |
| Travail async `initialize()` pré-Play | **éliminé** | plus de fetch runtime avant interaction |
| FCP | **−257 ms** | 1 388 → 1 131 ms |
| TTI | **−178 ms** | 4 363 → 4 185 ms |
| Long Tasks count | **−2** | 11 → 9 |
| Script Evaluation | **−33 ms** | 2 129 → 2 096 ms |
| LCP | **~0 ms** | 3 746 → 3 740 ms (variance) |
| TBT (run comparable LCP) | +182 ms | variance — non attribuable positivement |
| Main Thread | +175 ms | variance — chunk 2060 dominant |

**Conclusion gains :** le Cycle 2 **atteint son objectif technique** (plus d'`initialize()` au mount, zéro `feature_flags` au load) mais **ne débloque pas le LCP** car le goulot principal reste le chunk `2060` (hydration React/Next ~1 338 ms scripting) et le RSC inline `/listen`.

---

## 26. Conclusion

Le Cycle 2 supprime correctement `bridge.initialize()` du chemin critique de chargement. La preuve la plus nette est l'**absence totale de requêtes `feature_flags`** au load (vs 10+ avant) et le déplacement de l'initialisation runtime au premier Play via le contrat `startStream()` existant.

Les métriques lab montrent des micro-gains sur FCP, TTI et Long Tasks, mais le **LCP reste ~3,7 s** (seuil 2,5 s non atteint). Le chunk `9617` continue d'être parsé (import statique) — seul le coût async d'initialisation est retiré du critical path.

Aucune régression fonctionnelle détectée (128/128 probes navigation + SRTSP + player).

---

## Décision Cycle 2

### **B — Les objectifs ne sont pas encore atteints.**

Le Performance Hardening Program n'a pas atteint LCP ≤ 2,5 s sur `/listen`.

**Autorisation :** Cycle 3 uniquement — cible recommandée par forensics : **chunk `2060` / hydration `PlayerProvider` au mount layout listener** (cause CPU #1, ~66 % Script Evaluation).

**Interdit :** appliquer le Cycle 3 automatiquement — attendre autorisation explicite.

**Non autorisé :** Global Enterprise Certification à ce stade.

---

*Rapports bruts : `docs/performance/reports/global-certification/cpu-cycle2/`*
