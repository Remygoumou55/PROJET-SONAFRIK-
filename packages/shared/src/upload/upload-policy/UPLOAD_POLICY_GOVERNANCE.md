# UPLOAD POLICY ENTERPRISE — Gouvernance Officielle

```
┌─────────────────────────────────────────────────────────────────┐
│          UPLOAD POLICY ENTERPRISE — SONAFRIK                    │
│                                                                 │
│  Version    : 1.1.0                                             │
│  Statut     : 🔒 ARCHITECTURE FROZEN                            │
│  Date       : 2026-07-03                                        │
│  Module     : packages/shared/src/upload/upload-policy/         │
│  Commit     : 56b626c (Architecture Freeze)                     │
│  Autorité   : Rémy Goumou (fondateur)                           │
│                                                                 │
│  ✅ Phase 1 Foundation        — CERTIFIÉE (commit 5007ed9)      │
│  ✅ Phase 1.1 Foundation Hard — CERTIFIÉE (commit fe6fa9f)      │
│  🔒 Architecture Freeze       — CERTIFIÉE (commit 56b626c)      │
│  🟢 Phase 2 Migration         — AUTORISÉE                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## TABLE DES MATIÈRES

1. [Déclaration officielle](#1-déclaration-officielle)
2. [Architecture Status](#2-architecture-status)
3. [Architecture Core Files](#3-architecture-core-files)
4. [Gouvernance officielle](#4-gouvernance-officielle)
5. [Interdictions absolues](#5-interdictions-absolues)
6. [Source Unique de Vérité — API officielle](#6-source-unique-de-vérité--api-officielle)
7. [Stratégie de versionnement](#7-stratégie-de-versionnement)
8. [Processus d'évolution officiel](#8-processus-dévolution-officiel)
9. [Architecture Review Checklist](#9-architecture-review-checklist)
10. [Pull Request Checklist](#10-pull-request-checklist)
11. [Release Checklist](#11-release-checklist)
12. [Freeze Validation Report](#12-freeze-validation-report)
13. [Autorisation Phase 2](#13-autorisation-phase-2)
14. [Confirmation officielle](#14-confirmation-officielle)

---

## 1. DÉCLARATION OFFICIELLE

L'**Upload Policy Enterprise Version 1.1.0** est officiellement déclarée :

| Propriété | Valeur |
|-----------|--------|
| Nom | Upload Policy Enterprise |
| Version | **1.1.0** |
| Statut | **🔒 ARCHITECTURE FROZEN** |
| Rôle | **Single Source of Truth** pour tous les uploads SONAFRIK |
| Date de gel | 2026-07-03 |
| Commit de gel | `56b626c` |
| Autorité | Rémy Goumou (fondateur SONAFRIK) |
| Module | `packages/shared/src/upload/upload-policy/` |
| Package | `@sonafrik/shared` |

**Aucune règle d'upload ne peut exister en dehors de ce module.**  
Toute violation constitue une **dette technique critique** à corriger en priorité.

---

## 2. ARCHITECTURE STATUS

### Status Board officiel

| Composant | Statut | Notes |
|-----------|--------|-------|
| `version.ts` | 🔒 FROZEN | `UPLOAD_POLICY_VERSION = "1.1.0"` |
| `enums.ts` | 🔒 FROZEN | UploadCategory, UploadContext, UploadErrorCode… |
| `types.ts` | 🔒 FROZEN | AudioMime, UploadPolicy, UploadValidationResult |
| `constants.ts` | 🔒 FROZEN | AUDIO_POLICY, IMAGE_POLICY, ERROR_CODE_CATEGORY |
| `limits.ts` | 🔒 FROZEN | UPLOAD_LIMITS, MAX_AUDIO_SIZE… |
| `accept.ts` | 🔒 FROZEN | UPLOAD_ACCEPT, AUDIO_ACCEPT, VERIFICATION_ACCEPT |
| `messages.ts` | 🔒 FROZEN | UPLOAD_MESSAGES, UPLOAD_ERROR_MESSAGES |
| `helpers.ts` | 🔒 FROZEN | validateUploadFile(), resolveUploadMime()… |
| `events.ts` | 🔒 FROZEN | UploadEvent, UploadStartedEvent… |
| `telemetry.ts` | 🔒 FROZEN | UploadTelemetryData, UploadTelemetryPayload |

### Formats officiels gelés

| Catégorie | Formats | MIME canoniques | Limite |
|-----------|---------|-----------------|--------|
| Audio | MP3, M4A, WAV | `audio/mpeg`, `audio/mp4`, `audio/wav` | **100 Mo** |
| Image | JPEG, PNG, WebP | `image/jpeg`, `image/png`, `image/webp` | **10 Mo** |
| Document | PDF | `application/pdf` | **20 Mo** |

**Ces formats et limites sont figés.** Toute modification nécessite une nouvelle version officielle.

### Règle fondamentale

> Modification directe : **INTERDITE**  
> Toute évolution → nouvelle version → processus officiel → certification

---

## 3. ARCHITECTURE CORE FILES

Les fichiers suivants constituent l'**Architecture Core** d'Upload Policy Enterprise.  
Toute modification de l'un d'eux déclenche automatiquement une **Architecture Review obligatoire**.

### Fichiers gelés (Architecture Core)

```
packages/shared/src/upload/upload-policy/
├── version.ts          ← CORE · FROZEN · modification → Architecture Review
├── enums.ts            ← CORE · FROZEN · modification → Architecture Review
├── types.ts            ← CORE · FROZEN · modification → Architecture Review
├── constants.ts        ← CORE · FROZEN · modification → Architecture Review
├── limits.ts           ← CORE · FROZEN · modification → Architecture Review
├── accept.ts           ← CORE · FROZEN · modification → Architecture Review
├── messages.ts         ← CORE · FROZEN · modification → Architecture Review
├── helpers.ts          ← CORE · FROZEN · modification → Architecture Review
├── events.ts           ← CORE · FROZEN · modification → Architecture Review
├── telemetry.ts        ← CORE · FROZEN · modification → Architecture Review
├── index.ts            ← CORE · FROZEN · modification → Architecture Review
├── README.md           ← DOC  · mise à jour à chaque release
├── MIGRATION_PLAN.md   ← DOC  · mise à jour à chaque étape Phase 2
└── UPLOAD_POLICY_GOVERNANCE.md  ← GOUVERNANCE · ce document
```

### Référentiel git de l'architecture gelée

| Phase | Commit | Contenu |
|-------|--------|---------|
| Phase 1 Foundation | `5007ed9` | Création du module complet |
| Phase 1.1 Foundation Hardening | `fe6fa9f` | Hardening : limits, accept, events, telemetry |
| Architecture Freeze | `56b626c` | Déclaration officielle de gel |

### Règle d'accès aux Core Files

```
Lecture    → Libre (import depuis @sonafrik/shared)
Écriture   → Architecture Review obligatoire + nouvelle version
Suppression → INTERDITE (breaking change → Major version seulement)
```

---

## 4. GOUVERNANCE OFFICIELLE

### Objectif d'Upload Policy Enterprise

Fournir une **source unique, vérifiée et immuable** de toutes les règles
régissant les uploads de fichiers sur SONAFRIK, couvrant :
- Formats autorisés par catégorie d'asset
- Limites de taille officielles
- Normalisation des MIME types
- Validation de fichiers avant envoi
- Messages d'erreur standardisés
- Typage TypeScript strict

### Périmètre

| Dans le périmètre | Hors périmètre |
|-------------------|----------------|
| MIME types et aliases | Logique UI / UX |
| Extensions de fichiers | Animations d'upload |
| Limites de taille | Barre de progression |
| Attributs HTML accept | Gestion d'état React |
| Messages d'erreur officiels | Intégration Supabase Storage |
| Helpers de validation | Appels API (signed URL) |
| Types TypeScript d'upload | Logique de retry réseau |
| Événements et télémétrie (types) | Implémentation des événements |

### Responsabilités

| Rôle | Responsabilité |
|------|---------------|
| Fondateur (Rémy) | Décision finale sur les formats et limites produit |
| Architecte IA | Implémentation, cohérence technique, revue de code |
| Contributeur | Utiliser l'API officielle, ne jamais dupliquer |
| Reviewer PR | Vérifier la checklist PR avant approbation |

### Règles de gouvernance

**Règle 1 — Source Unique**  
Toute règle d'upload provient exclusivement de `packages/shared/src/upload/upload-policy/`.  
Aucune source alternative n'est autorisée.

**Règle 2 — Immutabilité**  
L'architecture 1.1.0 est figée. Toute évolution passe par le processus officiel de versionnement.

**Règle 3 — Traçabilité**  
Toute évolution est documentée dans le CHANGELOG de `README.md` **avant** d'être appliquée.

**Règle 4 — Anti-duplication**  
Il est interdit de copier/dupliquer une constante ou règle qui existe dans ce module.

**Règle 5 — Architecture Review**  
Toute modification d'un fichier Core déclenche une Architecture Review obligatoire.

**Règle 6 — Certification**  
Toute nouvelle version est certifiée par le fondateur avant d'être déclarée stable.

---

## 5. INTERDICTIONS ABSOLUES

Ces patterns sont **interdits dans tout fichier du projet SONAFRIK**, sans exception.

### ❌ MIME type codé en dur

```typescript
// INTERDIT
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
if (!ACCEPTED.includes(file.type)) throw new Error("...");

// OBLIGATOIRE
import { isImage } from "@sonafrik/shared";
if (!isImage(file.type)) throw new Error("...");
```

### ❌ Extension codée en dur

```typescript
// INTERDIT
const ok = /\.(jpe?g|png|webp)$/i.test(file.name);

// OBLIGATOIRE
import { isAllowedExtension, UploadCategory } from "@sonafrik/shared";
const ok = isAllowedExtension(file.name, UploadCategory.IMAGE);
```

### ❌ Taille maximale locale

```typescript
// INTERDIT
const MAX_SIZE = 5 * 1024 * 1024;
if (file.size > MAX_SIZE) return "trop lourd";

// OBLIGATOIRE
import { UPLOAD_LIMITS } from "@sonafrik/shared";
if (file.size > UPLOAD_LIMITS.image.maxBytes) return "trop lourd";
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

### ❌ Message d'erreur texte en dur

```typescript
// INTERDIT
setError("Format non supporté. Utilisez MP3 ou M4A.");
setError(`Fichier trop lourd. Maximum 100 Mo.`);

// OBLIGATOIRE
const result = validateUploadFile(file, UploadCategory.AUDIO);
if (!result.valid) setError(result.message!);
```

### ❌ Validation locale dupliquée

```typescript
// INTERDIT
function myValidate(file: File) {
  if (file.size > 10 * 1024 * 1024) return "trop lourd";
  if (!["image/jpeg"].includes(file.type)) return "format invalide";
  return null;
}

// OBLIGATOIRE
import { validateUploadFile, UploadCategory } from "@sonafrik/shared";
const result = validateUploadFile(
  { type: file.type, name: file.name, size: file.size },
  UploadCategory.IMAGE,
);
```

### ❌ Type MIME ou format défini localement

```typescript
// INTERDIT
type MyImageMime = "image/jpeg" | "image/png";
type AudioFormat = "mp3" | "m4a";

// OBLIGATOIRE
import type { ImageMime, AudioMime } from "@sonafrik/shared";
```

### ❌ Duplication des constantes

```typescript
// INTERDIT — duplication de la politique officielle
const MAX_IMAGE_MB = 10;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// OBLIGATOIRE — import de la politique officielle
import { IMAGE_POLICY } from "@sonafrik/shared";
// IMAGE_POLICY.maxBytes, IMAGE_POLICY.mimes, IMAGE_POLICY.accept
```

---

## 6. SOURCE UNIQUE DE VÉRITÉ — API OFFICIELLE

Les éléments suivants sont les **seules références autorisées** dans SONAFRIK.

### Versioning

```typescript
import { UPLOAD_POLICY_VERSION } from "@sonafrik/shared";
// → "1.1.0"
```

### Politiques par catégorie

```typescript
import { AUDIO_POLICY, IMAGE_POLICY, DOCUMENT_POLICY, UPLOAD_POLICIES } from "@sonafrik/shared";
// AUDIO_POLICY.maxBytes → 104857600 (100 Mo)
// IMAGE_POLICY.mimes   → ["image/jpeg", "image/png", "image/webp"]
// DOCUMENT_POLICY.accept → "application/pdf"
```

### Limites de taille

```typescript
import { UPLOAD_LIMITS, MAX_AUDIO_SIZE, MAX_IMAGE_SIZE, MAX_DOCUMENT_SIZE } from "@sonafrik/shared";
// UPLOAD_LIMITS.audio.maxBytes → 104857600
// MAX_IMAGE_SIZE               → 10485760
```

### Attributs HTML accept

```typescript
import { UPLOAD_ACCEPT, AUDIO_ACCEPT, IMAGE_ACCEPT, DOCUMENT_ACCEPT, VERIFICATION_ACCEPT } from "@sonafrik/shared";
// AUDIO_ACCEPT        → ".mp3,.m4a,.wav"
// VERIFICATION_ACCEPT → "image/jpeg,image/png,image/webp,application/pdf"
```

### Enums officiels

```typescript
import {
  UploadCategory,        // AUDIO, IMAGE, DOCUMENT
  UploadContext,         // CATALOG_AUDIO, ARTIST_AVATAR, VERIFICATION_DOCUMENT…
  UploadErrorCode,       // FORMAT_NOT_ALLOWED, SIZE_EXCEEDED…
  UploadErrorCategory,   // FORMAT, SIZE, VALIDATION, STORAGE…
  UploadValidationStatus, // VALID, INVALID, NEEDS_REVIEW, NEEDS_TRANSCODING
  UploadEventType,       // STARTED, PROGRESS, COMPLETED, FAILED…
} from "@sonafrik/shared";
```

### Messages officiels

```typescript
import {
  UPLOAD_MESSAGES,
  UPLOAD_ERROR_MESSAGES,
  UPLOAD_FORMAT_HINTS,
  uploadSizeExceededMessage,
  uploadFormatNotAllowedMessage,
} from "@sonafrik/shared";
```

### Helpers de validation

```typescript
import {
  validateUploadFile,        // validation complète → UploadValidationResult
  resolveUploadMime,         // MIME effectif avec fallback extension
  normalizeMime,             // normalisation alias → canonique
  isAudio, isImage, isDocument,
  isAllowedMime, isAllowedExtension, isAllowedSize,
  resolveVerificationDocMime,
  resolveAudioUploadMime,
  resolveImageUploadMime,
  formatFileSize,
} from "@sonafrik/shared";
```

### Types TypeScript

```typescript
import type {
  AudioMime, ImageMime, DocumentMime, AllowedMime,
  UploadPolicy, UploadFileDescriptor,
  UploadValidationResult, UploadWarning,
  UploadEvent, UploadStartedEvent, UploadFailedEvent,
  UploadTelemetryData, UploadTelemetryPayload,
} from "@sonafrik/shared";
```

---

## 7. STRATÉGIE DE VERSIONNEMENT

Upload Policy Enterprise suit le **Semantic Versioning** (SemVer 2.0.0).

### Format

```
MAJOR.MINOR.PATCH
  │      │     └── Correctif rétrocompatible (bug fix, alias MIME manquant)
  │      └──────── Nouvelle fonctionnalité rétrocompatible (nouveau format, nouveau contexte)
  └─────────────── Rupture de l'interface publique (breaking change)
```

### Règles SemVer pour Upload Policy

| Type de changement | Version | Exemple | Revue requise |
|--------------------|---------|---------|---------------|
| Alias MIME manquant observé en prod | PATCH `1.1.x` | `audio/mpeg3` → canonique | Architecture Review |
| Bug dans un helper | PATCH `1.1.x` | Fix `normalizeMime()` | Architecture Review |
| Nouveau format de fichier | MINOR `1.x.0` | Ajout OGG pour previews | Architecture Review + Rémy |
| Nouveau contexte d'upload | MINOR `1.x.0` | Ajout `PODCAST_COVER` | Architecture Review |
| Nouvelle catégorie d'asset | MINOR `1.x.0` | Ajout VIDEO | Architecture Review + Rémy |
| Nouvelle limite par AssetKind | MINOR `1.x.0` | Avatar 5Mo ≠ Cover 10Mo | Architecture Review + Rémy |
| Refonte interface publique | MAJOR `x.0.0` | Politique async, nouveaux types | Architecture Review + Rémy + gel |
| Suppression d'un export | MAJOR `x.0.0` | Suppression d'un helper | Architecture Review + Rémy + gel |

### Historique des versions

| Version | Date | Type | Description |
|---------|------|------|-------------|
| `1.0.0` | 2026-07-02 | Foundation | Création du module — politiques, MIME, validation |
| `1.1.0` | 2026-07-03 | Minor | Hardening — limits, accept, events, telemetry, enrichissement |
| `1.1.1` | — | Futur Patch | Premier correctif si alias MIME manquant détecté |
| `1.2.0` | — | Futur Minor | Première extension de format ou contexte |
| `2.0.0` | — | Futur Major | Refonte si l'API doit changer (politique async, etc.) |

### Règle de stabilité pendant Phase 2

```
⚠️  PENDANT LA PHASE 2 (MIGRATION) :
    Aucun MINOR ni MAJOR ne doit être introduit.
    Seuls les PATCH (correctifs) sont autorisés.
    Raison : les composants en cours de migration ciblent la v1.1.0.
    Une évolution de l'API pendant la migration crée une instabilité.
```

---

## 8. PROCESSUS D'ÉVOLUTION OFFICIEL

Tout besoin d'évolution suit obligatoirement ce pipeline.

```
┌─────────────────────────────────────────────────────────────────┐
│  PIPELINE D'ÉVOLUTION UPLOAD POLICY ENTERPRISE                  │
└─────────────────────────────────────────────────────────────────┘

  1. BESOIN IDENTIFIÉ
     → Décrire en langage naturel (pas en code)
     → Documenter dans la section "Propositions en attente" de ce fichier

  2. ARCHITECTURE REVIEW
     → Rémy (fondateur) + Architecte IA
     → Décision : Acceptée / Refusée / Reportée à Phase 3+
     → Documenter la décision + la justification

  3. DÉTERMINATION DE VERSION
     → Appliquer la matrice SemVer (Section 7)
     → Patch / Minor / Major

  4. IMPLÉMENTATION
     → Uniquement dans packages/shared/src/upload/upload-policy/
     → Zéro modification des composants / services / edge functions

  5. VALIDATION TECHNIQUE
     → pnpm typecheck : 0 erreur
     → pnpm lint      : 0 warning, 0 erreur
     → pnpm build     : 0 erreur

  6. DOCUMENTATION
     → Mettre à jour README.md (CHANGELOG)
     → Mettre à jour version.ts (UPLOAD_POLICY_VERSION)
     → Mettre à jour UPLOAD_POLICY_GOVERNANCE.md (version certifiée, date)

  7. COMMIT & PUSH
     → git commit -m "feat(upload-policy): vX.Y.Z — description"
     → git push origin main

  8. CERTIFICATION
     → Signer officiellement la nouvelle version dans ce document
     → Mettre à jour le Freeze Validation Report (Section 12)
```

---

## 9. ARCHITECTURE REVIEW CHECKLIST

À compléter **avant toute modification** d'un fichier Core d'Upload Policy.

### Pré-requis

```
□ Le besoin est décrit en langage naturel dans ce document
□ La proposition a été soumise à Architecture Review (Rémy + Architecte)
□ La décision (Acceptée / Refusée / Reportée) est documentée avec justification
```

### Analyse d'impact

```
□ La version SemVer a été déterminée (Patch / Minor / Major)
□ La rétrocompatibilité est garantie (ou une Major est formellement justifiée)
□ L'impact sur les composants Phase 2 a été évalué
□ Aucun composant existant ne sera cassé par ce changement
```

### Implémentation

```
□ Les changements sont limités à upload-policy/ uniquement
□ Zéro modification de composant, hook, service, schéma Zod, edge function
□ Les nouveaux exports sont documentés dans README.md
□ UPLOAD_POLICY_VERSION est mis à jour dans version.ts
```

### Validation

```
□ pnpm typecheck : 0 erreur TypeScript
□ pnpm lint      : 0 warning, 0 erreur ESLint
□ pnpm build     : 0 erreur, 9/9 tâches
```

### Certification

```
□ Le CHANGELOG dans README.md est mis à jour
□ Ce document (UPLOAD_POLICY_GOVERNANCE.md) est mis à jour
□ Le commit porte le tag : feat(upload-policy): vX.Y.Z — description
□ La nouvelle version est officiellement certifiée
```

---

## 10. PULL REQUEST CHECKLIST

À compléter **avant tout Pull Request** touchant du code d'upload.

### Non-duplication (8 règles)

```
□ Aucun MIME type codé en dur dans le composant/service
□ Aucun attribut accept="" codé en dur dans le JSX/HTML
□ Aucune taille maximale définie localement (MAX_SIZE, MAX_MB, maxBytes…)
□ Aucun message d'erreur texte en dur dans l'UI
□ Aucun helper de validation local (validateFile, checkFormat, isValid…)
□ Aucun type MIME défini localement (type AudioMime = ..., type ImageType = ...)
□ Aucune regex locale sur les extensions ou MIME
□ Aucune constante dupliquant ce qui existe dans upload-policy
```

### Utilisation correcte de l'API

```
□ Toutes les validations passent par validateUploadFile()
□ Tous les accept= viennent de UPLOAD_ACCEPT / AUDIO_ACCEPT / etc.
□ Tous les messages d'erreur viennent de UPLOAD_MESSAGES ou result.message
□ Tous les types MIME viennent de ImageMime / AudioMime / AllowedMime
□ Toutes les limites viennent de UPLOAD_LIMITS ou XXX_POLICY.maxBytes
```

### Qualité

```
□ pnpm typecheck : 0 erreur TypeScript
□ pnpm lint      : 0 warning, 0 erreur ESLint
□ pnpm build     : 0 erreur (toutes les tâches)
```

---

## 11. RELEASE CHECKLIST

À compléter avant toute release d'une nouvelle version d'Upload Policy.

### Préparation

```
□ L'Architecture Review Checklist (Section 9) est entièrement validée
□ La version SemVer cible est confirmée (vX.Y.Z)
□ La description des changements est rédigée en langage naturel
□ Tous les fichiers modifiés sont listés dans le CHANGELOG de README.md
```

### Contenu de la release

```
□ version.ts      : UPLOAD_POLICY_VERSION = "X.Y.Z" ← mis à jour
□ README.md       : section CHANGELOG complétée avec la nouvelle entrée
□ UPLOAD_POLICY_GOVERNANCE.md : version certifiée + date mis à jour
□ index.ts        : tout nouveau export ajouté au barrel
```

### Validation finale

```
□ pnpm typecheck  : 0 erreur — PASSAGE OBLIGATOIRE
□ pnpm lint       : 0 erreur — PASSAGE OBLIGATOIRE
□ pnpm build      : 0 erreur — PASSAGE OBLIGATOIRE
□ Aucun composant existant cassé
□ Rétrocompatibilité vérifiée (ou breaking change documenté)
```

### Commit de release

```
□ Message : feat(upload-policy): vX.Y.Z — description courte
□ Push origin main : effectué
□ Tag git créé si Major ou Minor (git tag upload-policy-vX.Y.Z)
```

### Certification

```
□ Rémy a approuvé la nouvelle version (pour Minor et Major)
□ Le Freeze Validation Report (Section 12) est mis à jour
□ La nouvelle version est déclarée stable dans ce document
```

---

## 12. FREEZE VALIDATION REPORT

### Rapport de certification — Phase 1 Foundation

| # | Critère | Résultat |
|---|---------|----------|
| 1 | Module créé dans le bon emplacement | ✅ PASS |
| 2 | Politiques officielles définies (Audio/Image/Document) | ✅ PASS |
| 3 | MIME types et aliases centralisés | ✅ PASS |
| 4 | Extensions centralisées | ✅ PASS |
| 5 | Limites de taille centralisées | ✅ PASS |
| 6 | Messages d'erreur centralisés | ✅ PASS |
| 7 | Helpers de validation créés et fonctionnels | ✅ PASS |
| 8 | Types TypeScript stricts (zéro `any`) | ✅ PASS |
| 9 | Enums officiels définis | ✅ PASS |
| 10 | Aucun composant existant modifié | ✅ PASS |
| 11 | pnpm build 9/9 | ✅ PASS |
| 12 | pnpm lint 15/15 | ✅ PASS |
| 13 | pnpm typecheck 15/15 | ✅ PASS |

**Verdict Phase 1 : ✅ CERTIFIÉE — Commit `5007ed9`**

---

### Rapport de certification — Phase 1.1 Foundation Hardening

| # | Critère | Résultat |
|---|---------|----------|
| 1 | Versioning sémantique ajouté (version.ts) | ✅ PASS |
| 2 | UPLOAD_LIMITS centralisés (limits.ts) | ✅ PASS |
| 3 | UPLOAD_ACCEPT centralisés (accept.ts) | ✅ PASS |
| 4 | UploadErrorCategory défini | ✅ PASS |
| 5 | UploadContext défini | ✅ PASS |
| 6 | UploadEventType défini | ✅ PASS |
| 7 | UploadValidationStatus défini | ✅ PASS |
| 8 | Événements d'upload typés (events.ts) | ✅ PASS |
| 9 | Télémétrie typée (telemetry.ts) | ✅ PASS |
| 10 | UploadValidationResult enrichi — rétrocompatible | ✅ PASS |
| 11 | validateUploadFile() retourne errorCategory + policyVersion | ✅ PASS |
| 12 | ERROR_CODE_CATEGORY mapping créé | ✅ PASS |
| 13 | Aucun composant existant modifié | ✅ PASS |
| 14 | Aucun comportement utilisateur altéré | ✅ PASS |
| 15 | pnpm build 9/9 | ✅ PASS |
| 16 | pnpm lint 15/15 | ✅ PASS |
| 17 | pnpm typecheck 15/15 | ✅ PASS |

**Verdict Phase 1.1 : ✅ CERTIFIÉE — Commit `fe6fa9f`**

---

### Rapport de certification — Architecture Freeze

| # | Critère | Résultat |
|---|---------|----------|
| 1 | Aucune ligne de code métier modifiée | ✅ PASS |
| 2 | Aucun composant Frontend modifié | ✅ PASS |
| 3 | Aucun uploader modifié | ✅ PASS |
| 4 | Aucune edge function modifiée | ✅ PASS |
| 5 | Aucun comportement utilisateur altéré | ✅ PASS |
| 6 | Architecture officiellement gelée | ✅ PASS |
| 7 | Règles de gouvernance documentées | ✅ PASS |
| 8 | Interdictions documentées | ✅ PASS |
| 9 | Architecture Core Files identifiés | ✅ PASS |
| 10 | Checklists créées (Architecture Review / PR / Release) | ✅ PASS |
| 11 | Stratégie de versionnement documentée | ✅ PASS |
| 12 | Source Unique de Vérité déclarée | ✅ PASS |
| 13 | Phase 2 autorisée | ✅ PASS |

**Verdict Architecture Freeze : ✅ CERTIFIÉE — Commit `56b626c`**

---

## 13. AUTORISATION PHASE 2

### Conditions de déclenchement — toutes satisfaites

```
✅ Phase 1 Foundation                 — CERTIFIÉE (commit 5007ed9)
✅ Phase 1.1 Foundation Hardening     — CERTIFIÉE (commit fe6fa9f)
✅ Architecture Freeze                — CERTIFIÉE (commit 56b626c)
✅ UPLOAD_POLICY_GOVERNANCE.md        — CRÉÉ ET VALIDÉ
✅ Aucun composant modifié            — VÉRIFIÉ
✅ Aucun comportement utilisateur altéré — VÉRIFIÉ
✅ pnpm build + lint + typecheck      — 0 ERREUR
```

### Périmètre Phase 2 — 14 fichiers à migrer

Ordre de migration défini dans `MIGRATION_PLAN.md` :

| Priorité | Fichier | Action principale |
|----------|---------|-------------------|
| 1 | `packages/shared/src/audio/audio-integrity.ts` | Remplacer MAX_UPLOAD_BYTES + UPLOAD_AUDIO_MIME |
| 2 | `apps/web/src/lib/image/compress-image.ts` | Remplacer IMAGE_UPLOAD, AllowedImageMime, isAllowedImageMime |
| 3 | `ArtistProfilePhoto.tsx` | Remplacer IMAGE_UPLOAD → IMAGE_POLICY + helpers |
| 3 | `ArtistCoverSlider.tsx` | Idem |
| 3 | `ArtistCoverManager.tsx` | Idem |
| 4 | `AvatarUpload.tsx` | Remplacer validation locale → validateUploadFile() |
| 5 | `AudioUploader.tsx` | Remplacer MIME_CANONICAL, resolveEffectiveMime, limites |
| 5 | `CoverUploader.tsx` | Remplacer validate() inline → validateUploadFile() |
| 6 | `ArtistIdentityForm.tsx` | Remplacer ALLOWED inline → IMAGE_POLICY + isImage() |
| 6 | `VerificationPanel.tsx` | Remplacer helpers BUG-011 → resolveVerificationDocMime() |
| 7 | `packages/api/src/catalog/schemas.ts` | Dériver max depuis AUDIO_POLICY |
| 7 | `packages/api/src/creator/schemas.ts` | Dériver enum contentType depuis politiques |
| 8 | `supabase/functions/catalog-asset-signed-url/index.ts` | Aligner AUDIO_TYPES / VISUAL_TYPES |
| 8 | `supabase/functions/_shared/audio-integrity.ts` | Aligner MAX_UPLOAD_BYTES |

### Règle absolue Phase 2

Chaque fichier migré doit, avant tout commit :
1. Supprimer toute définition locale de format / taille / message
2. Importer uniquement depuis `@sonafrik/shared`
3. Passer la **Pull Request Checklist** (Section 10) à 100%
4. Valider `pnpm typecheck + lint + build` à zéro erreur

### Restrictions pendant la Phase 2

```
⚠️  Aucune évolution MINOR ou MAJOR d'Upload Policy pendant la migration.
    Seuls les PATCH sont autorisés si un alias MIME manquant est découvert.
    Une nouvelle fonctionnalité (format, limite, contexte) attend la Phase 3.
```

---

## 14. CONFIRMATION OFFICIELLE

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   L'UPLOAD POLICY ENTERPRISE VERSION 1.1.0 EST DÉSORMAIS          ║
║   L'UNIQUE ARCHITECTURE AUTORISÉE POUR TOUS LES UPLOADS           ║
║   SONAFRIK.                                                       ║
║                                                                   ║
║   Aucune validation d'upload ne peut être développée en dehors    ║
║   de packages/shared/src/upload/upload-policy/                    ║
║                                                                   ║
║   Toute violation de cette règle constitue une dette technique    ║
║   critique à corriger en priorité absolue.                        ║
║                                                                   ║
║   La PHASE 2 — MIGRATION DES COMPOSANTS EXISTANTS peut            ║
║   démarrer immédiatement.                                         ║
║                                                                   ║
║   Aucune phase intermédiaire supplémentaire n'est autorisée.      ║
║                                                                   ║
║   Signé : Rémy Goumou (fondateur SONAFRIK)                        ║
║   Date  : 2026-07-03                                              ║
║   Ref   : commit 56b626c — branch main                            ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

*Document officiel de gouvernance — Upload Policy Enterprise SONAFRIK.*  
*Version certifiée : 1.1.0 · Date de gel : 2026-07-03.*  
*Prochaine révision autorisée : certification Phase 2 complète ou release vX.Y.Z officielle.*
