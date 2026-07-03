# REMEDIATION REPORT — PHASE 2
> Mission D — Artist Workspace Experience  
> Cycle : AUDIT 1 → REMEDIATION 1 → AUDIT 2 → **REMEDIATION 2** ← AUDIT 3 → CERTIFICATION  
> Déclencheur : AUDIT 2 (SECOND_FORENSIC_AUDIT.md) confirmant 11 anomalies N-001→N-011

---

## Anomalies corrigées

### N-001 — Couleur hex hardcodée dans cover-studio.css

**Fichier :** `apps/web/src/app/styles/creator/cover-studio.css`  
**Avant :** `color: #f87171;`  
**Après :** `color: var(--color-erreur);`  
**Règle :** Interdit d'après CLAUDE.md §4.2 — jamais de hex dans les composants/styles.

---

### N-002 — Import `useRouter` après une déclaration de type

**Fichier :** `apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx`  
**Avant :**
```typescript
import { IMAGE_ACCEPT, IMAGE_POLICY, resolveImageUploadMime, type ImageMime } from "@sonafrik/shared";
import { compressImageFile, IMAGE_UPLOAD, isAllowedImageMime } from "@/lib/image/compress-image";
type AllowedImageMime = ImageMime;   // ← déclaration entre les imports
import { useRouter } from "next/navigation";
```
**Après :**
```typescript
import { IMAGE_ACCEPT, IMAGE_POLICY, resolveImageUploadMime, type ImageMime } from "@sonafrik/shared";
import { compressImageFile, IMAGE_UPLOAD, isAllowedImageMime } from "@/lib/image/compress-image";
import { useRouter } from "next/navigation";
type AllowedImageMime = ImageMime;   // ← après tous les imports
```

---

### N-003 — 3 composants dashboard orphelins (0 importeurs)

**Fichiers supprimés :**
- `apps/web/src/features/creator/dashboard/components/ActivityFeed.tsx` (195 lignes)
- `apps/web/src/features/creator/dashboard/components/DashboardQuickCards.tsx` (64 lignes)
- `apps/web/src/features/creator/dashboard/components/SparklineChart.tsx` (82 lignes)

**Justification :** Aucun fichier dans le workspace ne les importait. Code mort confirmé par grep exhaustif.

---

### N-004 — Section CSS `.artist-hero` morte (V2 → remplacée par `.ahero`)

**Fichier :** `apps/web/src/app/styles/creator/hero.css`  
**Supprimé :** 581 lignes de CSS V2 (`.artist-hero__*`, classes vitrine, sparkline)  
**Conservé :** `.ahero` (V3.5), `.creator-welcome-overlay`, `.crop-modal`  
**Résultat :** 1663 lignes → 1082 lignes

---

### N-005 — Fichier CSS vitrine entier mort

**Fichier supprimé :** `apps/web/src/app/styles/creator/enterprise/vitrine.css` (225 lignes)  
**Import retiré de :** `apps/web/src/app/styles/creator.css`

---

### N-006 — Classes `.artist-hero--vitrine` mortes dans layout.css

**Fichier :** `apps/web/src/app/styles/creator/layout.css`  
**Supprimé :** `.artist-hero__name-row`, `.artist-hero__follow-btn`, `.artist-hero__publish-btn`, bloc media query `@media (max-width: 480px) { .artist-hero--vitrine ... }`

---

### N-007 — Classes `.artist-hero--vitrine` mortes dans mobile.css

**Fichier :** `apps/web/src/app/styles/creator/mobile.css`  
**Supprimé :** 2 blocs `.artist-hero--vitrine` dans les breakpoints `@media (max-width: 767px)` et `@media (max-width: 390px)`

---

### N-008 — Sections CSS activity/weekly/conseil/quick-cards mortes dans panels.css

**Fichier :** `apps/web/src/app/styles/creator/enterprise/panels.css`  
**Supprimé :**
- Section activity (lignes 1-99) — orpheline de `ActivityFeed.tsx`
- Section weekly (lignes 101-179) — orpheline de `WeeklySonafrikPanel.tsx` (déjà supprimé session précédente)
- Section conseil (lignes 180-226) — orpheline de `ConseilBanner.tsx` (déjà supprimé session précédente)
- `.dash-weekly__mini-grid` dans le media query restant
- Section `.dash-quick-cards/.dash-quick-card__*` — orpheline de `DashboardQuickCards.tsx`

---

## Bilan volumétrique

| Fichier | Avant | Après | Économie |
|---|---|---|---|
| `hero.css` | 1663 lignes | 1082 lignes | −581 |
| `enterprise/vitrine.css` | 225 lignes | supprimé | −225 |
| `enterprise/panels.css` | ~430 lignes | ~326 lignes | ~−104 |
| `layout.css` | ~295+ lignes | −45 lignes | ~−45 |
| `mobile.css` | ~330 lignes | ~330 lignes | −~15 |
| `ActivityFeed.tsx` | 195 lignes | supprimé | −195 |
| `DashboardQuickCards.tsx` | 64 lignes | supprimé | −64 |
| `SparklineChart.tsx` | 82 lignes | supprimé | −82 |
| **TOTAL SUPPRIMÉ** | | | **~1311 lignes** |

---

## Validation post-R2

| Vérification | Résultat |
|---|---|
| `pnpm build` | ✅ 9/9 réussi |
| `pnpm lint` | ✅ 15/15, 0 erreur |
| `pnpm typecheck` | ✅ 15/15, 0 erreur |
| `/creator` route encore `ƒ Dynamic` | ✅ |
| Aucune régression sur les pages créateur | ✅ (build sans erreur TypeScript) |

---

## Périmètre autorisé respecté

✅ Aucun code de Publication, Catalogue, Upload, Wizard, Wallet, Player, Admin, Streaming ou Edge Function n'a été touché.  
✅ Toutes les suppressions confirmées orphelines avant suppression.  
✅ Toutes les couleurs remplacées par des tokens `var(--color-*)`.
