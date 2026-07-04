# REMEDIATION REPORT — Phase 1 (CRITIQUES)

**Programme :** Publication & Catalog v1.0  
**Date :** 3 juillet 2026  
**Agent :** Cursor  
**Scope :** 4 anomalies CRITIQUES (Audit N°1)

---

## Résumé exécutif

Les **4 bugs critiques** identifiés à l’audit forensic ont été corrigés. Le domaine dispose désormais d’un **inventaire morceaux**, d’un **upload pochette fonctionnel** sur la page Sorties, d’un **garde-fou audio** à la soumission album (SQL + service), et d’une **requête repository corrigée** (`cover_path`).

**Statut Phase 1 :** ✅ TERMINÉ

---

## Corrections appliquées

### PUB-C4 — Colonne `cover_url` → `cover_path`

| | |
|---|---|
| **Fichier** | `packages/api/src/catalog/catalog.repository.ts` |
| **Cause** | Typo colonne inexistante en DB |
| **Fix** | `.select("id, cover_path")` + mapping `cover_path` |
| **Impact** | Couvertures résolues pour `getTracksFeaturingCreator` |

---

### PUB-C1 — Upload pochette ReleaseList

| | |
|---|---|
| **Fichiers** | `CoverUploader.tsx`, `ReleaseList.tsx` |
| **Cause** | Upload uniquement via `triggerUpload()` ref — jamais appelé sur ReleaseList |
| **Fix** | Prop `uploadMode: "manual" \| "immediate"` ; ReleaseList utilise `immediate` → upload après crop ; `router.refresh()` au succès |
| **Impact** | PUT storage + `albums.cover_path` persisté depuis « Mes sorties » |

---

### PUB-C3 — Garde-fou audio submit album

| | |
|---|---|
| **Fichiers** | `supabase/migrations/20260703220000_catalog_submit_album_audio_guard.sql`, `catalog.service.ts` |
| **Cause** | `submit_album_for_review` ne vérifiait pas `track_files` |
| **Fix** | Migration SQL : chaque track de l’album doit avoir un fichier primaire `integrity_status IN ('valid','pending')` ; service `assertAlbumReadyForSubmit()` avant integration ; messages d’erreur RPC propagés |
| **Migration** | ✅ Appliquée live (`supabase db query --linked`) |

---

### PUB-C2 — Inventaire morceaux

| | |
|---|---|
| **Fichiers** | `TrackList.tsx` (new), `tracks/page.tsx`, `tracks/new/page.tsx`, `CatalogDashboard.tsx`, `PublishHome.tsx` |
| **Cause** | `/creator/catalog/tracks` = PublishHome uniquement ; pas de liste |
| **Fix** | `/creator/catalog/tracks` → `TrackList` (filtres statut, état vide, tri date) ; `/creator/catalog/tracks/new` → wizard ; CTA dashboard + fin wizard → liste |
| **Impact** | « Gérer mes morceaux » pointe vers un inventaire réel |

---

## Fichiers modifiés

```
packages/api/src/catalog/catalog.repository.ts
packages/api/src/catalog/catalog.service.ts
apps/web/src/features/creator/catalog/components/CoverUploader.tsx
apps/web/src/features/creator/catalog/components/ReleaseList.tsx
apps/web/src/features/creator/catalog/components/TrackList.tsx          (new)
apps/web/src/features/creator/catalog/components/CatalogDashboard.tsx
apps/web/src/features/creator/catalog/components/PublishHome.tsx
apps/web/src/app/(creator)/creator/catalog/tracks/page.tsx
apps/web/src/app/(creator)/creator/catalog/tracks/new/page.tsx          (new)
apps/web/src/app/(creator)/creator/catalog/tracks/new/loading.tsx       (new)
supabase/migrations/20260703220000_catalog_submit_album_audio_guard.sql (new)
```

## Fichiers non modifiés (hors périmètre respecté)

- Dashboard, Hero, Navigation, Sidebar, Coach (contenu PublishHome inchangé)
- Edge functions
- `CropEditorModal` (dashboard) — dette PUB-M7 reportée Phase 2

---

## Validation

| Check | Résultat |
|-------|----------|
| `pnpm lint` | ✅ 15/15 |
| `pnpm typecheck` | ✅ 15/15 |
| `pnpm build` | ✅ OK (après clean `.next` — échec initial `middleware-manifest.json` environnement) |
| Migration Supabase | ✅ Appliquée |

---

## Tests manuels recommandés (Rémy)

- [ ] `/creator/catalog/tracks` — liste + filtres statut
- [ ] `/creator/catalog/tracks/new` — wizard complet → retour liste
- [ ] `/creator/catalog/releases` — pochette upload → refresh → cover visible
- [ ] Soumettre album sans audio → message bloquant explicite
- [ ] Compte artiste réel (pas bypass seul)

---

## Anomalies restantes (Phase 2+)

| Sévérité | Count | Prochaine phase |
|----------|-------|-----------------|
| MAJEURE | 11 | Remédiation N°2 |
| MINEURE | 8 | Remédiation N°3 |
| COSMÉTIQUE | 4 | Remédiation N°3 |

**Certification globale :** toujours **REFUSED** jusqu’à Phase 2–3.

---

## Prochaine étape

**AUDIT N°2** — re-vérification complète sans supposer les corrections correctes → `SECOND_FORENSIC_AUDIT.md`
