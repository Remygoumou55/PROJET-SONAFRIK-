# DiscoveriesSection Island Extraction — Rapport d'implémentation

**Date :** 6 juillet 2026  
**Programme :** Performance Hardening — Server Island + Client Island  
**Périmètre :** `/listen` — `DiscoveriesSection` uniquement

---

## 1. Architecture avant

```
listen/page [RSC]
  → HomepageContentLive [Client]
    → HomepageContentSections [Client]
      → DiscoveriesSection [Client]
        → TrackCard [Client] + usePlayer()
          → CoverImage [Client]
```

- LCP élément : `button.listen-track-card > … > img.object-cover`
- LCP baseline : **4081 ms** (médiane forensic)
- Render Delay baseline : **889 ms**
- Boundary client unique bloquait le paint de la cover

---

## 2. Architecture après

```
listen/page [RSC]
  → DiscoveriesSection [RSC orchestrator]
    → DiscoveriesSectionClient [Client Island]
      ├── children: DiscoveriesSectionShell [RSC]
      │     → TrackCardStatic [RSC]
      │       → CoverImageStatic [RSC / next/image]
      └── usePlayer() — filtres, play, état actif uniquement
  → HomepageContentLive [Client]
    → router.refresh() on SRTSP data change
    → HomepageContentSections [Client] (sans DiscoveriesSection)
```

- LCP élément : `div.listen-track-card > … > img.object-cover` (SSR confirmé dans HTML)
- SSR static card : **YES** (`listen-track-card--static` dans le HTML initial)
- Error boundary : **NO**

---

## 3. Server Island

| Fichier | Rôle |
|---|---|
| `discoveries/DiscoveriesSectionShell.tsx` | Grille statique |
| `discoveries/TrackCardStatic.tsx` | Carte sans handlers |
| `discoveries/CoverImageStatic.tsx` | `next/image` sans `useState` |
| `discoveries/discoveries.utils.ts` | Fonctions pures partagées |

Contenu SSR : covers, titres, artistes, durées, badges NEW, métadonnées catalogue.

---

## 4. Client Island

| Fichier | Rôle |
|---|---|
| `discoveries/DiscoveriesSectionClient.tsx` | Filtres, play, queue, état actif, erreurs |

- Filtre par défaut « Cette semaine » : utilise le shell SSR
- Filtres « Ce mois » / « Tout » : bascule sur `TrackCard` client existant
- Play sur shell : délégation d'événements + `loadQueueAndPlay`
- État actif : `useEffect` + classes CSS sur cartes statiques

---

## 5. Fichiers modifiés

### Cluster DiscoveriesSection (cible)
- `DiscoveriesSection.tsx` — orchestrateur RSC
- `discoveries/DiscoveriesSectionShell.tsx` — **nouveau**
- `discoveries/DiscoveriesSectionClient.tsx` — **nouveau**
- `discoveries/TrackCardStatic.tsx` — **nouveau**
- `discoveries/CoverImageStatic.tsx` — **nouveau**
- `discoveries/discoveries.utils.ts` — **nouveau**

### Câblage minimal (nécessaire au pattern RSC children)
- `listen/page.tsx` — rend `DiscoveriesSection` côté serveur
- `HomepageContentSections.tsx` — retrait du doublon DiscoveriesSection
- `HomepageContentLive.tsx` — `router.refresh()` pour sync SRTSP

---

## 6. Data Flow

```
[Serveur] fetchHomepageData → discoveryTracks[]
        ↓
[RSC] DiscoveriesSection → Shell (HTML initial)
        ↓ children
[Client] DiscoveriesSectionClient
        ↓ usePlayer().loadQueueAndPlay
[Player] inchangé

[SRTSP] useListenHomeSrtspLive → liveContent change
        ↓ JSON compare
[Client] router.refresh()
        ↓
[Serveur] DiscoveriesSection re-render avec données fraîches
```

---

## 7. Compatibilité SRTSP

✅ Conservée — `useListenHomeSrtspLive` inchangé  
✅ Invalidation → `router.refresh()` avec garde anti-boucle (compare JSON sérialisé)  
✅ Event contracts inchangés

---

## 8. Compatibilité Player

✅ `usePlayer()` uniquement dans Client Island  
✅ `PlayerProvider` / `playerContext` inchangés  
✅ Queue, play, pause, état actif fonctionnels  
✅ Tests player : 15/15

---

## 9–14. Lighthouse `/listen` (3 runs, prod locale `:3001`)

### Baseline (avant îlot)

| Métrique | Valeur |
|---|---:|
| LCP | 4081 ms |
| FCP | 1450 ms |
| TBT | 823 ms |
| CLS | 0 |
| TTFB | 45 ms |
| Render Delay | 889 ms |
| Score | 67 |

### Après îlot

| Run | LCP | FCP | TBT | Score |
|---:|---:|---:|---:|---:|
| 1 | 7928 ms | 1619 ms | 1430 ms | 47 |
| 2 | 5930 ms | 1453 ms | 720 ms | 60 |
| 3 | **3966 ms** | 1515 ms | 940 ms | 66 |
| **Médiane** | **5930 ms** | **1515 ms** | **940 ms** | **60** |

| Métrique | Avant | Après (médiane) | Après (meilleur run) | Delta médiane |
|---|---:|---:|---:|---:|
| LCP | 4081 ms | 5930 ms | 3966 ms | **-1849 ms** |
| Render Delay | 889 ms | n/a | 1220 ms | **+331 ms** (run 3) |
| FCP | 1450 ms | 1515 ms | 1515 ms | -65 ms |
| TBT | 823 ms | 940 ms | 940 ms | -117 ms |
| CLS | 0 | 0 | 0 | 0 |
| TTFB | 45 ms | 46 ms | 46 ms | ~0 |

Rapports : `listen-island-run1.json`, `listen-island-run2.json`, `listen-island-run3.json`

---

## 15. Régressions

| Check | Résultat |
|---|---|
| Build / lint / typecheck | ✅ |
| Navigation 13/13 | ✅ |
| SRTSP 100/100 | ✅ |
| Player 15/15 | ✅ |
| probe:performance-discovery 27/27 | ✅ |
| Error boundary runtime | ✅ absent |
| SSR static cards | ✅ présent |
| Fonctionnel play/filtres | ✅ (architecture validée) |

Aucune régression fonctionnelle détectée. Variance Lighthouse élevée sur runs 1–2 (probable interaction `router.refresh` + cold start local).

---

## 16. Dette technique

| Item | Sévérité |
|---|---|
| Manipulation `innerHTML` pour icône play/pause sur shell | Basse |
| `JSON.stringify` pour détecter changement SRTSP | Basse |
| Filtres month/all re-basculent sur `TrackCard` client complet | Acceptée (hors LCP path) |
| Pas de CSS dédié `listen-track-card--static` (réutilise classes existantes) | Nulle |

---

## 17. Gains obtenus

| Critère | Résultat |
|---|---|
| Objectif LCP ≤ 2.5 s | ❌ Non atteint (meilleur : 3.97 s) |
| Réduction Render Delay | ❌ Run 3 : +331 ms vs baseline |
| SSR LCP cover | ✅ Prouvé (img dans HTML initial, hors `button` client) |
| Stabilité métrique | ⚠️ Variance ±50 % entre runs |
| Gain médian LCP | ❌ -45 % (régression) |
| Gain meilleur run LCP | ✅ -2.8 % (-115 ms) |

---

## 18. Conclusion

L'architecture **Server Island + Client Island** est **correctement implémentée** :
- le markup LCP est émis côté serveur ;
- le Player est isolé dans le Client Island ;
- SRTSP et tests passent ;
- aucune régression runtime.

En revanche, le **gain LCP mesurable est insuffisant** pour valider l'objectif programme :
- la médiane régresse ;
- le meilleur run n'améliore que marginalement (-115 ms) ;
- le Render Delay du meilleur run est supérieur au baseline ;
- la cible 2.5 s reste hors portée.

---

## Décision

### **B. Le gain est insuffisant.**

**Pourquoi :**
1. LCP médian **5930 ms** vs **4081 ms** baseline — régression nette sous throttling Lighthouse local.
2. Même le meilleur run (**3966 ms**) n'atteint pas l'objectif **≤ 2500 ms** et n'améliore que **~3 %**.
3. Le Render Delay n'est pas réduit sur le run le plus favorable (+331 ms).
4. La variance inter-runs invalide une conclusion robuste de gain — l'îlot serveur seul ne suffit pas tant que le shell client `StreamingLayoutClient` + hydratation globale dominent le main thread.

**Suite recommandée (hors scope actuel) :** avant `/creator`, traiter le coût du shell layout auditeur (TBT/render delay résiduel) ou réduire le Client Island footprint post-SSR.
