# PCI Mini Report — Remote Image Resilience

**Date :** 2026-07-07  
**Auteur :** Cursor AI  
**Feature / PR :** Stabilisation des images distantes Supabase + audit/push lot `/creator`  
**Pages touchées :** `/creator` · `/listen` · routes catalogue/listener qui consomment les pochettes distantes

---

## 1. Contexte

Une instabilité runtime a été observée autour des images distantes Supabase servies via `next/image`. Le serveur local remontait des timeouts amont (`upstream image response timed out`) sur des covers de catalogue, ce qui dégradait la résilience de pages transverses et pouvait perturber la validation de `/creator`.

L’objectif PCI était opportuniste et ciblé : conserver le layout `next/image` mais désactiver l’optimizer serveur pour les assets distants Supabase afin de supprimer ce point de contention.

---

## 2. Validation technique

| Check | Résultat |
|---|---|
| `pnpm build` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| test:web-navigation | Non exécuté |
| test:srtsp | Non exécuté |
| test:player | Non exécuté |

---

## 3. Mesures performance (avant → après)

| Métrique | Avant | Après | Budget PCI | Verdict |
|---|---:|---:|---:|---|
| LCP `/creator` | ~3,3 s baseline PCI | Non remesuré Lighthouse | ≤ 3,5 s | À confirmer |
| CLS | 0 baseline PCI | Non remesuré Lighthouse | ≤ 0,10 | À confirmer |
| INP | Non mesuré | Non mesuré | ≤ 200 ms | À confirmer |
| TBT | ~385 ms baseline PCI | Non remesuré Lighthouse | ≤ 300 ms | À confirmer |
| FCP | Non mesuré | Non mesuré | ≤ 1,8 s | À confirmer |
| TTFB | Non mesuré | Non mesuré | ≤ 800 ms | À confirmer |
| First Load JS | 103 kB partagé | 103 kB partagé | — | Stable |

**Méthode :** vérification technique + build output + contrôle runtime HTTP (`/creator` = 200, `/listen` = 200)  
**Rapports JSON :** non produits dans ce cycle

---

## 4. Bundle / CPU (si applicable)

| Signal | Avant | Après |
|---|---|---|
| Route bundle delta | N/A | N/A |
| chunk 2060 scripting | 46.1 kB | 46.1 kB |
| Long tasks | Non mesuré | Non mesuré |

---

## 5. Classification régression

| Niveau | Justification |
|---|---|
| P3 | Gain de résilience ciblé, sans régression mesurée sur build/bundle |

---

## 6. Décision PCI

- [x] **Approuvé** — optimisation opportuniste sûre, sans régression build/lint/typecheck
- [ ] **Conditionnel** — P2 backlog, merge autorisé avec ticket
- [ ] **Bloqué** — P0, correction requise avant merge

---

## 7. Notes

- Changement appliqué : `unoptimized` sur les composants `next/image` qui chargent des covers distantes Supabase.
- Fichiers principaux :
  - `apps/web/src/components/CoverImage.tsx`
  - `apps/web/src/features/listener/components/discoveries/CoverImageStatic.tsx`
  - `apps/web/src/features/creator/dashboard/components/CreatorAssetImage.tsx`
- Ce cycle ne rouvre pas le programme hardening global ; il reste conforme au mode PCI.
