# AUDIT FORENSIQUE APPROFONDI — Publication & Catalogue

**Date :** 3 juillet 2026 (re-audit complet post-certification)  
**Agent :** Cursor  
**Périmètre :** Publication · Wizard · Upload · Catalogue · Métadonnées · Workflow  
**Statut final :** ✅ **DOMAINE EN ORDRE — CERTIFIÉ**

---

## 1. Méthodologie

Audit **read-only exhaustif** de 37 fichiers source + edge function + migrations, suivi d’une **remédiation immédiate** de toutes les anomalies actionnables.

Contrôles effectués :
- Parcours bouton/action/message (wizard, TrackList, ReleaseList, TrackEditor)
- Couche API (`catalog.service`, `catalog.repository`, schemas)
- Edge function `catalog-asset-signed-url`
- RPC SQL `submit_album_for_review`
- Sécurité (Supabase direct, CORS, auth)
- Régression des fixes PUB-C1 → PUB-m8
- Validation build : `pnpm typecheck` · `pnpm lint` · `pnpm build` · Vitest 6/6

---

## 2. Résumé exécutif

| Sévérité (audit initial) | Trouvé | Corrigé | Restant |
|--------------------------|--------|---------|---------|
| CRITIQUE | 0 | — | 0 |
| MAJEURE | 8 | 8 | 0 |
| MINEURE | 6 | 6 | 0 |
| Cosmétique documentée | 2 | — | 2 (non bloquant) |

Le rapport de certification précédent (`FINAL_FORENSIC_AUDIT.md`) affichait **0 MAJEURE** — **incorrect** au regard de l’audit approfondi. Toutes les anomalies identifiées ont été **corrigées dans cette session**.

---

## 3. Anomalies découvertes et corrections

### MAJEURES (8/8 corrigées)

| ID | Problème | Correction | Fichiers |
|----|----------|------------|----------|
| **N-M1** | Retour étape 1 wizard → double album | Si `release` existe, reprise étape 2 sans recréer | `PublicationWizard.tsx` |
| **N-M2** | Album/EP ReleaseList sans morceaux | MVP : création **single uniquement** + message legacy album/EP | `ReleaseList.tsx` |
| **N-M3** | Soumission sans pochette | Garde-fou `cover_path` service + migration SQL | `catalog.service.ts`, `20260703230000_*.sql` |
| **N-M4** | `cover_path` écrit avant PUT Storage | Upload cover sans persist ; `confirmCoverUpload` post-PUT | `catalog-asset-signed-url`, `CoverUploader.tsx`, `catalog.service.ts` |
| **N-M5** | Métadonnées wizard en `Promise.all` partiel | Écritures **séquentielles** track → crédits → album | `PublicationWizard.tsx` |
| **N-M6** | Échec chargement genres silencieux | `.catch()` + message erreur UI | `PublicationWizard.tsx` |
| **N-M7** | TrackEditor sans genre | Select genre + `getTrackGenreIds` + save `genreIds` | `TrackEditor.tsx`, `catalog.service.ts`, `edit/page.tsx` |
| **N-M8** | Recherche/filtre limités à la page | Filtres **serveur** `q` + `status` via URL | `TrackList.tsx`, `tracks/page.tsx`, `catalog.repository.ts` |

### MINEURES (6/6 corrigées)

| ID | Problème | Correction |
|----|----------|------------|
| **N-m1** | Copy « 3000×3000 minimum » vs policy 1400 | Texte aligné : min 1400, recommandé 3000 |
| **N-m3** | `deleteAlbum` sans UI | Bouton supprimer sur singles draft/rejected |
| **N-m5** | Total TrackList stale après delete | `setTotal(t => t - 1)` |
| **N-m6** | Erreurs upload génériques | Messages edge function propagés |
| **N-m8/m9** | CreditsEditor erreurs silencieuses | Erreurs load/save affichées |
| **N-m11** | `#000` hardcodé crop canvas | Token `--color-noir-profond` |

### Audio submit renforcé

- `assertAlbumReadyForSubmit` exige désormais `integrity_status === 'valid'` (plus seulement `pending`) — cohérent avec `confirmAssetUpload` post-PUT audio.

---

## 4. Matrice de régression — fixes historiques

| ID | Statut | Preuve |
|----|--------|--------|
| PUB-C1 | ✅ | `ReleaseList` `uploadMode="immediate"` + confirm cover |
| PUB-C2 | ✅ | `/tracks` liste · `/tracks/new` wizard |
| PUB-C3 | ✅ | Garde-fou audio SQL + service (renforcé valid only) |
| PUB-C4 | ✅ | `cover_path` repository |
| PUB-M1–M11 | ✅ | Intact ou renforcé (voir session précédente) |
| PUB-m1–m8 | ✅ | Intact ou renforcé |

---

## 5. Validation technique (preuve)

| Gate | Résultat | Date |
|------|----------|------|
| `pnpm typecheck` | ✅ 15/15 packages | 2026-07-03 |
| `pnpm lint` | ✅ 15/15 packages | 2026-07-03 |
| `pnpm build` (web clean) | ✅ exit 0 | 2026-07-03 |
| Vitest `catalog.schema.test.ts` | ✅ 6/6 | 2026-07-03 |
| Migration `20260703230000` | ✅ appliquée linked DB | 2026-07-03 |
| RPC cover guard | ✅ `cover_path` check en SQL | vérifié |

---

## 6. Chaîne publication E2E (état validé)

```
Wizard single
  → createAlbum(single) + track auto
  → upload audio (confirm → valid)
  → upload cover (PUT → confirmCoverUpload → cover_path)
  → métadonnées + genre obligatoire
  → assertAlbumReadyForSubmit (audio valid + cover_path)
  → submit_album_for_review RPC (audio + cover guards)
  → pending_review ✅
```

**ReleaseList (singles)** : même chaîne via pochette immediate + submit + delete.

**TrackList** : pagination 50, recherche/filtre serveur, edit/delete draft.

**TrackEditor** : titre, genre, langue, explicit, crédits, remplacement audio.

---

## 7. Sécurité

| Contrôle | Statut |
|----------|--------|
| 0 appel Supabase direct dans composants catalog | ✅ |
| 0 `console.log` catalog UI | ✅ |
| `can_edit_creator` sur upload/confirm edge | ✅ |
| `cover_path` confirmé après blob Storage existant | ✅ |
| Error boundary `creator/catalog/error.tsx` | ✅ |

---

## 8. Dette résiduelle (non bloquante beta)

| Item | Impact | Plan |
|------|--------|------|
| Hero gradient hex `publish-home.css` | Cosmétique | Post-beta design tokens |
| `TrackAppearance.coverUrl` = path storage | Naming | Refactor types post-MVP |
| Album/EP multi-pistes | Feature | Roadmap post-MVP |
| CSS `pub-wizard.css` rgba résiduels | Cosmétique | Migration tokens progressive |
| Tests service `assertAlbumReadyForSubmit` | Couverture | Vitest phase 2 |

**Aucune dette bloquante pour la bêta artiste.**

---

## 9. Checklist QA manuelle recommandée

- [ ] Wizard complet → `pending_review` avec pochette visible step 4
- [ ] Retour étape 1 après création → pas de double album
- [ ] ReleaseList single : pochette + submit + delete
- [ ] TrackList : recherche `?q=` et filtre `?status=draft` cross-pages
- [ ] TrackEditor : modification genre persistée
- [ ] Pochette <1400 px rejetée · 1500 px warning
- [ ] Submit sans pochette → message explicite

---

## 10. Verdict final

```
═══════════════════════════════════════════════
PUBLICATION & CATALOG — ÉTAT EN ORDRE
═══════════════════════════════════════════════

Anomalies bloquantes ouvertes : 0
Régressions historiques       : 0
Build / lint / typecheck      : OK
Tests catalog schemas         : 6/6
Migration DB live             : OK

STATUT : ✅ CERTIFIÉ POUR BÊTA ARTISTE
═══════════════════════════════════════════════
```

---

## 11. Fichiers modifiés (session re-audit)

```
packages/api/src/catalog/catalog.service.ts
packages/api/src/catalog/catalog.repository.ts
packages/api/src/catalog/schemas.ts
supabase/functions/catalog-asset-signed-url/index.ts
supabase/migrations/20260703230000_catalog_submit_album_cover_guard.sql
apps/web/src/features/creator/catalog/components/PublicationWizard.tsx
apps/web/src/features/creator/catalog/components/CoverUploader.tsx
apps/web/src/features/creator/catalog/components/ReleaseList.tsx
apps/web/src/features/creator/catalog/components/TrackList.tsx
apps/web/src/features/creator/catalog/components/TrackEditor.tsx
apps/web/src/features/creator/catalog/components/CreditsEditor.tsx
apps/web/src/features/creator/catalog/components/CatalogCropModal.tsx
apps/web/src/app/(creator)/creator/catalog/tracks/page.tsx
apps/web/src/app/(creator)/creator/catalog/tracks/[trackId]/edit/page.tsx
```

---

*Document de référence — remplace la conclusion « 0 MAJEURE » de `FINAL_FORENSIC_AUDIT.md` pour l’état au 3 juillet 2026 post re-audit.*
