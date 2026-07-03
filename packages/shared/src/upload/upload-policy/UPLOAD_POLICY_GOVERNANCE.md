# UPLOAD POLICY ENTERPRISE — Gouvernance Officielle

> **Version certifiée :** 1.1.0  
> **Statut :** 🔒 ARCHITECTURE GELÉE — Architecture Freeze  
> **Date de gel :** 2026-07-03  
> **Autorité :** Rémy Goumou (fondateur) — Claude Sonnet 4.6 (architecte)  
> **Module :** `packages/shared/src/upload/upload-policy/`

---

## DÉCLARATION OFFICIELLE D'ARCHITECTURE FREEZE

L'**Upload Policy Enterprise Version 1.1.0** est officiellement déclarée comme :

1. **Source Unique de Vérité** pour tous les uploads SONAFRIK
2. **Architecture officielle** des uploads — référence définitive
3. **Fondation certifiée** avant la Phase 2 de migration

Aucune règle d'upload ne peut exister en dehors de `packages/shared/src/upload/upload-policy/`.  
Toute violation constitue une dette technique critique à corriger immédiatement.

---

## PÉRIMÈTRE CERTIFIÉ

### Ce que couvre cette version

| Composant | Fichier | Statut |
|-----------|---------|--------|
| Versioning | `version.ts` | ✅ Certifié |
| Enums officiels | `enums.ts` | ✅ Certifié |
| Types TypeScript | `types.ts` | ✅ Certifié |
| Politiques par catégorie | `constants.ts` | ✅ Certifié |
| Limites de taille | `limits.ts` | ✅ Certifié |
| Attributs HTML accept | `accept.ts` | ✅ Certifié |
| Messages officiels | `messages.ts` | ✅ Certifié |
| Helpers de validation | `helpers.ts` | ✅ Certifié |
| Événements d'upload | `events.ts` | ✅ Certifié |
| Types de télémétrie | `telemetry.ts` | ✅ Certifié |

### Formats et limites officiels certifiés

| Catégorie | Formats | Limite |
|-----------|---------|--------|
| Audio | MP3, M4A, WAV | 100 Mo |
| Image | JPEG, PNG, WebP | 10 Mo |
| Document | PDF | 20 Mo |

---

## RÈGLES DE GOUVERNANCE

### Règle 1 — Source Unique de Vérité

Toute règle d'upload (format, taille, MIME, extension, message, validation)
**doit provenir exclusivement** de `packages/shared/src/upload/upload-policy/`.

Il n'existe pas de source alternative autorisée.

### Règle 2 — Immutabilité de l'architecture gelée

L'architecture 1.1.0 est **figée**. Elle ne peut être modifiée qu'au travers
du processus officiel de versionnement décrit dans ce document.

### Règle 3 — Traçabilité des évolutions

Toute évolution doit être documentée dans le `CHANGELOG` du module avant d'être
appliquée. Aucune modification silencieuse n'est autorisée.

### Règle 4 — Interdiction de duplication

Il est interdit de dupliquer une règle ou constante qui existe déjà dans ce module.
Si une règle semble manquante, elle doit être ajoutée ici via le processus officiel,
puis importée depuis ce module.

---

## INTERDICTIONS ABSOLUES

Les patterns suivants sont **interdits** dans tout fichier du projet SONAFRIK,
sans exception :

### ❌ MIME type en dur dans un composant

```typescript
// INTERDIT
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
if (!ACCEPTED.includes(file.type)) { /* ... */ }

// OBLIGATOIRE
import { isImage, IMAGE_POLICY } from "@sonafrik/shared";
if (!isImage(file.type)) { /* ... */ }
```

### ❌ Extension codée en dur

```typescript
// INTERDIT
const ext = /\.(jpe?g|png|webp)$/i.test(file.name);

// OBLIGATOIRE
import { isAllowedExtension, UploadCategory } from "@sonafrik/shared";
const allowed = isAllowedExtension(file.name, UploadCategory.IMAGE);
```

### ❌ Taille maximale locale

```typescript
// INTERDIT
const MAX_SIZE = 5 * 1024 * 1024;
if (file.size > MAX_SIZE) { /* ... */ }

// OBLIGATOIRE
import { UPLOAD_LIMITS, UploadCategory } from "@sonafrik/shared";
if (file.size > UPLOAD_LIMITS.image.maxBytes) { /* ... */ }
```

### ❌ Attribut accept codé en dur

```tsx
// INTERDIT
<input accept="image/jpeg,image/png,image/webp" />
<input accept=".mp3,.m4a" />

// OBLIGATOIRE
import { IMAGE_ACCEPT, AUDIO_ACCEPT } from "@sonafrik/shared";
<input accept={IMAGE_ACCEPT} />
<input accept={AUDIO_ACCEPT} />
```

### ❌ Regex locale sur les extensions

```typescript
// INTERDIT
const isAudio = /\.(mp3|m4a|wav)$/i.test(filename);

// OBLIGATOIRE
import { isAllowedExtension, UploadCategory } from "@sonafrik/shared";
const isAudio = isAllowedExtension(filename, UploadCategory.AUDIO);
```

### ❌ Message d'erreur en dur

```typescript
// INTERDIT
setError("Format non supporté. Utilisez MP3 ou M4A.");
setError(`Fichier trop lourd. Maximum ${MAX_MB} Mo.`);

// OBLIGATOIRE
import { UPLOAD_MESSAGES, uploadSizeExceededMessage, UPLOAD_FORMAT_HINTS } from "@sonafrik/shared";
// ou via le résultat de validateUploadFile() → result.message
```

### ❌ Validation locale dupliquée

```typescript
// INTERDIT
function validateFile(file: File) {
  if (file.size > 10 * 1024 * 1024) return "trop lourd";
  if (!["image/jpeg"].includes(file.type)) return "format invalide";
}

// OBLIGATOIRE
import { validateUploadFile, UploadCategory } from "@sonafrik/shared";
const result = validateUploadFile(
  { type: file.type, name: file.name, size: file.size },
  UploadCategory.IMAGE,
);
if (!result.valid) return result.message;
```

### ❌ Type MIME local

```typescript
// INTERDIT
type ImageMime = "image/jpeg" | "image/png";
type AudioMime = "audio/mp3" | "audio/mpeg";

// OBLIGATOIRE
import type { ImageMime, AudioMime } from "@sonafrik/shared";
```

---

## SOURCE UNIQUE DE VÉRITÉ — API OFFICIELLE

Les éléments suivants sont les **seules références autorisées** pour les décisions
d'upload dans SONAFRIK :

### Versioning

```typescript
import { UPLOAD_POLICY_VERSION } from "@sonafrik/shared";
// → "1.1.0"
```

### Politiques par catégorie

```typescript
import { AUDIO_POLICY, IMAGE_POLICY, DOCUMENT_POLICY, UPLOAD_POLICIES } from "@sonafrik/shared";
```

### Limites de taille

```typescript
import { UPLOAD_LIMITS, MAX_AUDIO_SIZE, MAX_IMAGE_SIZE, MAX_DOCUMENT_SIZE } from "@sonafrik/shared";
```

### Attributs HTML accept

```typescript
import { UPLOAD_ACCEPT, AUDIO_ACCEPT, IMAGE_ACCEPT, DOCUMENT_ACCEPT, VERIFICATION_ACCEPT } from "@sonafrik/shared";
```

### Enums officiels

```typescript
import { UploadCategory, UploadContext, UploadErrorCode, UploadErrorCategory, UploadValidationStatus } from "@sonafrik/shared";
```

### Messages officiels

```typescript
import { UPLOAD_MESSAGES, UPLOAD_ERROR_MESSAGES, UPLOAD_FORMAT_HINTS, uploadSizeExceededMessage } from "@sonafrik/shared";
```

### Helpers de validation

```typescript
import {
  validateUploadFile,
  resolveUploadMime,
  normalizeMime,
  isAudio, isImage, isDocument,
  isAllowedMime, isAllowedExtension, isAllowedSize,
  resolveVerificationDocMime,
  resolveAudioUploadMime,
  resolveImageUploadMime,
} from "@sonafrik/shared";
```

### Types TypeScript

```typescript
import type {
  AudioMime, ImageMime, DocumentMime, AllowedMime,
  UploadPolicy, UploadFileDescriptor, UploadValidationResult, UploadWarning,
  UploadEvent, UploadTelemetryData,
} from "@sonafrik/shared";
```

---

## PROCESSUS D'ÉVOLUTION OFFICIEL

Toute évolution de l'architecture Upload Policy **doit** suivre ce processus sans exception.

```
Besoin identifié
      ↓
Proposition écrite dans ce document (section "Propositions en attente")
      ↓
Architecture Review (Martin + Rémy)
      ↓
Décision : Acceptée / Refusée / Reportée
      ↓
[Si acceptée]
Incrémentation de version sémantique :
  • Patch 1.1.x  : correction d'un bug, ajout d'alias MIME non prévu
  • Minor 1.x.0  : ajout d'un format/limite/contexte nouveau
  • Major x.0.0  : refonte de l'interface publique (rare)
      ↓
Implémentation dans upload-policy/ uniquement
      ↓
Tests : pnpm typecheck + pnpm lint + pnpm build → 0 erreur
      ↓
Mise à jour du CHANGELOG dans README.md
      ↓
Mise à jour de UPLOAD_POLICY_VERSION dans version.ts
      ↓
Commit + Push avec message feat(upload-policy): v1.x.x — description
      ↓
Mise à jour de ce document (version certifiée, date)
      ↓
Certification officielle
```

### Exemples de versions futures

| Version | Motif |
|---------|-------|
| 1.1.1 | Ajout d'alias MIME `audio/mpeg3` observé sur un navigateur |
| 1.2.0 | Ajout du format OGG pour les previews |
| 1.3.0 | Ajout de limites par AssetKind (avatar ≠ banner ≠ cover) |
| 2.0.0 | Refonte de l'interface si la politique devient async |

---

## CHECKLIST PULL REQUEST (OBLIGATOIRE)

Avant tout Pull Request touchant un upload, vérifier chaque point :

### Règles de non-duplication

```
□ Aucun MIME type codé en dur dans le composant
□ Aucun attribut accept="" codé en dur dans le JSX
□ Aucune taille maximale définie localement (MAX_SIZE, maxMB, etc.)
□ Aucun message d'erreur texte en dur
□ Aucun helper de validation local (validateFile, checkFormat, etc.)
□ Aucun type MIME défini localement (type AudioMime = ...)
□ Aucune regex locale sur les extensions
□ Toutes les validations passent par validateUploadFile()
□ Tous les accept= viennent de UPLOAD_ACCEPT / AUDIO_ACCEPT / etc.
□ Tous les messages viennent de UPLOAD_MESSAGES / validateUploadFile().message
```

### Qualité

```
□ pnpm build     : 0 erreur
□ pnpm lint      : 0 avertissement, 0 erreur
□ pnpm typecheck : 0 erreur TypeScript
```

---

## CHECKLIST ARCHITECTURE REVIEW

Avant toute modification du module `upload-policy/` lui-même :

```
□ Le besoin a été décrit en langage naturel (pas directement en code)
□ La proposition a été soumise à Architecture Review
□ La décision est documentée dans ce fichier
□ La version sémantique a été déterminée (patch / minor / major)
□ La rétrocompatibilité est garantie (ou une Major est justifiée)
□ UPLOAD_POLICY_VERSION est mis à jour dans version.ts
□ Le CHANGELOG dans README.md est mis à jour
□ pnpm build + lint + typecheck passent à 0 erreur
□ Le commit porte le tag feat(upload-policy): vX.Y.Z — description
□ Ce document est mis à jour (version certifiée, date)
```

---

## VALIDATION ARCHITECTURE FREEZE

### Certification Phase 1 — Foundation

| Critère | Statut |
|---------|--------|
| Module créé dans le bon emplacement | ✅ |
| Politiques officielles définies (Audio/Image/Document) | ✅ |
| MIME types et aliases centralisés | ✅ |
| Extensions centralisées | ✅ |
| Limites de taille centralisées | ✅ |
| Messages d'erreur centralisés | ✅ |
| Helpers de validation créés | ✅ |
| Types TypeScript définis | ✅ |
| Enums officiels définis | ✅ |
| Aucun composant existant modifié | ✅ |
| pnpm build 9/9 ✅ · lint 15/15 ✅ · typecheck 15/15 ✅ | ✅ |

### Certification Phase 1.1 — Foundation Hardening

| Critère | Statut |
|---------|--------|
| Versioning sémantique ajouté | ✅ |
| UPLOAD_LIMITS centralisés | ✅ |
| UPLOAD_ACCEPT centralisés | ✅ |
| UploadErrorCategory défini | ✅ |
| UploadContext défini | ✅ |
| UploadEventType défini | ✅ |
| UploadValidationStatus défini | ✅ |
| Événements d'upload typés | ✅ |
| Télémétrie typée | ✅ |
| UploadValidationResult enrichi (rétrocompatible) | ✅ |
| validateUploadFile() retourne errorCategory + policyVersion | ✅ |
| ERROR_CODE_CATEGORY mapping créé | ✅ |
| Aucun composant existant modifié | ✅ |
| pnpm build 9/9 ✅ · lint 15/15 ✅ · typecheck 15/15 ✅ | ✅ |

### Déclaration de gel

> **L'Upload Policy Enterprise Version 1.1.0 est officiellement GELÉE.**
>
> Elle constitue la seule et unique référence architecturale pour tous les
> uploads SONAFRIK à partir du 2026-07-03.
>
> Aucune évolution n'est autorisée sans passer par le processus officiel
> décrit dans ce document.

---

## AUTORISATION PHASE 2

### Conditions de déclenchement

La Phase 2 (Migration des composants) est autorisée si et seulement si :

```
✅ Phase 1 Foundation — certifiée (commit 5007ed9)
✅ Phase 1.1 Foundation Hardening — certifiée (commit fe6fa9f)
✅ Architecture Freeze — documenté (ce fichier)
✅ UPLOAD_POLICY_GOVERNANCE.md — créé et validé
✅ Aucun composant modifié pendant les phases 1 et 1.1
✅ Aucun comportement utilisateur altéré
```

### Déclaration officielle

> **La Phase 2 — Migration des Composants est AUTORISÉE.**
>
> Elle peut commencer immédiatement après validation de ce document.
>
> Le plan de migration est détaillé dans `MIGRATION_PLAN.md`.

### Périmètre Phase 2

La Phase 2 migrera les 14 fichiers identifiés dans `MIGRATION_PLAN.md` :

| Priorité | Fichier | Type |
|----------|---------|------|
| 1 | `packages/shared/src/audio/audio-integrity.ts` | Shared |
| 2 | `apps/web/src/lib/image/compress-image.ts` | Lib |
| 3 | `ArtistProfilePhoto.tsx` | Composant |
| 3 | `ArtistCoverSlider.tsx` | Composant |
| 3 | `ArtistCoverManager.tsx` | Composant |
| 4 | `AvatarUpload.tsx` | Composant |
| 5 | `AudioUploader.tsx` | Uploader |
| 5 | `CoverUploader.tsx` | Uploader |
| 6 | `ArtistIdentityForm.tsx` | Form |
| 6 | `VerificationPanel.tsx` | Form |
| 7 | `packages/api/src/catalog/schemas.ts` | Schéma |
| 7 | `packages/api/src/creator/schemas.ts` | Schéma |
| 8 | `supabase/functions/catalog-asset-signed-url/index.ts` | Edge Fn |
| 8 | `supabase/functions/_shared/audio-integrity.ts` | Edge Fn |

### Règle Phase 2

Chaque fichier migré doit :
1. Supprimer toute définition locale de format/taille/message
2. Importer depuis `@sonafrik/shared`
3. Passer la checklist PR ci-dessus
4. Valider `pnpm typecheck + lint + build` à 0 erreur avant tout commit

---

*Document créé le 2026-07-03. Version certifiée : 1.1.0.*  
*Prochaine révision autorisée : lors de la certification Phase 2 ou d'une évolution de version.*
