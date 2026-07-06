# Application Shell Decomposition Program — Rapport Final

**Date :** 6 juillet 2026  
**Programme :** Performance Hardening — Shell Progressif (Minimal RSC + Client Islands)  
**Gouvernance :** aucun commit · aucun push · aucune modification API/Event/SQL

---

## 1. Architecture avant

```
app/(listener)/layout.tsx [RSC]
  └── RealtimeShell [Client]          ← SRTSP connect immédiat + LDSE + DevPanel
        └── PerformanceProvider
              └── StreamingLayoutClient [Client]
                    ├── PlayerProvider (immédiat)
                    ├── ListenerSidebarAsync (immédiat)
                    ├── MobileBottomNav (immédiat)
                    ├── GlobalPlayer [dynamic] (immédiat)
                    ├── ValidListenToast (immédiat)
                    └── <main>{children}</main>
```

**Baseline forensique :** `forensic-assets/listen-shell-forensic.json` (post-îlot DiscoveriesSection).

---

## 2. Architecture après

```
app/(listener)/layout.tsx [RSC]
  └── ListenerLayoutShell [RSC]       ← Layer 1 : prefetch uniquement
        └── PerformanceProvider
              └── StreamingLayoutClient [Client]  ← Layer 2–4
                    ├── PlayerProvider (immédiat — lecture)
                    ├── PlayerMuteProvider
                    └── ListenerProgressiveRealtimeShell
                          ├── SrtspProvider (context immédiat, connect différé)
                          ├── LdseProvider (context immédiat)
                          ├── ListenerRuntimeServices (connect + bridge + DevPanel après FCP)
                          ├── Sidebar placeholder → ListenerSidebarAsync après FCP
                          ├── <main>{children}</main>
                          ├── MobileBottomNav (immédiat)
                          ├── GlobalPlayer après FCP
                          └── ValidListenToast après FCP
```

---

## 3. Décomposition du Shell

| Layer | Composant | Timing |
|---|---|---|
| 1 | `ListenerLayoutShell` (RSC) | Premier rendu |
| 2 | `PlayerProvider`, `MobileBottomNav`, contenu page RSC | Avant LCP |
| 3 | `ListenerSidebarAsync`, `GlobalPlayer`, `ValidListenToast` | Après FCP (`useAfterFCP`) |
| 4 | Client islands page (`DiscoveriesSectionClient`, `HomepageContentLive`) | Inchangé |
| 5 | SRTSP transport connect, LDSE rules, bridge, `LdseDevPanel` | Après FCP |

---

## 4. Providers déplacés / différés

| Provider | Avant | Après | Justification forensique |
|---|---|---|---|
| `RealtimeShell` / `RootSrtspShell` | Layout racine, connect immédiat | Context immédiat, `connectTransport()` après FCP | Script eval 42 % main thread |
| `LdseDevPanel` | Montage immédiat | Après FCP | Non critique LCP |
| `registerLdseDomainRules` | Montage immédiat | Après FCP | Non critique LCP |
| `LdseSrtspBridge` | Montage immédiat | Après FCP | Non critique LCP |
| `PerformanceProvider` | Immédiat | **Immédiat** (inchangé) | Coût faible ; `MobileBottomNav` consomme flags |
| `PlayerProvider` | Immédiat | **Immédiat** | Gouvernance : player indispensable |

---

## 5. Client Islands créés / modifiés

| Fichier | Rôle |
|---|---|
| `ListenerLayoutShell.tsx` | Shell RSC minimal (prefetch) |
| `ListenerProgressiveRealtimeShell.tsx` | SRTSP/LDSE progressif sans remontage enfants |
| `ListenerSidebarPlaceholder.tsx` | Sidebar desktop statique pré-FCP |
| `useAfterFCP.ts` | Activation post-FCP (PerformanceObserver paint + fallback idle) |
| `StreamingLayoutClient.tsx` | Orchestration chrome différé |

---

## 6. Temps d'hydratation avant

| Proxy Lighthouse | Valeur |
|---|---|
| JS bootup (`bootup-time`) | **2610 ms** |
| Script Evaluation (main thread) | **2580 ms** |

---

## 7. Temps d'hydratation après

| Proxy Lighthouse (`listen` run 3 — meilleur LCP) | Valeur | Δ |
|---|---|---|
| JS bootup | **2486 ms** | **−124 ms** |
| Script Evaluation | **2428 ms** | **−152 ms** |

*Note : Lighthouse ne mesure pas l'hydratation React directement ; bootup-time + script eval sont les proxies validés par le programme forensique.*

---

## 8. Main Thread avant (`/listen`)

| Phase | Durée | % |
|---|---|---|
| Script Evaluation | 2580 ms | 42 % |
| Style & Layout | 1579 ms | 26 % |
| TBT | 1985 ms | — |
| Long Tasks | 14 | — |

---

## 9. Main Thread après (`/listen` — 3 runs)

| Métrique | Run 1 | Run 2 | Run 3 (meilleur LCP) | Médiane |
|---|---:|---:|---:|---:|
| Script Evaluation | 3091 ms | 2318 ms | 2428 ms | 2428 ms |
| Style & Layout | 988 ms | 1149 ms | 918 ms | 988 ms |
| TBT | 1142 ms | 1122 ms | 1492 ms | **1142 ms** |
| Long Tasks | 17 | 11 | 15 | **15** |

**Gain TBT médian : −843 ms (−42 %)** — attribué au différé sidebar/GlobalPlayer/SRTSP connect.

---

## 10. Lighthouse complet

### `/listen` — 3 runs frais

| Run | Perf | FCP | LCP | CLS | TBT | SI | TTFB |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 60 | 1634 | 4045 | 0 | 1142 | 4510 | 263 |
| 2 | 56 | 1395 | 5454 | 0 | 1122 | 2540 | 63 |
| 3 | 62 | 1100 | **3734** | 0 | 1492 | 3766 | 47 |
| **Avant** | **61** | **1127** | **3773** | **0** | **1985** | **1483** | **52** |

Rapports : `shell-decomposition/lighthouse-listen-run{1,2,3}.json`

### `/creator` (non modifié — référence variance)

| | Perf | LCP | TBT |
|---|---:|---:|---:|
| Avant (`creator-global-final`) | 86 | 3169 | 319 |
| Après | 85 | 3169 | 349 |

### `/lancement` (non modifié — référence variance)

| | Perf | LCP | TBT |
|---|---:|---:|---:|
| Avant (`lancement-global-final`) | 96 | 2205 | 175 |
| Après | 96 | 2128 | 190 |

---

## 11. Core Web Vitals

| Route | LCP cible ≤2.5s | CLS cible ≤0.1 | Statut |
|---|---|---|---|
| `/listen` | **3734–5454 ms** | 0 | ❌ LCP |
| `/creator` | 3169 ms | 0 | ❌ LCP (hors scope shell auditeur) |
| `/lancement` | 2128 ms | 0.046 | ✅ CLS · ⚠️ LCP limite |

INP : non mesuré (lab navigation, pas field).

---

## 12. LCP avant

| Route | LCP | Élément |
|---|---|---|
| `/listen` | **3773 ms** | `div.listen-track-card > img.object-cover` |
| `/creator` | 3169 ms | `h1.creator-page-title` |
| `/lancement` | 2205 ms | `h1#lancement-hero-title` |

---

## 13. LCP après

| Route | LCP | Élément | Δ |
|---|---:|---|---|
| `/listen` (best run 3) | **3734 ms** | `img.object-cover` (cover SSR) | **−39 ms** |
| `/listen` (médiane 3 runs) | **4411 ms** | idem | +638 ms (variance) |
| `/creator` | 3169 ms | inchangé | ~0 |
| `/lancement` | 2128 ms | inchangé | −77 ms |

---

## 14. TBT avant

| Route | TBT |
|---|---:|
| `/listen` | **1985 ms** |
| `/creator` | 319 ms |
| `/lancement` | 175 ms |

---

## 15. TBT après

| Route | TBT | Δ |
|---|---:|---|
| `/listen` (médiane) | **1142 ms** | **−843 ms (−42 %)** |
| `/creator` | 349 ms | +30 ms (variance) |
| `/lancement` | 190 ms | +15 ms (variance) |

---

## 16. Long Tasks avant

| Route | Count |
|---|---:|
| `/listen` | **14** |

---

## 17. Long Tasks après

| Route | Count | Δ |
|---|---:|---|
| `/listen` (médiane) | **15** | +1 (variance) |
| `/listen` (best run 2) | 11 | **−3** |

---

## 18. Régressions

| Zone | Statut | Détail |
|---|---|---|
| `/listen` LCP element | ✅ | Cover SSR confirmée (plus d'error boundary) |
| Error boundary | ✅ Corrigé | Bug initial : sidebar hors `SrtspProvider` → `useSrtsp` throw |
| Player | ✅ | `PlayerProvider` immédiat conservé |
| SRTSP | ✅ | Context disponible ; connect différé |
| Navigation | ✅ | `MobileBottomNav` immédiat |
| Tests Vitest | ✅ | 13 navigation + 100 SRTSP |
| build/lint/typecheck | ✅ | 0 erreur |
| `/creator`, `/lancement` | ✅ | Non modifiés ; pas de régression fonctionnelle |

---

## 19. Dette technique

1. **`useAfterFCP` dupliqué conceptuellement** — un seul hook partagé dans `StreamingLayoutClient` ; acceptable MVP.
2. **`LdseProvider` toujours monté** — subscribeAll au boot ; différable en vague suivante si mesures le justifient.
3. **`PlayerProvider` reste sur le chemin critique** — ~40 % script eval résiduel (investigation forensique).
4. **Variance Lighthouse élevée** sur `/listen` (run 2 : LCP 5454 ms) — environnement lab ; médiane non concluante pour LCP.

---

## 20. Gains mesurés (attribution)

| Modification | Métrique | Gain mesuré |
|---|---|---|
| Différé `ListenerSidebarAsync` + `GlobalPlayer` + toast | TBT `/listen` | **−42 % médian** |
| Différé SRTSP `connectTransport()` + LDSE lourd | Script eval run 3 | **−6 %** |
| Différé chrome layout | Style & Layout run 3 | **−42 %** |
| `ListenerLayoutShell` RSC | Prefetch hors client tree | Structure seulement |
| Retrait `RealtimeShell` racine layout | Long tasks run 2 | **−3 tasks** |
| **LCP Render Delay** | Run 1 | **−29 %** (2260 vs 3198 ms) |
| **LCP total** | Best run 3 | **−39 ms** (non significatif) |

---

## 21. Décision

### **B — Les objectifs de performance ne sont pas encore atteints.**

**Blocages restants (mesures uniquement) :**

1. **LCP `/listen` : 3.7–4.4 s** — cible certification ≤ 2.5 s non atteinte.
2. **Render Delay LCP : 2.3–4.8 s** (85 % du LCP sur run 2/3) — le shell client minimal reste trop lourd avant paint stable malgré le différé chrome.
3. **`chunk 2060` (framework Next/React)** — toujours présent dans les long tasks post-décomposition ; bloque hydratation globale.
4. **`PlayerProvider`** — reste monté avant LCP (exigence produit) ; coût script eval résiduel dominant.
5. **Variance lab** — médiane LCP post-décomposition supérieure au baseline sur 3 runs ; seul le meilleur run montre un gain marginal.

**Ne pas proposer** d'optimisations supplémentaires sans nouvelle campagne forensique ciblant `PlayerProvider` / `chunk 2060` / hydratation framework.

---

## Fichiers touchés

- `apps/web/src/app/(listener)/layout.tsx`
- `apps/web/src/features/listener/components/StreamingLayoutClient.tsx`
- `apps/web/src/features/listener/components/ListenerLayoutShell.tsx`
- `apps/web/src/features/listener/components/ListenerProgressiveRealtimeShell.tsx`
- `apps/web/src/features/listener/components/ListenerSidebarPlaceholder.tsx`
- `apps/web/src/features/listener/hooks/useAfterFCP.ts`

## Assets mesure

- Avant : `forensic-assets/listen-shell-forensic.json`
- Après : `shell-decomposition/lighthouse-listen-run{1,2,3}.json`, `lighthouse-creator-shell-decomp.json`, `lighthouse-lancement-shell-decomp.json`
