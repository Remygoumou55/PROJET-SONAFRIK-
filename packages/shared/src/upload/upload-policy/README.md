# SONAFRIK — Upload Policy Enterprise

> **Version :** 1.0 — Phase 1 Foundation  
> **Module :** `packages/shared/src/upload/upload-policy/`  
> **Statut :** Fondation créée · Migration Phase 2 en attente

---

## Architecture

```
packages/shared/src/upload/
├── index.ts                        ← barrel namespace upload
└── upload-policy/
    ├── index.ts                    ← barrel public du module
    ├── enums.ts                    ← UploadCategory, AudioFormat, ImageFormat, AssetKind, UploadErrorCode
    ├── types.ts                    ← AudioMime, ImageMime, UploadPolicy, UploadValidationResult
    ├── constants.ts                ← AUDIO_POLICY, IMAGE_POLICY, DOCUMENT_POLICY, UPLOAD_POLICIES
    ├── messages.ts                 ← UPLOAD_MESSAGES, UPLOAD_ERROR_MESSAGES, UPLOAD_STATUS_MESSAGES
    ├── helpers.ts                  ← isAudio(), isImage(), validateUploadFile(), resolveUploadMime()…
    ├── README.md                   ← cette documentation
    └── MIGRATION_PLAN.md           ← plan de migration Phase 2
```

---

## Principe directeur

**Une seule source de vérité pour tous les uploads SONAFRIK.**

Avant ce module, chaque composant définissait ses propres :
- Constantes de taille (`MAX_SIZE_BYTES = 5 * 1024 * 1024`)
- Listes de MIME types (`["image/jpeg", "image/png", "image/webp"]`)
- Extensions acceptées (`/\.(jpe?g|png|webp)$/i`)
- Messages d'erreur (texte en dur)

Ce module centralise tout. En Phase 2, toutes ces définitions locales seront supprimées.

---

## Formats et limites officiels

### Audio
| Format | MIME canonique | MIME aliases | Limite |
|--------|---------------|--------------|--------|
| MP3    | `audio/mpeg`  | `audio/mp3`  | 100 Mo |
| M4A    | `audio/mp4`   | `audio/m4a`, `audio/x-m4a` | 100 Mo |
| WAV    | `audio/wav`   | `audio/wave`, `audio/x-wav` | 100 Mo |

### Image
| Format | MIME | Limite |
|--------|------|--------|
| JPEG   | `image/jpeg` | 10 Mo |
| PNG    | `image/png`  | 10 Mo |
| WebP   | `image/webp` | 10 Mo |

### Document
| Format | MIME | Limite |
|--------|------|--------|
| PDF    | `application/pdf` | 20 Mo |

---

## Utilisation

### Valider un fichier

```typescript
import { validateUploadFile, UploadCategory } from "@sonafrik/shared";

const result = validateUploadFile(
  { type: file.type, name: file.name, size: file.size },
  UploadCategory.AUDIO,
);

if (!result.valid) {
  console.error(result.message); // ex: "Format non autorisé (audio/ogg) pour l'audio."
}
```

### Obtenir la politique d'une catégorie

```typescript
import { AUDIO_POLICY, IMAGE_POLICY, DOCUMENT_POLICY } from "@sonafrik/shared";

console.log(AUDIO_POLICY.maxBytes);  // 104857600 (100 Mo)
console.log(IMAGE_POLICY.accept);    // "image/jpeg,image/png,image/webp"
console.log(DOCUMENT_POLICY.maxLabel); // "20 Mo"
```

### Résoudre le MIME effectif d'un fichier

```typescript
import { resolveUploadMime } from "@sonafrik/shared";

// Gère les cas où file.type = "" (drag-drop, Android)
const mime = resolveUploadMime({ type: "", name: "track.mp3", size: 4200000 });
// → "audio/mpeg"
```

### Vérifier le type d'un MIME

```typescript
import { isAudio, isImage, isDocument } from "@sonafrik/shared";

isAudio("audio/mpeg")      // true
isAudio("audio/mp3")       // true (alias)
isImage("image/jpeg")      // true
isDocument("text/plain")   // false
```

### Accéder aux messages officiels

```typescript
import { UPLOAD_MESSAGES, UPLOAD_ERROR_MESSAGES } from "@sonafrik/shared";

// Message statique
UPLOAD_ERROR_MESSAGES.FILE_EMPTY // "Le fichier est vide."
UPLOAD_MESSAGES.status.SUCCESS   // "Fichier envoyé avec succès."

// Message parametrique
UPLOAD_MESSAGES.sizeExceeded("105,3 Mo", "100 Mo")
// → "Fichier trop lourd (105,3 Mo). Maximum autorisé : 100 Mo."
```

---

## Règles d'architecture

### Ce qui est INTERDIT après la Phase 2

```typescript
// ❌ Constante de taille locale
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// ❌ Liste de MIME en dur
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

// ❌ Regex d'extension locale
const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);

// ❌ Texte d'erreur en dur
setState({ message: "Format non supporté." });

// ❌ Type MIME en dur dans les attributs accept
<input accept="image/jpeg,image/png,image/webp" />
```

### Ce qui est OBLIGATOIRE après la Phase 2

```typescript
// ✅ Politique depuis le registre officiel
import { IMAGE_POLICY, validateUploadFile, UploadCategory } from "@sonafrik/shared";

const result = validateUploadFile(file, UploadCategory.IMAGE);
if (!result.valid) setError(result.message);

// ✅ Accept depuis la politique
<input accept={IMAGE_POLICY.accept} />

// ✅ Message depuis la bibliothèque
import { UPLOAD_MESSAGES } from "@sonafrik/shared";
UPLOAD_MESSAGES.error.FILE_EMPTY
```

---

## Bonnes pratiques

### 1. Toujours utiliser `UploadFileDescriptor`, pas `File` directement

```typescript
// ✅ Compatible avec File natif et les mocks de test
const descriptor: UploadFileDescriptor = { type: file.type, name: file.name, size: file.size };
const result = validateUploadFile(descriptor, UploadCategory.AUDIO);
```

### 2. Normaliser le MIME avant tout traitement

```typescript
import { normalizeMime } from "@sonafrik/shared";

// "audio/mp3" (alias Windows) → "audio/mpeg" (canonique SONAFRIK)
const canonical = normalizeMime(file.type);
```

### 3. Toujours prévoir le fallback extension

Le MIME type peut être vide (`""`) sur certains navigateurs mobiles et par drag-drop.
Utiliser `resolveUploadMime()` qui gère ce cas automatiquement.

### 4. Ne pas bypasser la validation Zod côté service

La politique côté client ne remplace pas la validation Zod côté service. Les deux couches
sont complémentaires : la politique valide côté UI pour feedback immédiat, Zod valide
les types au niveau de l'API avant de contacter Supabase.

---

## Evolution future (Phase 3+)

- **Limites par AssetKind** : pochette album ≠ bannière artiste ≠ avatar
- **Résolution minimale** : images ≥ 500×500px pour pochettes
- **Durée audio** : limites min/max par type de release
- **Quotas par artiste** : limite mensuelle de stockage
- **Formats supplémentaires** : AAC natif, AIFF pour le studio pro
