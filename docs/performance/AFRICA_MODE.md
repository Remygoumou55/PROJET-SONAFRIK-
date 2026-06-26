# Africa Mode — Profil Performance SONAFRIK

> **Flag :** `performance_africa_mode_enabled` (OFF par défaut)  
> **Date :** 26 juin 2026

SONAFRIK cible la Guinée et l'Afrique de l'Ouest : réseaux mobiles hétérogènes, data chère, appareils 2–4 Go RAM.

---

## Profils réseau

| Profil | `effectiveType` | Downlink | Latence typique | Usage test |
|---|---|---|---|---|
| **4G** | `4g` | ≥1.5 Mbps | 50–150ms | Baseline urbaine |
| **3G** | `3g` | 0.5–1.5 Mbps | 150–400ms | Périurbain |
| **2G** | `2g` / `slow-2g` | <0.5 Mbps | 400ms+ | Rural / edge |
| **Instable** | variable | coupures | — | Simuler offline 5–10s |

**Simulation Chrome :** DevTools → Network → Throttling preset ou Custom.

**Code existant :** `apps/web/src/lib/networkAware.ts` — déjà utilisé par `useStreamQuality`.

---

## Cibles par profil

### 4G (défaut urbain)

| Métrique | Cible |
|---|---|
| TTFB page P0 | ≤1.5s |
| LCP `/listen` | ≤2.5s |
| Time to play | ≤3s |
| Qualité audio | 128 kbps (standard) |
| Images covers | quality 80 priority / 55 lazy |
| Prefetch routes | ON (`/listen`, nav) |
| Taille page initiale | ≤500 KB transfert |

### 3G

| Métrique | Cible |
|---|---|
| TTFB page P0 | ≤3s |
| LCP `/listen` | ≤4s |
| Time to play | ≤6s |
| Qualité audio | 96 kbps (économique) |
| Images | quality 45, sizes réduits |
| Prefetch | OFF |
| Taille page initiale | ≤300 KB transfert |

### 2G

| Métrique | Cible |
|---|---|
| TTFB page P0 | ≤5s |
| LCP `/listen` | ≤6s (skeleton acceptable) |
| Time to play | ≤10s |
| Qualité audio | 64 kbps (ultra économique) |
| Images | lazy only, pas de prefetch |
| Animations count-up | DÉSACTIVÉES |
| Taille page initiale | ≤200 KB transfert |

### Instable (coupures)

| Comportement | Cible |
|---|---|
| Heartbeat | Reprendre après reconnect |
| Player erreur | Banner clair, 1 retry URL |
| Formulaires | Pas de perte saisie (draft local si applicable) |
| Offline | Message « Connexion perdue » — pas de crash |

---

## Comportement flag `performance_africa_mode_enabled`

Quand ON (implémentation future — non codée dans cette livraison) :

1. Force `useStreamQuality` vers tier inférieur si réseau inconnu
2. Désactive prefetch agressif (`performance_prefetch_enabled` implicite OFF)
3. Réduit qualité images `CoverImage` de 1 niveau
4. Désactive `useCountUp` / `useAnimatedNumber` >300ms
5. Affiche badge « Mode économie » sur player (existe partiellement)

**Rollback :** flag OFF dans `/admin/flags` <30s.

---

## Stratégie offline (post-MVP flag)

| Feature | MVP | Africa Mode |
|---|---|---|
| Écoute hors-ligne | ❌ | Roadmap |
| Cache dernière position | ✅ `savePosition` | ✅ |
| Cache recherche récente | Flag `performance_search_cache_enabled` | ✅ si flag ON |
| PWA install | ❌ | Roadmap |

---

## Appareils de référence test

| Device | RAM | CPU throttle DevTools |
|---|---|---|
| Samsung Galaxy A03 / équivalent | 2–3 Go | 4x slowdown |
| iPhone SE 2 | 3 Go | 4x slowdown |
| Desktop récent | 8+ Go | 1x (baseline) |

---

## Validation

Exécuter scénario Africa Mode dans [`LIVE_CONTROL_PERFORMANCE.md`](./LIVE_CONTROL_PERFORMANCE.md).

Critère certification : parcours complet jouable en **Slow 3G** sans crash ni freeze >1s.

---

*Complément : [`PERFORMANCE_UX_CERTIFICATION.md`](./PERFORMANCE_UX_CERTIFICATION.md) Phase H*
