# EDGE FUNCTION RUNTIME INVESTIGATION v1.0

**Domaine :** Publication & Catalogue  
**Date :** 2026-07-04  
**Projet Supabase :** `cxjpburiiazzvlczzupy`  
**Preuves runtime :** `docs/publication-catalog/edge-function-runtime-investigation-log.json`  
**Script de reproduction :** `scripts/edge-function-runtime-investigation.mjs`

---

## 1. Symptôme observé

À l’étape **2 — Fichiers** du wizard de publication (`/creator/catalog/tracks/new`), après validation locale de l’audio (« ✓ Audio validé — 3:19 »), le bandeau rouge affiche :

```text
Edge Function returned a non-2xx status code
```

Le bouton **Continuer →** déclenche l’envoi serveur (audio déjà validé ou upload immédiat + pochette automatique).

---

## 2. URL appelée

| Champ | Valeur |
|---|---|
| **Endpoint Supabase Functions** | `https://cxjpburiiazzvlczzupy.supabase.co/functions/v1/catalog-asset-signed-url` |
| **Méthode** | `POST` |
| **Preflight CORS** | `OPTIONS` sur la même URL → **HTTP 204** (OK) |

**Fonction edge déployée :**

| Attribut | Valeur |
|---|---|
| Nom | `catalog-asset-signed-url` |
| Slug | `catalog-asset-signed-url` |
| Statut | ACTIVE |
| Version déployée | **8** |
| Dernière mise à jour (UTC) | **2026-07-03 19:44:25** |

---

## 3. Payload envoyé (frontend → edge)

### Chaîne d’appel frontend (prouvée par code)

| Étape | Fichier | Fonction / composant |
|---|---|---|
| Page | `apps/web/src/app/(creator)/creator/catalog/tracks/new/page.tsx` | `CatalogPublishPage` → `requireCreatorContext()` |
| UI | `apps/web/src/features/creator/catalog/components/PublishHome.tsx` | `PublicationWizard` |
| Déclencheur | `apps/web/src/features/creator/catalog/components/PublicationWizard.tsx` | `handleContinueStep2` (l.262–287) |
| Pochette auto | `apps/web/src/features/creator/catalog/components/CoverUploader.tsx` | `ensureCover` → `uploadAutoCover` → `catalog.uploadCoverBlob` |
| Hook | `apps/web/src/features/creator/catalog/hooks/useCatalog.ts` | `useCatalogService()` |
| Service | `packages/api/src/catalog/catalog.service.ts` | `uploadCoverBlob` → `requestAssetUploadUrl` + `confirmCoverUpload` |
| Invoke | `packages/api/src/catalog/catalog.service.ts` l.443 et l.475 | `this.client.functions.invoke("catalog-asset-signed-url", { body })` |

### Payload A — `action: "upload"` (pochette, signed URL)

Reproduit et capturé (PROBE_B_REAL_CREATOR) :

```json
{
  "action": "upload",
  "assetType": "cover",
  "creatorId": "0a72396a-a1b4-4ddc-82e5-c9e6eb27f30b",
  "albumId": "50d958de-ef0c-49ce-b0b3-ac36b44a4b00",
  "contentType": "image/jpeg"
}
```

| Champ | Type attendu (Zod) | Valeur envoyée |
|---|---|---|
| `action` | `"upload" \| "read" \| "confirm"` | `"upload"` |
| `assetType` | `"audio" \| "cover"` | `"cover"` |
| `creatorId` | `string.uuid()` | UUID réel session artiste |
| `albumId` | `string.uuid()` (optionnel schema, requis cover) | UUID album draft |
| `contentType` | `string.min(3)` | `"image/jpeg"` |

**Taille body JSON :** ~200 octets.

### Payload B — `action: "confirm"` (pochette, post-PUT Storage)

Reproduit et capturé (PROBE_C_CONFIRM_REAL) :

```json
{
  "action": "confirm",
  "assetType": "cover",
  "creatorId": "0a72396a-a1b4-4ddc-82e5-c9e6eb27f30b",
  "albumId": "50d958de-ef0c-49ce-b0b3-ac36b44a4b00",
  "path": "0a72396a-a1b4-4ddc-82e5-c9e6eb27f30b/releases/50d958de-ef0c-49ce-b0b3-ac36b44a4b00/cover.jpg"
}
```

### Payload C — variante BYPASS (creatorId mock)

Reproduit (PROBE_A_MOCK_CREATOR) — identique à Payload A sauf :

```json
"creatorId": "00000000-0000-4000-a000-000000000002"
```

(`DEV_MOCK_CREATOR_ID` — `packages/shared/src/auth/devBypass.ts` l.38)

---

## 4. Payload attendu par l’Edge Function

Interface `CatalogAssetRequest` — `supabase/functions/catalog-asset-signed-url/index.ts` (version **git HEAD**, non déployée pour confirm cover) :

```typescript
interface CatalogAssetRequest {
  action: "upload" | "read" | "confirm";
  assetType: "audio" | "cover";
  creatorId: string;
  trackId?: string;
  albumId?: string;
  contentType?: string;
  path?: string;
  // ...
}
```

### Différences payload réel vs attendu

| Point | Envoyé | Attendu | Écart |
|---|---|---|---|
| Structure upload cover | OK | OK | Aucun |
| Structure confirm cover | OK (albumId + path + assetType cover) | OK **si** branche `handleCoverConfirm` active | **Version déployée v8 ne route pas vers `handleCoverConfirm`** |
| `creatorId` en dev BYPASS | Parfois `00000000-…0002` (prop SSR) | UUID créateur réel lié au JWT | **403 prouvé** si mock envoyé |
| `trackId` sur confirm cover | Absent (correct pour cover) | Requis par `handleConfirm` audio-only (v8 déployée) | **400 prouvé** sur confirm cover |

---

## 5. Headers envoyés

Capturés sur invoke direct (fetch) :

```http
POST /functions/v1/catalog-asset-signed-url HTTP/1.1
Host: cxjpburiiazzvlczzupy.supabase.co
Authorization: Bearer <JWT session artiste — 827 chars>
Content-Type: application/json
apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>
```

| Header | Présent | Remarque |
|---|---|---|
| `Authorization` | ✅ | JWT valide (auth `/auth/v1/token` → HTTP 200) |
| `Content-Type` | ✅ | `application/json` |
| `apikey` | ✅ | Clé anon projet |
| `Accept` | (défaut fetch) | Non bloquant |

**Environnement local confirmé :** `apps/web/.env.local` → `BYPASS_AUTH=true`, `NEXT_PUBLIC_BYPASS_AUTH=true`.

---

## 6. Réponse HTTP complète

### Cas 1 — Upload cover + creatorId mock (PROBE_A)

| Champ | Valeur |
|---|---|
| **HTTP Code** | **403** |
| **Status Text** | Forbidden |
| **Body JSON** | `{ "error": "Accès non autorisé." }` |
| **Timing** | 530 ms |
| **Région edge** | `eu-west-3` (`x-sb-edge-region`) |
| **Deno execution** | `7efb8a56-2a93-47b9-87bf-6a0fec4b7b43` |

### Cas 2 — Upload cover + creatorId réel (PROBE_B)

| Champ | Valeur |
|---|---|
| **HTTP Code** | **200** |
| **Status Text** | OK |
| **Body JSON** | `{ signedUrl, path, token, expiresIn: 3600 }` |
| **Path Storage** | `0a72396a-…/releases/50d958de-…/cover.jpg` |
| **Timing** | 909 ms |

### Cas 3 — PUT Storage signed URL (post upload 200)

| Champ | Valeur |
|---|---|
| **HTTP Code** | **200** |
| **Bucket** | `catalog-visuals` |
| **Timing** | 510 ms |

### Cas 4 — Confirm cover + creatorId réel (PROBE_C) — **échec reproduit**

| Champ | Valeur |
|---|---|
| **HTTP Code** | **400** |
| **Status Text** | Bad Request |
| **Body JSON** | `{ "error": "Paramètres confirm invalides." }` |
| **Timing** | 550 ms |
| **Deno execution** | `dc27aca2-66ae-452b-adfa-582520a8e015` |

### Cas 5 — Confirm cover + creatorId mock (PROBE_D)

| HTTP Code | **403** — `{ "error": "Accès non autorisé." }`

### Cas 6 — OPTIONS preflight

| HTTP Code | **204** — CORS OK pour `http://localhost:3000`

### CORS

Aucun échec CORS observé. Les erreurs sont des réponses POST JSON explicites (403/400), pas des blocages navigateur preflight.

---

## 7. Logs Edge Function

Les logs Supabase Dashboard ne sont pas exportés dans ce rapport. Les preuves runtime proviennent de :

1. **Invoke HTTP direct** (status + body + `x-deno-execution-id`)
2. **Comparaison code déployé vs git HEAD** (voir §9)

### Traces d’exécution prouvées (version déployée v8)

**Flux confirm cover (HTTP 400 reproduit) :**

1. `Deno.serve` — réception POST ✅
2. Auth JWT `getUser()` ✅ (sinon 401 — non observé)
3. `can_edit_creator(creatorId réel)` ✅ (sinon 403 — non observé sur PROBE_C)
4. `body.action === "confirm"` → **`return handleConfirm(...)`** (pas de branche cover)
5. `handleConfirm` l.152–153 (déployé) :

   ```typescript
   if (body.assetType !== "audio" || !body.trackId || !body.path) {
     return json({ error: "Paramètres confirm invalides." }, 400);
   }
   ```

6. `assetType === "cover"` → condition `!== "audio"` vraie → **HTTP 400** retourné ici.

**Flux upload cover + creatorId mock (HTTP 403 reproduit) :**

1. Auth JWT ✅
2. `can_edit_creator("00000000-0000-4000-a000-000000000002")` → RPC retourne `false` (log REST + DB)
3. Edge l.79 (déployé) :

   ```typescript
   if (!canEdit) return json({ error: "Accès non autorisé." }, 403);
   ```

---

## 8. Stack Trace complète

### Côté frontend (message affiché)

```text
PublicationWizard.handleContinueStep2
  → CoverUploader.ensureCover / uploadAutoCover
    → CatalogService.uploadCoverBlob (catalog.service.ts ~534)
      → CatalogService.confirmCoverUpload (catalog.service.ts ~475)
        → supabase.functions.invoke("catalog-asset-signed-url")
          → [Edge HTTP 400 ou 403]
        → extractFunctionInvokeMessage / extractFunctionInvokeMessageAsync (invoke-errors.ts)
          → fallback possible: "Edge Function returned a non-2xx status code"
      → throw CatalogError("asset_upload_failed", message)
  → setError(err.message) (PublicationWizard.tsx ~283)
```

### Côté Edge (HTTP 400 — confirm cover, v8 déployée)

```text
supabase/functions/catalog-asset-signed-url/index.ts
  Deno.serve handler
  → ligne ~82: if (body.action === "confirm") return handleConfirm(...)
  → handleConfirm
  → ligne ~152-153: assetType !== "audio" → json(..., 400)
```

### Côté Edge (HTTP 403 — creatorId mock)

```text
supabase/functions/catalog-asset-signed-url/index.ts
  → ligne ~75-79: can_edit_creator → false → json(..., 403)
```

### Masquage du message (symptôme UI générique)

| Fichier | Ligne | Comportement |
|---|---|---|
| `packages/api/src/catalog/invoke-errors.ts` | 19, 41 | Fallback `"Edge Function returned a non-2xx status code"` si corps Response non parsé (sync) |
| `@supabase/supabase-js` | — | `FunctionsHttpError.message` = texte générique |
| `PublicationWizard.tsx` | 283 | Affiche `err.message` tel quel |

---

## 9. Cause racine (Root Cause)

### Root Cause primaire (scénario « audio validé puis échec pochette auto »)

**HTTP 400 — confirm cover routé vers le handler audio sur l’Edge Function déployée (v8).**

| Preuve | Détail |
|---|---|
| PROBE_C | Confirm cover + creatorId réel → **400** `"Paramètres confirm invalides."` |
| PROBE_B + STORAGE_PUT | Upload signed URL + PUT Storage → **200** (la panne n’est pas Storage) |
| Drift déploiement | **Git HEAD** contient `handleCoverConfirm` + branche `assetType === "cover"` (l.82–86). **Version déployée v8** (téléchargée via `supabase functions download`, 2026-07-04) route **tous** les `confirm` vers `handleConfirm` audio-only (l.82–83). |

**Conséquence :** après un upload pochette réussi, `CatalogService.confirmCoverUpload()` échoue systématiquement en production edge actuelle.

### Root Cause secondaire (dev BYPASS_AUTH — creatorId mock)

**HTTP 403 — `creatorId` mock `DEV_MOCK_CREATOR_ID` envoyé à l’edge alors que le JWT appartient à un autre utilisateur.**

| Preuve | Détail |
|---|---|
| PROBE_A | Upload cover + mock creatorId → **403** |
| RPC | `can_edit_creator(mock)` → `false` ; `can_edit_creator(réel)` → `true` |
| DB | Aucune ligne `creators.id = 00000000-0000-4000-a000-000000000002` |
| SSR | `requireCreatorContext()` (`requireCreator.ts` l.92) retourne mock si `isDevBypassActive()` |
| Page | `page.tsx` l.10 passe `creator.creator.id` (mock) à `PublishHome` → `PublicationWizard` |

**Conséquence :** tout invoke upload/confirm avec ce `creatorId` reçoit **403** avant même le confirm cover.

### Scénario utilisateur observé (screenshot)

Séquence compatible avec les preuves :

1. Audio confirm → **200** (handler audio présent en v8).
2. Pochette auto → upload **200** + PUT **200** (si creatorId résolu).
3. Confirm pochette → **400** (v8) **ou** upload **403** (si creatorId mock encore propagé).

Le texte UI générique masque le code HTTP réel.

---

## 10. Localisation exacte du bug

### Bug A — Edge déployée sans confirm cover (critique fonctionnel)

| Attribut | Valeur |
|---|---|
| **Fichier (déployé v8)** | `supabase/functions/catalog-asset-signed-url/index.ts` |
| **Fonction** | handler `Deno.serve` |
| **Lignes** | **82–83** (absence branche `assetType === "cover"`) |
| **Handler erroné** | `handleConfirm` |
| **Ligne échec** | **152–153** (`assetType !== "audio"`) |
| **HTTP** | **400** |

| Attribut | Valeur |
|---|---|
| **Fichier (git HEAD — non déployé)** | même chemin, branche cover présente l.82–86, `handleCoverConfirm` l.151+ |

### Bug B — Propagation creatorId mock (dev BYPASS)

| Attribut | Valeur |
|---|---|
| **Fichier** | `apps/web/src/features/creator/lib/requireCreator.ts` |
| **Fonction** | `requireCreatorContext` |
| **Ligne** | **92** (`return DEV_MOCK_CREATOR`) |
| **Fichier** | `apps/web/src/app/(creator)/creator/catalog/tracks/new/page.tsx` |
| **Ligne** | **10** (`creatorId={creator.creator.id}`) |
| **Constante mock** | `packages/shared/src/auth/devBypass.ts` l.38 |
| **Point edge** | `catalog-asset-signed-url/index.ts` l.75–79 |
| **HTTP** | **403** |

### Bug C — Masquage message (symptôme UI)

| Fichier | Fonction | Ligne |
|---|---|---|
| `packages/api/src/catalog/invoke-errors.ts` | `extractFunctionInvokeMessage` | 19–25 |
| `apps/web/.../PublicationWizard.tsx` | `handleContinueStep2` catch | 283 |

---

## 11. Niveau de criticité

| Root Cause | Code HTTP | Criticité | Impact |
|---|---|---|---|
| **A — Confirm cover absent en v8 déployée** | **400** | **🔴 CRITIQUE** | Pochette auto (Cover Engine) impossible en prod edge actuelle après PUT Storage |
| **B — creatorId mock BYPASS vs JWT réel** | **403** | **🟠 HAUTE (dev)** | Wizard étape 2 bloqué en local si mock propagé |
| **C — Message générique Supabase SDK** | N/A | **🟡 MOYENNE** | Diagnostic UI impossible sans parse Response |

---

## 12. Proposition de correction (sans implémentation)

### Correctif A — Déploiement edge (1 intervention ciblée)

1. Déployer `catalog-asset-signed-url` depuis **git HEAD** (contient `handleCoverConfirm` + routage `assetType === "cover"`).
2. Valider PROBE_C → HTTP **200** `{ path, ok: true }`.

**Fichiers concernés :** `supabase/functions/catalog-asset-signed-url/index.ts` (déploiement uniquement).

### Correctif B — Alignement creatorId client (dev BYPASS)

1. Ne jamais envoyer `DEV_MOCK_CREATOR_ID` aux edge functions catalog.
2. Résoudre `creatorId` via session browser (`ensure_creator_for_current_user` / `album.creator_id`) avant tout upload — pattern déjà amorcé dans `PublicationWizard.handleContinueStep2`.

**Fichiers concernés :** `PublicationWizard.tsx`, `requireCreator.ts` ou `page.tsx` (propagation SSR).

### Correctif C — Message d’erreur (qualité diagnostic)

1. Conserver `extractFunctionInvokeMessageAsync` sur tous les `functions.invoke` catalog.
2. Afficher le corps JSON `{ error }` edge dans l’UI dev.

---

## Annexe — Authentification (Audit 6)

| Contrôle | Résultat prouvé |
|---|---|
| JWT artiste test | HTTP 200 auth, `userId=0c35d03f-a9ae-4b1d-a12c-c2fe901a2fba` |
| Session invalide | Non testé (401 attendu edge l.69) |
| 403 observé | **Autorisation** (`can_edit_creator=false`), pas authentification |
| 401 observé | **Non reproduit** dans cette session |

---

## Annexe — Storage (Audit 7)

| Élément | Valeur prouvée |
|---|---|
| Bucket upload cover | `catalog-visuals` |
| Chemin | `{creatorId}/releases/{albumId}/cover.jpg` |
| MIME | `image/jpeg` |
| Signed upload URL | HTTP 200 (PROBE_B) |
| PUT objet | HTTP 200 (STORAGE_PUT) |
| Permissions edge confirm | Non atteintes en v8 (échec 400 avant download) |

---

## Note investigation

Le téléchargement `supabase functions download catalog-asset-signed-url` (2026-07-04) a **écrasé localement** le fichier edge avec la version déployée v8. Le dépôt git HEAD contient la branche `handleCoverConfirm`. Restaurer le working tree depuis git si nécessaire :

```powershell
git checkout -- supabase/functions/catalog-asset-signed-url/index.ts
```

---

**Statut mission :** Root Cause identifiée avec certitude et prouvée par logs HTTP runtime (403 mock creatorId, 400 confirm cover sur edge v8 déployée).
