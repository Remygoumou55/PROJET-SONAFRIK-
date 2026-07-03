# SONAFRIK — Upload Policy Enterprise

> **Version :** 1.1.0 — Phase 1.1 Foundation Hardening  
> **Module :** `packages/shared/src/upload/upload-policy/`  
> **Statut :** Fondation durcie · Migration Phase 2 en attente

---

## Architecture

```
packages/shared/src/upload/
├── index.ts                        ← barrel namespace upload
└── upload-policy/
    ├── index.ts                    ← barrel public du module
    ├── version.ts          [1.1]   ← UPLOAD_POLICY_VERSION
    ├── enums.ts                    ← UploadCategory, AssetKind, UploadErrorCode…
    ├── types.ts                    ← AudioMime, UploadPolicy, UploadValidationResult (enrichi)
    ├── constants.ts                ← AUDIO_POLICY, IMAGE_POLICY, ERROR_CODE_CATEGORY
    ├── limits.ts           [1.1]   ← UPLOAD_LIMITS, MAX_AUDIO_SIZE, MAX_IMAGE_SIZE…
    ├── accept.ts           [1.1]   ← UPLOAD_ACCEPT, AUDIO_ACCEPT, IMAGE_ACCEPT…
    ├── messages.ts                 ← UPLOAD_MESSAGES, UPLOAD_ERROR_MESSAGES
    ├── helpers.ts                  ← isAudio(), validateUploadFile(), resolveUploadMime()…
    ├── events.ts           [1.1]   ← UploadEvent, UploadStartedEvent, UploadFailedEvent…
    ├── telemetry.ts        [1.1]   ← UploadTelemetryData, UploadTelemetryPayload
    ├── README.md                   ← cette documentation
    └── MIGRATION_PLAN.md           ← plan de migration Phase 2
```

`[1.1]` = ajouté en Phase 1.1 Foundation Hardening

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
  console.error(result.message);
  console.error(result.errorCategory); // "FORMAT", "SIZE", etc.
}

// Phase 1.1 — champs enrichis
console.log(result.status);             // "valid" | "invalid" | …
console.log(result.normalizedMime);     // MIME résolu après normalisation
console.log(result.normalizedExtension); // extension détectée
console.log(result.policyVersion);      // "1.1.0"
```

### Obtenir la politique d'une catégorie

```typescript
import { AUDIO_POLICY, IMAGE_POLICY, DOCUMENT_POLICY } from "@sonafrik/shared";

console.log(AUDIO_POLICY.maxBytes);  // 104857600 (100 Mo)
console.log(IMAGE_POLICY.accept);    // "image/jpeg,image/png,image/webp"
console.log(DOCUMENT_POLICY.maxLabel); // "20 Mo"
```

### Accéder aux limites de taille (Phase 1.1)

```typescript
import { UPLOAD_LIMITS, MAX_AUDIO_SIZE } from "@sonafrik/shared";

UPLOAD_LIMITS.audio.maxBytes  // 104857600
UPLOAD_LIMITS.image.maxMB     // 10
MAX_AUDIO_SIZE                // 104857600
```

### Attributs HTML accept (Phase 1.1)

```typescript
import { UPLOAD_ACCEPT, AUDIO_ACCEPT, VERIFICATION_ACCEPT } from "@sonafrik/shared";

// Directement dans le JSX
<input accept={AUDIO_ACCEPT} />
<input accept={VERIFICATION_ACCEPT} />  // images + PDF

// Ou via le registre
<input accept={UPLOAD_ACCEPT.audio} />
<input accept={UPLOAD_ACCEPT.verification} />
```

### Classer les erreurs par catégorie (Phase 1.1)

```typescript
import { ERROR_CODE_CATEGORY, UploadErrorCode, UploadErrorCategory } from "@sonafrik/shared";

ERROR_CODE_CATEGORY[UploadErrorCode.FORMAT_NOT_ALLOWED] // UploadErrorCategory.FORMAT
ERROR_CODE_CATEGORY[UploadErrorCode.SIZE_EXCEEDED]      // UploadErrorCategory.SIZE
ERROR_CODE_CATEGORY[UploadErrorCode.INTEGRITY_FAILED]   // UploadErrorCategory.STORAGE
```

### Typer les événements d'upload (Phase 1.1)

```typescript
import type { UploadEvent, UploadFailedEvent } from "@sonafrik/shared";
import { UploadEventType } from "@sonafrik/shared";

function handleEvent(event: UploadEvent) {
  switch (event.type) {
    case UploadEventType.FAILED:
      console.error(event.errorCode, event.errorCategory);
      break;
    case UploadEventType.COMPLETED:
      console.log(`Upload terminé en ${event.duration}ms`);
      break;
  }
}
```

### Télémétrie (Phase 1.1 — types seulement)

```typescript
import type { UploadTelemetryData } from "@sonafrik/shared";

const telemetry: UploadTelemetryData = {
  uploadDuration: 1240,
  uploadSize: file.size,
  browserMime: file.type,
  resolvedMime: result.normalizedMime,
  policyVersion: result.policyVersion,
  context: "catalog_audio",
  outcome: "success",
};
// Envoi vers un service de monitoring en Phase 3+
```

### Résoudre le MIME effectif d'un fichier

```typescript
import { resolveUploadMime } from "@sonafrik/shared";

// Gère les cas où file.type = "" (drag-drop, Android)
const mime = resolveUploadMime({ type: "", name: "track.mp3", size: 4200000 });
// → "audio/mpeg"
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

// ✅ Accept depuis les constantes centralisées
import { IMAGE_ACCEPT } from "@sonafrik/shared";
<input accept={IMAGE_ACCEPT} />

// ✅ Messages depuis la bibliothèque
import { UPLOAD_MESSAGES } from "@sonafrik/shared";
UPLOAD_MESSAGES.error.FILE_EMPTY

// ✅ Limites depuis UPLOAD_LIMITS
import { UPLOAD_LIMITS } from "@sonafrik/shared";
const maxBytes = UPLOAD_LIMITS.audio.maxBytes;
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

### 5. Utiliser `UploadValidationStatus` pour les états complexes

```typescript
import { UploadValidationStatus } from "@sonafrik/shared";

// NEEDS_REVIEW = fichier valide mais nécessite une vérification manuelle
// NEEDS_TRANSCODING = fichier valide mais nécessite un transcodage serveur
if (result.status === UploadValidationStatus.NEEDS_TRANSCODING) {
  showWarning("Ce fichier sera converti au format MP3.");
}
```

---

## Changelog

### 1.1.0 — 2026-07-03 (Phase 1.1 Foundation Hardening)

**Nouveaux fichiers :**
- `version.ts` — `UPLOAD_POLICY_VERSION`, constantes de version sémantique
- `limits.ts` — `UPLOAD_LIMITS`, `MAX_AUDIO_SIZE`, `MAX_IMAGE_SIZE`, `MAX_DOCUMENT_SIZE`
- `accept.ts` — `UPLOAD_ACCEPT`, `AUDIO_ACCEPT`, `IMAGE_ACCEPT`, `DOCUMENT_ACCEPT`, `VERIFICATION_ACCEPT`
- `events.ts` — `UploadEvent` union discriminée + interfaces par type d'événement
- `telemetry.ts` — `UploadTelemetryData`, `UploadNetworkMetrics`, `UploadTelemetryPayload`

**Enums ajoutés dans `enums.ts` :**
- `UploadErrorCategory` — catégories de haut niveau (FORMAT, SIZE, VALIDATION, NETWORK, STORAGE, SECURITY, UNKNOWN)
- `UploadContext` — contexte métier d'upload (CATALOG_AUDIO, ARTIST_AVATAR, VERIFICATION_DOCUMENT…)
- `UploadEventType` — types d'événements (STARTED, PROGRESS, COMPLETED, FAILED, CANCELLED, RETRY)
- `UploadValidationStatus` — statut enrichi (VALID, INVALID, NEEDS_REVIEW, NEEDS_TRANSCODING)

**Types ajoutés dans `types.ts` :**
- `UploadWarning` — avertissement non bloquant `{ code, message }`
- `UploadValidationResult` — champs enrichis optionnels : `status`, `normalizedMime`, `normalizedExtension`, `policyVersion`, `errorCategory`, `warnings`, `metadata`

**Constantes ajoutées dans `constants.ts` :**
- `ERROR_CODE_CATEGORY` — mapping `UploadErrorCode → UploadErrorCategory`

**Helpers mis à jour dans `helpers.ts` :**
- `validateUploadFile()` — retourne désormais `status`, `errorCategory`, `policyVersion`, `normalizedMime`, `normalizedExtension`

**Rétrocompatibilité :** tous les champs Phase 1 (`valid`, `errorCode`, `message`) restent inchangés.

### 1.0.0 — 2026-07-02 (Phase 1 Foundation)

- Création du module complet : enums, types, constants, messages, helpers
- Politiques officielles : AUDIO (100 Mo), IMAGE (10 Mo), DOCUMENT (20 Mo)
- Normalisation MIME, mapping extension → MIME, validation complète

---

## Roadmap

### Phase 2 — Migration (prochaine)
- Connecter les 14 composants/services existants à ce module
- Supprimer toutes les définitions locales de formats/tailles/messages
- Voir `MIGRATION_PLAN.md` pour le plan détaillé

### Phase 3+ — Extensions futures
- **Limites par AssetKind** : pochette album ≠ bannière artiste ≠ avatar
- **Résolution minimale** : images ≥ 500×500px pour pochettes
- **Durée audio** : limites min/max par type de release
- **Quotas par artiste** : limite mensuelle de stockage
- **Formats supplémentaires** : AAC natif, AIFF pour le studio pro
- **Intégration télémétrie** : connexion Posthog/Sentry avec `UploadTelemetryData`
- **Event emitter** : connexion `UploadEvent` aux composants React
