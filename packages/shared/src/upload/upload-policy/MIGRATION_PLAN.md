# Plan de Migration — Upload Policy Enterprise Phase 2

> **Statut Phase 1 :** ✅ Fondation créée  
> **Phase 2 :** Connexion des composants existants — EN ATTENTE DE VALIDATION PHASE 1

---

## Cartographie du système existant (audit Phase 1)

### A. Définitions locales à supprimer / remplacer

| Fichier | Constante locale | Remplacée par |
|---------|-----------------|--------------|
| `apps/web/src/lib/image/compress-image.ts` | `IMAGE_UPLOAD.MAX_BYTES = 5MB` | `IMAGE_POLICY.maxBytes` (10MB) |
| `apps/web/src/lib/image/compress-image.ts` | `IMAGE_UPLOAD.ALLOWED_TYPES` | `IMAGE_POLICY.mimes` |
| `apps/web/src/lib/image/compress-image.ts` | `AllowedImageMime` type | `ImageMime` (upload-policy) |
| `apps/web/src/lib/image/compress-image.ts` | `isAllowedImageMime()` | `isImage()` (upload-policy) |
| `packages/shared/src/audio/audio-integrity.ts` | `MAX_UPLOAD_BYTES = 50MB` | `AUDIO_POLICY.maxBytes` (100MB) |
| `packages/shared/src/audio/audio-integrity.ts` | `UPLOAD_AUDIO_MIME` record | `AUDIO_MIME_TO_DB_FORMAT` |
| `packages/shared/src/audio/audio-integrity.ts` | `mimeToUploadFormat()` | Dérivé de `AUDIO_MIME_TO_DB_FORMAT` |

---

### B. Composants upload à migrer

#### 1. AudioUploader
**Fichier :** `apps/web/src/features/creator/catalog/components/AudioUploader.tsx`

| Élément local | Remplacé par |
|--------------|-------------|
| `ACCEPTED_EXTENSIONS = ".mp3,.m4a"` | `AUDIO_POLICY.accept` (`.mp3,.m4a,.wav`) |
| `MAX_SIZE_MB = 50` | `AUDIO_POLICY.maxBytes / 1024 / 1024` (100) |
| `MIME_CANONICAL` record local | `AUDIO_MIME_CANONICAL` (upload-policy) |
| `resolveFormatFromFile()` | Dérivé de `AUDIO_MIME_TO_DB_FORMAT` + `resolveExtension()` |
| `resolveEffectiveMime()` | `resolveAudioUploadMime()` (upload-policy) |
| Validate inline `if file.size > MAX_UPLOAD_BYTES` | `validateUploadFile(file, UploadCategory.AUDIO)` |
| `"Format non supporté. Choisissez un fichier MP3 ou M4A."` | `UPLOAD_FORMAT_HINTS.AUDIO` |

**Note Phase 2 :** WAV sera accepté (politique officielle). La validation `validateAudioAsset` retournera `needs_review` pour WAV — à gérer dans le wizard (présenter un message d'avertissement, pas de blocage).

---

#### 2. CoverUploader
**Fichier :** `apps/web/src/features/creator/catalog/components/CoverUploader.tsx`

| Élément local | Remplacé par |
|--------------|-------------|
| `ACCEPTED_TYPES = ["image/jpeg","image/png","image/webp"]` | `IMAGE_POLICY.mimes` |
| `MAX_SIZE_BYTES = 5MB` | `IMAGE_POLICY.maxBytes` (10MB) |
| `MAX_SIZE_LABEL = "5 Mo"` | `IMAGE_POLICY.maxLabel` |
| `validate()` inline | `validateUploadFile(file, UploadCategory.IMAGE)` |
| `accept={ACCEPTED_TYPES.join(",")}` | `accept={IMAGE_POLICY.accept}` |
| `"utilisez JPEG, PNG ou WebP"` en dur | `UPLOAD_FORMAT_HINTS.IMAGE` |

---

#### 3. AvatarUpload
**Fichier :** `apps/web/src/features/identity/components/AvatarUpload.tsx`

| Élément local | Remplacé par |
|--------------|-------------|
| `AVATAR_ALLOWED_TYPES` | `IMAGE_POLICY.mimes` |
| `AVATAR_MAX_BYTES = 5MB` | `IMAGE_POLICY.maxBytes` (10MB) |
| `AvatarMime` type | `ImageMime` |
| `accept="image/jpeg,image/png,image/webp"` | `accept={IMAGE_POLICY.accept}` |
| Validation inline | `validateUploadFile()` |

---

#### 4. ArtistProfilePhoto
**Fichier :** `apps/web/src/features/creator/dashboard/components/ArtistProfilePhoto.tsx`

| Élément local | Remplacé par |
|--------------|-------------|
| `import { IMAGE_UPLOAD, isAllowedImageMime, AllowedImageMime }` | `import { IMAGE_POLICY, isImage, ImageMime }` |
| `IMAGE_UPLOAD.MAX_BYTES` | `IMAGE_POLICY.maxBytes` |
| `IMAGE_UPLOAD.ALLOWED_TYPES.join(",")` | `IMAGE_POLICY.accept` |
| `isAllowedImageMime(file.type)` | `isImage(file.type)` |
| `"Format non autorisé. Utilisez JPG, PNG ou WebP."` | `UPLOAD_FORMAT_HINTS.IMAGE` |
| `"Image trop lourde. Maximum 5 Mo."` | `uploadSizeExceededMessage(...)` |

---

#### 5. ArtistCoverSlider
**Fichier :** `apps/web/src/features/creator/dashboard/components/ArtistCoverSlider.tsx`

Mêmes remplacements que `ArtistProfilePhoto` (même pattern d'import `IMAGE_UPLOAD`).

---

#### 6. ArtistCoverManager
**Fichier :** `apps/web/src/features/creator/dashboard/components/ArtistCoverManager.tsx`

| Élément local | Remplacé par |
|--------------|-------------|
| `IMAGE_UPLOAD.MAX_BYTES` | `IMAGE_POLICY.maxBytes` |
| `IMAGE_UPLOAD.MAX_GALLERY_ITEMS` | Conserver (non couvert par upload-policy v1) |
| `IMAGE_UPLOAD.ALLOWED_TYPES.join(",")` | `IMAGE_POLICY.accept` |
| `isAllowedImageMime(file.type)` | `isImage(file.type)` |
| `AllowedImageMime` type + cast | `resolveImageUploadMime(file)` |

---

#### 7. ArtistIdentityForm (bannière)
**Fichier :** `apps/web/src/features/creator/components/ArtistIdentityForm.tsx`

| Élément local | Remplacé par |
|--------------|-------------|
| `ALLOWED = ["image/jpeg","image/png","image/webp"]` inline | `IMAGE_POLICY.mimes` |
| `file.size > 5 * 1024 * 1024` | `!isAllowedSize(file.size, UploadCategory.IMAGE)` |
| `"Format non autorisé. Utilisez JPEG, PNG ou WebP."` | `UPLOAD_FORMAT_HINTS.IMAGE` |
| `accept="image/jpeg,image/png,image/webp"` | `accept={IMAGE_POLICY.accept}` |
| Type `BannerMime` local | `ImageMime` |

---

#### 8. VerificationPanel (documents)
**Fichier :** `apps/web/src/features/creator/components/VerificationPanel.tsx`

| Élément local | Remplacé par |
|--------------|-------------|
| `VERIFICATION_ALLOWED_MIMES` (ajouté BUG-011) | `[...IMAGE_POLICY.mimes, ...DOCUMENT_POLICY.mimes]` |
| `resolveVerificationContentType()` (ajouté BUG-011) | `resolveVerificationDocMime()` (upload-policy) |
| `accept="image/jpeg,image/png,image/webp,application/pdf"` | `${IMAGE_POLICY.accept},${DOCUMENT_POLICY.accept}` |
| `VerificationMime` type local | Union de `ImageMime | DocumentMime` |

---

### C. Services et schémas Zod à mettre à jour

| Fichier | Élément | Mise à jour |
|---------|---------|-------------|
| `packages/api/src/catalog/schemas.ts` | `catalogAssetConfirmSchema.fileSizeBytes.max(50MB)` | `AUDIO_POLICY.maxBytes` (100MB) |
| `packages/api/src/creator/schemas.ts` | `creatorAssetUploadSchema.contentType z.enum([...])` | Dériver de `[...IMAGE_POLICY.mimes, ...DOCUMENT_POLICY.mimes]` |

---

### D. Module shared/audio à synchroniser

| Fichier | Élément | Action |
|---------|---------|--------|
| `packages/shared/src/audio/audio-integrity.ts` | `MAX_UPLOAD_BYTES = 50MB` | Remplacer par `AUDIO_POLICY.maxBytes` (import croisé) |
| `packages/shared/src/audio/audio-integrity.ts` | `UPLOAD_AUDIO_MIME` | Migrer vers `AUDIO_MIME_TO_DB_FORMAT` |
| `packages/shared/src/audio/audio-integrity.ts` | `mimeToUploadFormat()` | Wrapper de `AUDIO_MIME_TO_DB_FORMAT` |

---

### E. Edge functions à synchroniser

| Fichier | Élément | Action |
|---------|---------|--------|
| `supabase/functions/catalog-asset-signed-url/index.ts` | `AUDIO_TYPES` record | Aligner sur `AUDIO_MIME_TO_DB_FORMAT` |
| `supabase/functions/catalog-asset-signed-url/index.ts` | `VISUAL_TYPES` array | Aligner sur `IMAGE_POLICY.mimes` |
| `supabase/functions/_shared/audio-integrity.ts` | `MAX_UPLOAD_BYTES` | Aligner sur `AUDIO_POLICY.maxBytes` |

---

## Ordre de migration recommandé (Phase 2)

```
Étape 1 : shared/audio/audio-integrity.ts
  → Synchroniser MAX_UPLOAD_BYTES, UPLOAD_AUDIO_MIME avec upload-policy
  → Valider : pnpm typecheck 0 erreur

Étape 2 : apps/web/src/lib/image/compress-image.ts
  → Supprimer IMAGE_UPLOAD, AllowedImageMime, isAllowedImageMime
  → Remplacer par imports upload-policy
  → Valider : pnpm typecheck 0 erreur

Étape 3 : Composants creator/dashboard (ArtistProfilePhoto, ArtistCoverSlider, ArtistCoverManager)
  → Mettre à jour imports depuis upload-policy
  → Valider : pnpm typecheck 0 erreur

Étape 4 : Composants identity (AvatarUpload)
  → Mettre à jour validation
  → Valider : pnpm typecheck 0 erreur

Étape 5 : Uploaders catalog (AudioUploader, CoverUploader)
  → Mettre à jour policy + messages + format resolution
  → Valider : pnpm typecheck 0 erreur + tests E2E upload

Étape 6 : Forms (ArtistIdentityForm, VerificationPanel)
  → Remplacer validation locale par upload-policy
  → Valider : pnpm typecheck 0 erreur

Étape 7 : Schémas Zod (catalog/schemas.ts, creator/schemas.ts)
  → Dériver maxBytes et contentType enum depuis upload-policy
  → Valider : pnpm typecheck 0 erreur

Étape 8 : Edge functions (Supabase)
  → Synchroniser AUDIO_TYPES, VISUAL_TYPES
  → Valider : test edge function

Étape 9 : Audit final
  → Vérifier qu'aucune constante locale de format/taille ne subsiste
  → Mettre à jour EXECUTION_LOG.md
  → pnpm build && pnpm lint && pnpm typecheck : 0 erreur
```

---

## Checklist de validation Phase 2

- [ ] Aucune constante `MAX_SIZE_BYTES` / `MAX_SIZE_MB` / `MAX_UPLOAD_BYTES` locale
- [ ] Aucune liste `ACCEPTED_TYPES` / `ALLOWED_TYPES` locale
- [ ] Aucun regex `/\.(jpe?g|png|webp)$/i` local
- [ ] Aucun texte d'erreur en dur dans les composants
- [ ] Aucun MIME type en dur dans les attributs `accept`
- [ ] Tous les `accept` viennent de `XXX_POLICY.accept`
- [ ] Tous les `maxBytes` viennent de `XXX_POLICY.maxBytes`
- [ ] Tous les messages d'erreur viennent de `UPLOAD_MESSAGES`
- [ ] `pnpm build` : ✅ 0 erreur
- [ ] `pnpm lint` : ✅ 0 erreur
- [ ] `pnpm typecheck` : ✅ 0 erreur
