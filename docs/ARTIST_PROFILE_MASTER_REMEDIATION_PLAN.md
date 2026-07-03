# ARTIST PROFILE MASTER REMEDIATION PLAN
> Version 1.0 — Audit Phase 1 complet
> Date : 2026-07-02 | IA : Claude Sonnet 4.6
> Domaine : Profil Artiste & Identité UNIQUEMENT
> Audit réalisé sur : ArtistHero, ArtistProfilePhoto, ArtistCoverSlider, CropEditorModal, ArtistIdentityForm, creator.service.ts, creator-asset-signed-url (lecture seule), hero.css, artist_profiles (DB)

---

## PÉRIMÈTRE AUTORISÉ (rappel)

**IN SCOPE :** Hero, Avatar, Cover, Profile, Bio, Genres, Country, Social links, Avatar upload, Cover upload, Crop, Zoom, Pan, Responsive, Accessibilité, UX.

**HORS SCOPE STRICT :** ❌ Publication ❌ Wizard ❌ Audio Upload ❌ Catalog ❌ Wallet ❌ Analytics ❌ Streaming ❌ Player ❌ Admin ❌ Listeners ❌ Upload Policy Enterprise ❌ Edge Functions ❌ APIs Publication ❌ Schemas Zod Publication

---

## RÉSUMÉ EXÉCUTIF

| ID | Sévérité | Titre | Lot |
|---|---|---|---|
| A1 | **CRITIQUE** | Avatar original pollue `cover_images[]` → hero corrompu | LOT 1 |
| A2 | **CRITIQUE** | Avatar crop via `assetKind: "cover"` écrase `cover_path` du hero | LOT 1 |
| A3 | **MAJEURE** | `cover_images[]` accumule doublons après chaque upload de cover | LOT 1 |
| A4 | **MINEURE** | `removeProfilePhoto` ne nettoie pas les champs crop en DB | LOT 1 |
| A5 | **MINEURE** | Type alias positionné entre des blocs `import` | LOT 2 |
| A6 | **MINEURE** | `creator` prop déclarée mais non déstructurée dans `ArtistIdentityForm` | LOT 2 |
| A7 | **MINEURE** | Accessibilité : genre buttons sans `aria-label` explicite | LOT 2 |
| A8 | **MINEURE** | `removeProfilePhoto` efface `cover_path` (risque perte cover si fixe A2 plus tard) | LOT 1 (inclus dans fix A2) |

---

## ANALYSE DÉTAILLÉE

---

### A1 — CRITIQUE : Avatar original pollue `cover_images[]`

**Fichier :** [apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx:138-157](apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx#L138-L157)
**Service :** [packages/api/src/creator/creator.service.ts:301-318](packages/api/src/creator/creator.service.ts#L301-L318)

**Cause racine :**
Lors d'un nouvel upload avatar, l'original est envoyé avec `assetKind: "gallery"`. La fonction Edge `creator-asset-signed-url` a un comportement documenté : `assetKind: "gallery"` → **ajoute le path à `cover_images[]`** et met à jour `banner_path = cover_images[0]`.

```
// ArtistProfilePhoto.tsx:142-148
const { ..., path: origPath } = await creatorService.requestAssetUploadUrl({
  creatorId,
  assetKind: "gallery",   // ← DÉCLENCHE cover_images[] append dans l'Edge Fn
  contentType: origContentType,
});
```

**Impact concret :**
- Si l'artiste n'a pas de cover : `cover_images = [avatarOriginalPath]` → `banner_path = avatarOriginalPath`
- `ArtistHero.tsx` : `primaryCoverPath = cover_images?.[0] ?? banner_path` → **affiche l'original non recadré de l'avatar comme fond du hero**
- L'original avatar est une image portrait (ratio ≠ 16:9) → affichage visuellement cassé
- Accumulation : chaque re-crop ajoute l'original en fin de `cover_images[]` → galerie polluée

**Stratégie de correction (sans modifier l'Edge Function) :**
Dans `creator.service.ts` → méthode `saveAvatarCrop` : après persistance des données crop, filtrer `cover_images[]` pour **retirer les paths avatar** (original + crop).

```typescript
// Après updateCropData(...)
const avatarPaths = new Set([input.originalPath, input.croppedPath]);
const cleanImages = (updated.cover_images ?? []).filter(p => !avatarPaths.has(p));
if (cleanImages.length !== (updated.cover_images?.length ?? 0)) {
  return this.repository.updateArtistProfileMedia(input.creatorId, userId, {
    cover_images: cleanImages,
    banner_path: cleanImages[0] ?? null,
  });
}
return updated;
```

**Fichiers à modifier :**
- `packages/api/src/creator/creator.service.ts` → méthode `saveAvatarCrop`

---

### A2 — CRITIQUE : Avatar crop écrase `cover_path` via `assetKind: "cover"`

**Fichier :** [apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx:159-165](apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx#L159-L165)
**Service :** [packages/api/src/creator/creator.service.ts:277-284](packages/api/src/creator/creator.service.ts#L277-L284)

**Cause racine :**
Le crop avatar est uploadé avec `assetKind: "cover"`. Comportement Edge Fn documenté : `assetKind: "cover"` → **`cover_path = profile_photo = croppedAvatarPath`**. Résultat : `cover_path` (champ hero principal) est **réécrit avec le path de l'avatar**.

```
// ArtistProfilePhoto.tsx:159-165
const { ..., path: croppedPath } = await creatorService.requestAssetUploadUrl({
  creatorId,
  assetKind: "cover",   // ← Edge Fn écrit cover_path = croppedAvatarPath
  contentType: "image/jpeg",
});
```

**Impact concret :**
- Si l'artiste avait une vraie cover : `cover_path` est maintenant l'avatar crop → la cover précédente est perdue en DB (fichier toujours en storage, référence DB perdue)
- `removeProfilePhoto` efface `cover_path: null` + `profile_photo: null` → **efface aussi la référence à la vraie cover** si elle était stockée dans `cover_path`
- `ArtistHero.tsx` : `photoPath = artistProfile.profile_photo ?? artistProfile.cover_path` → fonctionne si `profile_photo` est set, mais `cover_path` est sémantiquement incorrect

**Stratégie de correction (sans modifier l'Edge Function) :**

**Étape 1** — Changer l'upload du crop avatar de `"cover"` → `"gallery"` dans `ArtistProfilePhoto.tsx` :
```typescript
// AVANT
assetKind: "cover",
// APRÈS
assetKind: "gallery",   // Edge Fn : ajoute à cover_images[] mais NE touche pas cover_path
```

**Étape 2** — Changer `assetKind` du display dans `ArtistProfilePhoto.tsx` (ligne 229) :
```typescript
// AVANT
assetKind="cover"
// APRÈS
assetKind="gallery"   // le crop avatar est maintenant en bucket gallery
```

**Étape 3** — `saveAvatarCrop` nettoie `cover_images[]` des paths avatar (couvert par fix A1) + **ne touche plus `cover_path`** (ne pas écraser la vraie cover).

**Étape 4** — `removeProfilePhoto` ne doit **pas** effacer `cover_path` (qui appartient au hero, pas à l'avatar) :
```typescript
// AVANT
return this.repository.updateArtistProfileMedia(creatorId, userId, {
  profile_photo: null,
  cover_path: null,    // ← SUPPRIMER
});
// APRÈS
return this.repository.updateArtistProfileMedia(creatorId, userId, {
  profile_photo: null,
  avatar_original_path: null,  // + fix A4
  avatar_crop_x: null,
  avatar_crop_y: null,
  avatar_crop_zoom: null,
});
```

**Fichiers à modifier :**
- `apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx` (lignes 162, 229)
- `packages/api/src/creator/creator.service.ts` → méthodes `saveAvatarCrop` + `removeProfilePhoto`

---

### A3 — MAJEURE : Doublons dans `cover_images[]` après upload de cover

**Fichier :** [apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx:117-190](apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx#L117-L190)
**Service :** [packages/api/src/creator/creator.service.ts:320-341](packages/api/src/creator/creator.service.ts#L320-L341)

**Cause racine — séquence d'exécution :**

Lors d'un upload cover avec nouveau fichier :
1. Upload original → `assetKind: "gallery"` → Edge Fn : `cover_images = [...prev, origPath]`
2. Upload cropped → `assetKind: "gallery"` → Edge Fn : `cover_images = [...prev, origPath, croppedPath]`
3. `saveCoverPrimaryCrop({croppedPath, originalPath})` → lit `cover_images = [prev, origPath, croppedPath]`
   → calcule `updatedImages = [croppedPath, ...existing.slice(1)] = [croppedPath, origPath, croppedPath]`
   → **`croppedPath` apparaît en position 0 ET en dernière position** → DOUBLON

Problème secondaire : `origPath` reste dans `cover_images[]` → accumulation des originaux entre uploads.

**Impact concret :**
- Incohérence DB : `cover_images[]` contient des paths en doublon
- Accumulation sur plusieurs uploads → tableau croissant indéfiniment
- Sur 10 uploads successifs : `cover_images[]` peut atteindre 20+ entrées avec originaux et copies
- Impact fonctionnel immédiat faible (seul `[0]` est affiché), mais corruption de données progressive

**Stratégie de correction :**
Dans `saveCoverPrimaryCrop` du service, filtrer `cover_images[]` pour retirer à la fois le doublon du crop ET l'original (non affiché, seulement utilisé pour le re-crop via `cover_primary_original`) :

```typescript
// AVANT
const updatedImages = [input.croppedPath, ...coverImages.slice(1)];

// APRÈS
const filtered = coverImages.filter(
  p => p !== input.croppedPath && p !== input.originalPath
);
const updatedImages = [input.croppedPath, ...filtered.slice(0, 9)]; // max 10 covers
```

`input.originalPath` est déjà persisté dans `cover_primary_original` pour le re-crop → inutile de le garder dans `cover_images[]`.

**Fichiers à modifier :**
- `packages/api/src/creator/creator.service.ts` → méthode `saveCoverPrimaryCrop`

---

### A4 — MINEURE : `removeProfilePhoto` ne nettoie pas les champs crop avatar

**Fichier :** [packages/api/src/creator/creator.service.ts:277-284](packages/api/src/creator/creator.service.ts#L277-L284)

**Cause racine :**
```typescript
async removeProfilePhoto(creatorId: string): Promise<ArtistProfile> {
  return this.repository.updateArtistProfileMedia(creatorId, userId, {
    profile_photo: null,
    cover_path: null,
    // ← avatar_original_path, avatar_crop_x/y/zoom NON effacés
  });
}
```

**Impact concret :**
- Après suppression de l'avatar : `avatar_original_path` pointe toujours vers un fichier storage
- Si l'artiste upload un nouvel avatar : `useCreatorAssetUrl(creatorId, localOriginalPath, "gallery")` dans `ArtistProfilePhoto.tsx` va tenter de récupérer une URL signée pour l'ancien original (stale)
- Si le fichier storage a expiré ou été nettoyé : erreur silencieuse à l'ouverture du crop editor

**Stratégie de correction :** incluse dans le fix A2 ci-dessus (ajout de `avatar_original_path: null, avatar_crop_x: null, avatar_crop_y: null, avatar_crop_zoom: null` dans `removeProfilePhoto`).

---

### A5 — MINEURE : Type alias positionné entre des blocs `import`

**Fichiers :**
- [apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx:11-12](apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx#L11-L12)
- [apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx:17-18](apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx#L17-L18)

**Cause racine :**
```typescript
// ArtistProfilePhoto.tsx
import { IMAGE_ACCEPT, IMAGE_POLICY, resolveImageUploadMime, type ImageMime } from "@sonafrik/shared";
import { ... } from "@/lib/image/compress-image";

type AllowedImageMime = ImageMime;  // ← entre deux blocs d'imports
import { invalidateCreatorAssetUrl } from "@/lib/image/creator-asset-url-cache";
```

TypeScript l'accepte mais c'est une violation de convention : les types doivent être définis **après** tous les imports. ESLint strict (`import/order`) le signalerait.

**Stratégie de correction :** Déplacer `type AllowedImageMime = ImageMime;` après le dernier `import`. Dans les deux composants.

---

### A6 — MINEURE : Prop `creator` déclarée mais non utilisée dans `ArtistIdentityForm`

**Fichier :** [apps/web/src/features/creator/components/ArtistIdentityForm.tsx:12-17](apps/web/src/features/creator/components/ArtistIdentityForm.tsx#L12-L17)

**Cause racine :**
```typescript
export function ArtistIdentityForm({
  profile,              // ← seul prop destructuré
}: {
  creator: Creator;    // ← déclaré dans le type mais jamais utilisé
  profile: ArtistProfile;
}) {
```

**Impact :** `creator` est passé par le parent mais jamais lu. Dette sémantique mineure, pas d'impact runtime.

**Stratégie de correction :** Supprimer `creator: Creator;` du type de props (et mettre à jour les sites d'appel si `creator` n'est pas nécessaire) OU déstructurer et utiliser `creator` si des infos de `Creator` sont nécessaires dans le formulaire.

---

### A7 — MINEURE : Accessibilité — genre buttons sans aria-label

**Fichier :** [apps/web/src/features/creator/components/ArtistIdentityForm.tsx:115-130](apps/web/src/features/creator/components/ArtistIdentityForm.tsx#L115-L130)

**Cause racine :**
```tsx
<button
  key={genre}
  type="button"
  onClick={() => toggleGenre(genre)}
  className={...}
>
  {genre}  {/* visible pour l'œil, mais pas d'aria-pressed pour l'état sélectionné */}
</button>
```

**Impact :** Les screen readers ne communiquent pas l'état sélectionné/non-sélectionné du genre. Le bouton est actif (type="button", texte visible) mais `aria-pressed` manque.

**Stratégie de correction :**
```tsx
<button
  key={genre}
  type="button"
  aria-pressed={genres.includes(genre)}
  onClick={() => toggleGenre(genre)}
  className={...}
>
  {genre}
</button>
```

---

## PLAN D'EXÉCUTION PAR LOTS

### LOT 1 — Corrections critiques avatar + cover (A1, A2, A3, A4, A8)

**Objectif :** Éliminer les corruptions de données (cover_images, cover_path) causées par les uploads avatar.
**Risque :** MOYEN — modifications du service `creator.service.ts` et d'un composant clé.
**Rollback :** git revert sur le commit du lot.

**Fichiers à modifier :**

| Fichier | Changement |
|---|---|
| `packages/api/src/creator/creator.service.ts` | `saveAvatarCrop` : nettoyer cover_images après crop |
| `packages/api/src/creator/creator.service.ts` | `removeProfilePhoto` : ajouter nettoyage champs crop + supprimer `cover_path: null` |
| `packages/api/src/creator/creator.service.ts` | `saveCoverPrimaryCrop` : filtrer doublons + original dans cover_images |
| `apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx` | Changer assetKind "cover" → "gallery" (ligne 162) |
| `apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx` | Changer assetKind dans CreatorAssetImage (ligne 229) |

**Tests manuels après LOT 1 :**
- [ ] Upload avatar → hero cover non affectée
- [ ] Re-crop avatar → hero cover toujours correcte
- [ ] Supprimer avatar → cover_images[] inchangée, champs crop DB nettoyés
- [ ] Upload cover → `cover_images[]` = [croppedPath] seulement (pas d'original, pas de doublon)
- [ ] Re-upload cover → `cover_images[]` = [newCrop, prevCrop] (pas d'accumulation d'originaux)
- [ ] Vérifier en DB : `SELECT cover_images, banner_path, profile_photo, cover_path, avatar_original_path FROM artist_profiles WHERE ...`

**Validation build :**
```bash
pnpm build && pnpm lint && pnpm typecheck
```

---

### LOT 2 — Qualité code + Accessibilité (A5, A6, A7)

**Objectif :** Nettoyer la qualité code et améliorer l'accessibilité des genre buttons.
**Risque :** FAIBLE — aucun impact fonctionnel.

**Fichiers à modifier :**

| Fichier | Changement |
|---|---|
| `apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx` | Déplacer `type AllowedImageMime` après tous les imports |
| `apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx` | Déplacer `type AllowedImageMime` après tous les imports |
| `apps/web/src/features/creator/components/ArtistIdentityForm.tsx` | Supprimer prop `creator: Creator` inutilisée |
| `apps/web/src/features/creator/components/ArtistIdentityForm.tsx` | Ajouter `aria-pressed` sur genre buttons |

**Tests manuels après LOT 2 :**
- [ ] `pnpm lint` → 0 warning
- [ ] `pnpm typecheck` → 0 erreur
- [ ] Tester navigation clavier dans le formulaire identité (tab + espace sur genre)

---

### LOT 3 — Responsive & Performance (si nécessaire post-validation)

**Objectif :** Vérifier les breakpoints hero et performances CropEditorModal.
**Note :** D'après l'audit de `hero.css`, le responsive est bien géré (640px, 380px). Ce lot est conditionnel aux résultats des tests LOT 1.

**À évaluer :**
- [ ] Affichage hero sur mobile < 380px (stats row overflow ?)
- [ ] Performance canvas crop sur mobile (mémoire blob)
- [ ] Révocation des Object URLs dans `ArtistCoverSlider` (déjà présent ligne 181) ✅

---

## CONTRAINTES TECHNIQUES RAPPELÉES

1. **Edge Functions interdites** — `creator-asset-signed-url` NE SERA PAS modifiée. Toute correction doit passer par le service ou le composant.
2. **Pas de nouvelle dépendance npm** — fixes purement logiques.
3. **CSS tokens uniquement** — aucun hex hardcodé à introduire.
4. **Types via `packages/types/`** — aucun type re-défini localement.
5. **Domaine Publication intouché** — vérifier avant chaque commit.

---

## DÉCISION ATTENDUE

**Avant de commencer LOT 1 :**
- Valider cette analyse et la stratégie de correction
- Confirmer l'approche `assetKind: "gallery"` pour le crop avatar (vs `assetKind: "cover"`)
- Confirmer que `removeProfilePhoto` peut arrêter de mettre `cover_path: null`

**ARRÊT COMPLET ICI — EN ATTENTE DE VALIDATION LOT 1**
