# LCP Precision Remediation — Phase 1.5

## Controlled Rollback & Dependency Mapping

**Date :** 6 juillet 2026  
**Périmètre :** `/listen` uniquement  
**Gouvernance :** investigation architecture — aucune optimisation, aucun commit

---

## 1. Validation du rollback

### Fichiers restaurés (état certifié pré-Phase 1)

| Fichier | État restauré |
|---|---|
| `apps/web/src/app/(listener)/listen/page.tsx` | `HomepageContentLive` seul (plus de double rendu SSR) |
| `apps/web/src/features/listener/components/HomepageContentLive.tsx` | Rend `HomepageContentSections` avec données SRTSP |
| `apps/web/src/features/listener/components/HomepageContentSections.tsx` | `"use client"` rétabli |

### Documentation Phase 1 conservée

- `docs/EXECUTION_LOG.md` — entrée Phase 1 intacte
- `docs/performance/reports/global-certification/GLOBAL_ENTERPRISE_CERTIFICATION_REPORT.md` — §27 intact
- Rapports Lighthouse Phase 1 : `listen-phase1-run*.json`, `listen-phase1-forensic.json`

### Validations post-rollback

| Check | Résultat |
|---|---|
| `pnpm build` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm test:web-navigation` | ✅ 13/13 |
| `pnpm test:srtsp` | ✅ 100/100 |
| `pnpm test:player` | ✅ 15/15 |

**Bundle `/listen` :** `10.2 kB` (identique à l'état certifié post-rollback, vs `8.97 kB` pendant la Phase 1 cassée).

---

## 2. État du projet après rollback

La route `/listen` fonctionne à nouveau comme avant la Phase 1 :

- contenu homepage rendu via `HomepageContentLive` (client boundary unique) ;
- SRTSP actif via `useListenHomeSrtspLive` ;
- plus d'erreur `usePlayerContext() from the server` ;
- LCP baseline restaurée : cover discovery (`listen-track-card`), pas l'error boundary.

---

## 3. Dependency Graph complet (chaîne LCP)

```
listen/page.tsx [RSC async]
├── ListenStreamingHeader [RSC + îlots client]
│   ├── SmartSearchBar [Client]
│   └── HeaderFilters [Client, Suspense]
├── HomepageHero [RSC + îlot client]
│   └── ListenHeroGreeting [RSC]
│       └── NightModeBanner [Client]
└── HomepageContentLive [Client] ← BOUNDARY PRINCIPAL
    └── HomepageContentSections [Client]
        ├── DiscoveriesSection [Client] ← LCP actuel (1ère section)
        │   └── TrackCard [Client]
        │       └── CoverImage [Client]
        ├── ListenDiscoverModeSlot [Client]
        │   └── DiscoverModeButton [Client dynamic ssr:false]
        ├── TopGuineaSection [Client dynamic]
        ├── ArtistsDiscoverSection [RSC-capable, importé depuis client]
        │   └── ArtistChip [RSC-capable]
        │       └── CoverImage [Client]
        ├── HomepageTrendingSection [Client]
        ├── HomepageDiscoverySection [Client dynamic]
        ├── StartListeningBanner [Client implicite via parent]
        └── MediaCard, Link sections [RSC-capable]
```

---

## 4. Player Dependency Graph

```
PlayerProvider [StreamingLayoutClient]
└── usePlayerContext() [playerContext.tsx]
    ├── usePlayer() [hook façade]
    │   ├── DiscoveriesSection → loadQueueAndPlay, currentTrack, isPlaying
    │   ├── TopGuineaSection → idem
    │   ├── HomepageTrendingSection → idem
    │   ├── HomepageDiscoverySection → idem
    │   ├── DiscoverModeButton → loadQueueAndPlay
    │   ├── GlobalPlayer, FullPlayerPanel, QueuePanel, etc.
    │   └── useListenPageRefresh → SRTSP invalidation homepage
    ├── usePlayerContext() direct
    │   ├── StartListeningBanner → currentTrack
    │   ├── GlobalPlayer, FullScreenPlayer → volume
    │   ├── QueuePanel → currentTrack
    │   ├── SidebarMiniPlayer → état player
    │   ├── LiveReactions → currentTrack
    │   └── usePlayerMute → volume/setVolume
    └── usePlayerPosition() [haute fréquence]
        └── barres de progression player
```

### Composants homepage utilisant le Player (direct ou indirect)

| Composant | Hook | Usage Player |
|---|---|---|
| `DiscoveriesSection` | `usePlayer()` | queue + état actif + play |
| `TopGuineaSection` | `usePlayer()` | idem |
| `HomepageTrendingSection` | `usePlayer()` | idem |
| `HomepageDiscoverySection` | `usePlayer()` | idem |
| `DiscoverModeButton` | `usePlayer()` | loadQueueAndPlay |
| `StartListeningBanner` | `usePlayerContext()` | masquer si morceau en cours |
| `TrackCard` | — | reçoit `onPlay` callback du parent |

---

## 5. Client / Server Boundaries

| Composant | Type | Raison |
|---|---|---|
| `listen/page.tsx` | **Server** | fetch données, metadata |
| `(listener)/layout.tsx` | **Server** | auth, flags, prefetch |
| `StreamingLayoutClient` | **Client** | PlayerProvider, sidebar, GlobalPlayer |
| `ListenStreamingHeader` | **Mixed (RSC)** | îlots SmartSearchBar + HeaderFilters |
| `HomepageHero` | **Mixed (RSC)** | îlot NightModeBanner |
| `ListenHeroGreeting` | **Server** | `getDayMode()` synchrone |
| `HomepageContentLive` | **Client** | SRTSP `useLiveQuery` |
| `HomepageContentSections` | **Client** | imports client + dynamic + StartListeningBanner |
| `DiscoveriesSection` | **Client** | `usePlayer`, filtres, état erreur |
| `TrackCard` | **Client** | `onClick`, état actif, CoverImage |
| `CoverImage` | **Client** | `useState` erreur image, `next/image` interactif |
| `TopGuineaSection` | **Client + Dynamic** | usePlayer + lazy load |
| `HomepageDiscoverySection` | **Client + Dynamic** | usePlayer |
| `ListenDiscoverModeSlot` | **Client** | feature flag + dynamic ssr:false |
| `ArtistsDiscoverSection` | **Server-eligible** | liens seulement (mais parent client) |
| `MediaCard` | **Server-eligible** | liens seulement |
| `StartListeningBanner` | **Client** | `usePlayerContext()` |

**Frontières imposées uniquement par le Player :** 6 composants homepage sur 8 sections interactives.

---

## 6. Data Flow complet

```
[Serveur]
fetchHomepageData() → HomepageData
        ↓ props initialData
[Client] HomepageContentLive
        ↓ useListenHomeSrtspLive
        │   ├── useListenerSrtspLiveQuery (SRTSP events)
        │   ├── fetchHomepageDataClient (refresh)
        │   └── HOME_INVALIDATE_EVENT (écoute valid listen)
        ↓ content: HomepageData
[Client] HomepageContentSections
        ↓ discoveryTracks[]
[Client] DiscoveriesSection
        ├── filterValidTracks (données)
        ├── matchesTimeFilter (état local)
        ├── toTrackWithMeta (transformation)
        ├── usePlayer().loadQueueAndPlay (action)
        └── TrackCard.onPlay → handlePlay(index)
                ↓
        [Player] setQueue + startStream + play
                ↓
        useListenPageRefresh → revalidate-home API + SRTSP event
                ↓
        HomepageContentLive refresh → nouveau HomepageData
```

### Données transitant par la chaîne

| Donnée | Source | Consommateur |
|---|---|---|
| `HomepageData` | RSC fetch / SRTSP refresh | HomepageContentSections |
| `DiscoveryTrack[]` | `content.discoveryTracks` | DiscoveriesSection |
| `TrackWithMeta[]` | transform client | usePlayer.setQueue |
| `currentTrack`, `isPlaying` | PlayerContext | TrackCard `isActive` |
| `SrtspEvent` | Realtime hub | useListenHomeSrtspLive |

---

## 7. SSR Eligibility Matrix

| Composant | SSR ? | Justification |
|---|---|---|
| `HomepageContentLive` | **NON** | hooks SRTSP + état live |
| `HomepageContentSections` | **PARTIELLEMENT** | structure statique oui ; 6 enfants player = non |
| `DiscoveriesSection` | **PARTIELLEMENT** | header + grille statique oui ; filtres + play + état actif = non |
| `TrackCard` | **PARTIELLEMENT** | markup cover/title/artist oui ; bouton play + isActive = non |
| `CoverImage` | **PARTIELLEMENT** | `next/image` SSR possible ; `useState` fallback erreur = client |
| `ArtistsDiscoverSection` | **OUI** | liens navigation uniquement |
| `MediaCard` | **OUI** | liens navigation uniquement |
| `StartListeningBanner` | **NON** | dépend `currentTrack` |
| `TopGuineaSection` | **PARTIELLEMENT** | même pattern que DiscoveriesSection |
| `HomepageDiscoverySection` | **PARTIELLEMENT** | idem |
| `HomepageTrendingSection` | **PARTIELLEMENT** | idem |

### Parties déplaçables côté serveur (sans casser le Player)

Pour `DiscoveriesSection` / `TrackCard` :

- structure `<section>` + titre + compteur initial ;
- grille de cartes avec cover, titre, artiste, durée ;
- badge NEW (calculable côté serveur via `published_at`) ;
- **îlot client minimal** : bouton play, overlay actif, filtres temporels, gestion erreur play.

---

## 8. Composants bloquants (empêchent SSR naïf)

| Rang | Composant | Blocage |
|---|---|---|
| 1 | `DiscoveriesSection` | `usePlayer()` au render |
| 2 | `TrackCard` | `onPlay` callback + `isActive` |
| 3 | `CoverImage` | `"use client"` + `useState` |
| 4 | `HomepageContentSections` | agrège 6 dépendances player |
| 5 | `StartListeningBanner` | `usePlayerContext()` |
| 6 | `HomepageContentLive` | SRTSP (légitime client) |

---

## 9. Dépendances critiques

1. **`PlayerProvider`** dans `StreamingLayoutClient` — requis pour tout hook player (disponible côté client uniquement).
2. **`usePlayer()`** — façade qui couple streaming bridge + refresh homepage + queue.
3. **Import statique** `DiscoveriesSection` dans `HomepageContentSections` — propage le boundary client à tout le parent.
4. **`CoverImage` client** — propage le boundary à toute carte utilisant une pochette.
5. **SRTSP** — légitimement client ; ne bloque pas le SSR du markup initial si architecture îlots.

---

## 10. Scénarios d'architecture (non implémentés)

### Scénario A — Îlots Client par section (recommandé)

**Description :** `DiscoveriesSectionShell` (RSC) rend la grille ; `DiscoveriesPlayIsland` (Client) enveloppe uniquement le handler play + état actif.

| Critère | Note |
|---|---|
| Gain LCP estimé | **Élevé** (800–1500 ms sur cover discovery) |
| Complexité | Moyenne |
| Risque | Faible–moyen |
| SRTSP | ✅ compatible (bridge séparé) |
| Player | ✅ inchangé |
| INP | Neutre à positif |
| Maintenabilité | Bonne |

### Scénario B — SSR première section seule + lazy hydrate le reste

**Description :** SSR de `DiscoveriesSection` statique ; `dynamic(..., { ssr: false })` pour les autres sections homepage.

| Critère | Note |
|---|---|
| Gain LCP estimé | **Moyen** (400–800 ms) |
| Complexité | Faible |
| Risque | Faible |
| SRTSP | ✅ |
| Player | ✅ |
| INP | Neutre |
| Maintenabilité | Bonne |

### Scénario C — Re-split `CoverImage` Server + Client fallback

**Description :** `CoverImageStatic` (RSC, `next/image`) + `CoverImageClient` (erreur/fallback uniquement).

| Critère | Note |
|---|---|
| Gain LCP estimé | **Faible–moyen** (200–500 ms) |
| Complexité | Moyenne |
| Risque | Faible |
| SRTSP | ✅ |
| Player | ✅ |
| INP | Neutre |
| Maintenabilité | Moyenne (2 composants) |

### Scénario D — SSR `HomepageContentSections` entier (Phase 1)

**Description :** Retirer `"use client"` du parent sans découper les enfants.

| Critère | Note |
|---|---|
| Gain LCP estimé | **Négatif** (prouvé : -606 ms) |
| Complexité | Faible |
| Risque | **Critique** (crash RSC) |
| SRTSP | ⚠️ instable |
| Player | ❌ régression |
| INP | Dégradé |
| Maintenabilité | Mauvaise |

**Statut : INVALIDÉ par Phase 1.**

---

## 11. Analyse des risques

| Scénario | Complexité | Risque runtime | Risque LCP | Risque SRTSP |
|---|---|---|---|---|
| A — Îlots | Moyenne | Faible | Faible | Faible |
| B — Lazy sections | Faible | Faible | Moyen | Faible |
| C — CoverImage split | Moyenne | Faible | Faible | Nul |
| D — SSR parent naïf | Faible | **Critique** | **Critique** | Moyen |

---

## 12. Gains estimés (Phase 2 cible)

| Métrique | Baseline actuelle | Scénario A estimé |
|---|---:|---:|
| LCP `/listen` | 4.1 s | **2.5–3.3 s** |
| FCP | 1.4 s | ~1.1 s (déjà bon) |
| TBT | 820 ms | 600–750 ms |
| Régression runtime | Aucune | Aucune si îlots corrects |

---

## 13. Recommandation finale

**Ne pas répéter la Phase 1.**  
La prochaine tentative doit cibler **Scénario A** sur `DiscoveriesSection` uniquement (première section = LCP), avec :

1. `DiscoveriesSectionShell` (RSC) — markup + images ;
2. `DiscoveriesSectionInteractive` (Client) — filtres + play + état actif ;
3. `HomepageContentLive` inchangé pour SRTSP ;
4. aucune modification du Player ni des contrats SRTSP.

---

## 14. Architecture cible recommandée

```
listen/page.tsx [RSC]
├── HomepageHero [RSC]
├── DiscoveriesSectionShell [RSC] ← LCP peint ici
│   └── TrackCardStatic [RSC]
│       └── CoverImageStatic [RSC]
├── HomepageContentLive [Client, invisible] ← SRTSP refresh only
└── HomepageContentSectionsDeferred [Client lazy] ← reste homepage
    └── DiscoveriesSectionInteractive [Client island]
        └── branche play sur usePlayer()
```

---

## Décision Phase 1.5

### **A. Le découplage Server / Client est réalisable.**

La Phase 1 a prouvé que le SSR naïf du parent est **impossible** sans crash.  
Le découplage par **îlots client minimaux** autour des interactions Player est **architecturalement réalisable** sans refonte du Player, du SRTSP, ni des API — mais nécessite un découpage fin section par section, pas un simple retrait de `"use client"` au niveau parent.
