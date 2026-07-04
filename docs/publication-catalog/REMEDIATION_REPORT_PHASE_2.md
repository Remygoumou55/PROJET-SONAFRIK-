# REMEDIATION REPORT — Phase 2 (MAJEURES)

**Date :** 3 juillet 2026  
**Agent :** Cursor  
**Scope :** 11 anomalies MAJEURES (PUB-M1 → PUB-M11)

---

## Résumé exécutif

**10/10 majeures actives corrigées** (PUB-M2 déjà résolu en R1). Le domaine Publication & Catalog dispose maintenant de :

- Gestion d’erreurs ReleaseList
- Recherche + tri TrackList
- Édition morceau (`/tracks/[id]/edit`)
- Suppression soft-delete track/album (draft/rejected)
- Crop modal catalog autonome (sans import dashboard)
- Upload wizard séquentiel
- Tests Vitest catalog schemas
- Messages submitTrack propagés
- Console uploaders nettoyée
- Copy revenus 90 % CDC

**Statut Phase 2 :** ✅ TERMINÉ

---

## Corrections par ID

| ID | Solution | Fichiers |
|----|----------|----------|
| **PUB-M1** | try/catch + `error` state + loading submit | `ReleaseList.tsx` |
| **PUB-M2** | Déjà OK R1 (liens dashboard) | — |
| **PUB-M3** | `TrackEditor.tsx` + route edit | `tracks/[trackId]/edit/page.tsx` |
| **PUB-M4** | `deleteTrack` / `deleteAlbum` service + repo soft-delete | `catalog.service.ts`, `catalog.repository.ts`, `TrackList.tsx` |
| **PUB-M5** | Input recherche + tri date/titre | `TrackList.tsx` |
| **PUB-M6** | 65 % → 90 % | `PublishHome.tsx` |
| **PUB-M7** | `CatalogCropModal.tsx` (react-easy-crop, classes crop-modal) | `CoverUploader.tsx` |
| **PUB-M8** | submitTrack propage message RPC | `catalog.service.ts` |
| **PUB-M9** | `catalog.schema.test.ts` (6 tests) | `packages/api/src/catalog/` |
| **PUB-M10** | Upload audio puis cover séquentiel | `PublicationWizard.tsx` |
| **PUB-M11** | Suppression console AudioUploader | `AudioUploader.tsx` |

---

## Types ajoutés

`packages/types/src/catalog.ts` :
- `track_not_editable`
- `track_delete_failed`
- `album_delete_failed`

---

## Fichiers créés

```
apps/web/src/features/creator/catalog/components/CatalogCropModal.tsx
apps/web/src/features/creator/catalog/components/TrackEditor.tsx
apps/web/src/app/(creator)/creator/catalog/tracks/[trackId]/edit/page.tsx
apps/web/src/app/(creator)/creator/catalog/tracks/[trackId]/edit/loading.tsx
packages/api/src/catalog/catalog.schema.test.ts
```

---

## Validation

| Check | Résultat |
|-------|----------|
| Vitest catalog | ✅ 6/6 |
| `pnpm lint` | ✅ 15/15 |
| `pnpm typecheck` | ✅ 15/15 |
| `pnpm build` (web) | ✅ OK |

---

## Tests manuels recommandés

- [ ] TrackList : recherche par titre, tri A→Z
- [ ] Modifier morceau brouillon : titre + remplacement audio
- [ ] Supprimer morceau brouillon (confirm dialog)
- [ ] ReleaseList : erreur visible si create/submit échoue
- [ ] Pochette ReleaseList avec CatalogCropModal (sans régression wizard)
- [ ] Wizard step 2 : audio puis cover si audio échoue first

---

## Restant pour certification (Phase 3)

| Sévérité | Count |
|----------|-------|
| MINEURE | 8 |
| COSMÉTIQUE | 4 |

**Certification globale :** toujours **REFUSED** jusqu’à Audit N°3 + Remédiation N°3.

---

## Prochaine étape

**AUDIT N°3** → `FINAL_FORENSIC_AUDIT.md` → Remédiation mineures/cosmétiques → Certification finale
