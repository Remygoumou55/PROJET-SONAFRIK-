# PUBLICATION & CATALOG — MASTER REMEDIATION PLAN v1.0

**Programme :** SONAFRIK MVP — Publication & Catalog  
**Source audit :** `FORENSIC_AUDIT_REPORT.md` (Audit N°1 — 3 juillet 2026)  
**Agent :** Cursor  
**Périmètre :** Publication · Wizard · Upload · Catalogue · Métadonnées · Workflow  
**Interdit :** Dashboard · Hero · Nav · Coach · Wallet · Analytics · Profil · Streaming · Admin

---

## Vue d’ensemble des cycles

| Cycle | Action | Cible | Livrable |
|-------|--------|-------|----------|
| **R1** | Remédiation N°1 | CRITIQUE (4) | `REMEDIATION_REPORT_PHASE_1.md` |
| **A2** | Audit N°2 | Re-vérification complète | `SECOND_FORENSIC_AUDIT.md` |
| **R2** | Remédiation N°2 | MAJEURE (11) | `REMEDIATION_REPORT_PHASE_2.md` |
| **A3** | Audit N°3 | Contrôle bouton/action/message | `FINAL_FORENSIC_AUDIT.md` |
| **R3** | Remédiation N°3 | MINEURE + COSMÉTIQUE | (inclus dans rapport final) |
| **CERT** | Certification | lint · typecheck · build · QA manuelle | `FINAL_CERTIFICATION_REPORT.md` |

**Estimation totale programme :** 18–26 h (hors revue architecture Rémy)

---

## Classification des anomalies

### CRITIQUE — Remédiation N°1

| ID | Anomalie | Cause racine | Impact | Solution | Priorité | Est. |
|----|----------|--------------|--------|----------|----------|------|
| **PUB-C1** | Pochette ReleaseList jamais uploadée | `CoverUploader` upload via ref seulement ; ReleaseList sans ref/bouton | Sorties sans cover persistée | Ajouter mode `autoUploadOnCrop` OU bouton « Enregistrer » + ref dans ReleaseList | P0 | 1h |
| **PUB-C2** | Pas d’inventaire morceaux | TrackList supprimé ; `/tracks` = PublishHome | Certification catalogue impossible | Créer `TrackList.tsx` + route ou onglet liste ; brancher `listTracks`, statuts, actions | P0 | 4–6h |
| **PUB-C3** | submit album sans audio validé | RPC `submit_album_for_review` ne check pas `track_files` | Publication sans audio | Option A : migration SQL garde-fou album→tracks ; Option B : wizard appelle `submitTrack` + vérif client pre-submit | P0 | 2h |
| **PUB-C4** | `cover_url` vs `cover_path` | Typo repository | Covers null crédits | Remplacer par `cover_path` dans `getTracksFeaturingCreator` | P0 | 15min |

**Gate R1 :** `pnpm lint && pnpm typecheck && pnpm build` + tests ciblés catalog si ajoutés.

---

### MAJEURE — Remédiation N°2

| ID | Anomalie | Cause | Impact | Solution | Priorité | Est. |
|----|----------|-------|--------|----------|----------|------|
| **PUB-M1** | ReleaseList erreurs silencieuses | Pas try/catch | UX opaque | Wrapper async + toast/alert + états loading submit | P1 | 45min |
| **PUB-M2** | Lien « Gérer mes morceaux » faux | Route tracks = publish | Confusion | Renommer lien ou scinder routes `/tracks` (liste) vs `/tracks/new` (publish) | P1 | 30min |
| **PUB-M3** | Pas édition morceau | Feature absente | Certification modify | Page/modal `TrackEditor` : métadonnées + remplacement audio via AudioUploader | P1 | 3–4h |
| **PUB-M4** | Pas suppression | API/UI absents | Certification delete | `softDeleteTrack/Album` service + RPC + UI confirm | P1 | 2–3h |
| **PUB-M5** | Pas recherche/filtre/tri | Feature absente | Certification search | TrackList : input search client-side + filtres statut + tri date/titre | P1 | 2h |
| **PUB-M6** | Copy 65 % revenus | Texte marketing erroné | Incohérence CDC 90 % | Corriger `PublishHome` → 90 % (ou formulation « jusqu’à » validée produit) | P1 | 10min |
| **PUB-M7** | CropEditorModal dashboard | Import cross-feature | Dette architecture | Créer `shared/components/CropEditorModal` ou `catalog/components/CatalogCropModal` (copie minimale) | P1 | 2h |
| **PUB-M8** | Erreurs submit génériques | catch swallow RPC message | Debug impossible | Propager message Postgres/`CatalogError` avec code dédié | P1 | 1h |
| **PUB-M9** | 0 tests catalog | Jamais écrits | Régression | Vitest : schemas, service upload errors, submit guards | P1 | 2–3h |
| **PUB-M10** | Upload parallèle sans rollback | Promise.all step 2 | État partiel | Séquentiel audio→cover OU rollback track_files/album cover on fail | P1 | 1.5h |
| **PUB-M11** | console.debug/error apps | Debug laissé | Règle sécurité | Supprimer ou guard `process.env.NODE_ENV === 'development'` | P1 | 20min |

**Gate R2 :** build/lint/typecheck + tests publication/catalog.

---

### MINEURE — Remédiation N°3

| ID | Anomalie | Solution | Est. |
|----|----------|----------|------|
| PUB-m1 | CreditsEditor mort | Intégrer dans TrackEditor ou supprimer | 1h |
| PUB-m2 | Auto-verif fake | Remplacer par checklist statique réelle post-confirm | 30min |
| PUB-m3 | Genre optionnel | Validation Zod/UI required step 3 | 20min |
| PUB-m4 | 3000×3000 non enforced | Warning si <3000, block si <1400 (policy produit) | 45min |
| PUB-m5 | Pagination | Pagination TrackList offset/limit repo | 1h |
| PUB-m6 | Error boundary catalog | `error.tsx` route group catalog | 30min |
| PUB-m7 | console.error service | Logger structuré ou silence prod | 15min |
| PUB-m8 | Preview step 4 emoji | Afficher thumbnail cover réelle (signed read URL) | 1h |

---

### COSMÉTIQUE — Remédiation N°3

| ID | Anomalie | Solution | Est. |
|----|----------|----------|------|
| PUB-c1 | rgba/hex CSS | Tokens `var(--color-*)` uniquement | 1h |
| PUB-c2 | Tips 90 % vs 65 % | Harmoniser copy PublicationWizard + PublishHome | 10min |
| PUB-c3 | Animations verif décoratives | Alléger ou supprimer timer | 15min |
| PUB-c4 | Wizard mobile dense | Breakpoint progress scroll horizontal | 45min |

---

## Anomalies documentées — hors périmètre

| ID | Anomalie | Action |
|----|----------|--------|
| EXT-1 | Coach SONAFRIK dans PublishHome | **Ne pas modifier** — autre domaine |
| EXT-2 | CropEditorModal dans dashboard | **Ne pas modifier dashboard** — R2 via shared/catalog |
| EXT-3 | Header layout titres catalog | **Ne pas modifier navigation** |

---

## Plan d’exécution Remédiation N°1 (détail)

### Tâche R1.1 — PUB-C1 Fix ReleaseList cover upload

**Fichiers autorisés :**
- `apps/web/src/features/creator/catalog/components/CoverUploader.tsx`
- `apps/web/src/features/creator/catalog/components/ReleaseList.tsx`

**Approche recommandée :**
1. Ajouter prop optionnelle `uploadMode?: "manual" | "immediate"` (default `manual` pour wizard).
2. En mode `immediate`, appeler `doUpload()` à la fin de `handleCropSave`.
3. ReleaseList : `uploadMode="immediate"` + feedback loading/error.

**Critère done :** PUT storage visible Network ; `albums.cover_path` mis à jour ; pochette visible après refresh.

---

### Tâche R1.2 — PUB-C2 Inventaire morceaux minimal

**Fichiers à créer/modifier :**
- `apps/web/src/features/creator/catalog/components/TrackList.tsx` (new)
- `apps/web/src/app/(creator)/creator/catalog/tracks/page.tsx` — scinder ou nouvelle route
- `apps/web/src/features/creator/catalog/components/CatalogDashboard.tsx` — liens

**Contenu MVP TrackList :**
- Liste `catalog.listTracks()` avec badge statut
- Actions : Éditer (stub R2), Supprimer (stub R2), Voir album
- État vide + skeleton
- Filtre statut (draft / pending / published / rejected)

**Critère done :** Artiste voit tous ses morceaux ; lien dashboard cohérent.

---

### Tâche R1.3 — PUB-C3 Garde-fou soumission album

**Fichiers autorisés :**
- `supabase/migrations/YYYYMMDDHHMMSS_catalog_submit_album_audio_guard.sql` (si migration)
- `packages/api/src/catalog/catalog.service.ts`
- `apps/web/src/features/creator/catalog/components/PublicationWizard.tsx`

**Approche recommandée (MVP) :**
1. Migration : `submit_album_for_review` vérifie qu’au moins un track enfant a `track_files.is_primary` avec `integrity_status IN ('valid','pending')`.
2. Wizard : pre-check client `getTrackFiles` avant `submitAlbum` avec message explicite.

**Note :** Edge functions interdites sauf bug domaine — ici SQL RPC suffit.

---

### Tâche R1.4 — PUB-C4 Fix cover_path

**Fichier :** `packages/api/src/catalog/catalog.repository.ts`  
**Change :** `cover_url` → `cover_path` (2 occurrences).

---

## Validation post-R1

```powershell
cd "e:\PROJET SONAFRIK"
pnpm lint
pnpm typecheck
pnpm build
```

**Tests manuels obligatoires R1 :**
- [ ] Wizard complet : créer → upload audio + cover → meta → publier
- [ ] ReleaseList : ajouter pochette → visible après refresh
- [ ] TrackList : morceaux listés avec statuts
- [ ] Submit album sans audio → message bloquant clair
- [ ] Console sans erreurs hydration catalog

---

## Conditions certification finale

| Condition | État actuel | Cible |
|-----------|-------------|-------|
| 0 bug critique | ❌ 4 | ✅ 0 |
| 0 bug majeur | ❌ 11 | ✅ 0 |
| Workflow publication | ⚠️ | ✅ |
| Catalogue stable | ❌ | ✅ |
| Responsive | ⚠️ | ✅ |
| build/lint/typecheck | ✅ | ✅ |
| Aucune régression cross-domaine | — | ✅ |

**Statut actuel :** `CERTIFICATION REFUSED`  
**Statut cible post-programme :** `PUBLICATION & CATALOG CERTIFIED`

---

## Fichiers autorisés — whitelist modification

```
apps/web/src/app/(creator)/creator/catalog/**
apps/web/src/app/(creator)/creator/publications/**
apps/web/src/features/creator/catalog/**
apps/web/src/app/styles/creator/pub-wizard.css
apps/web/src/app/styles/creator/publish-home.css
packages/api/src/catalog/**
packages/types/src/catalog.ts          (messages/errors only if needed)
supabase/migrations/*catalog*          (si garde-fou submit)
supabase/functions/catalog-asset-signed-url/  (uniquement si bug P1 upload)
packages/api/src/catalog/*.test.ts     (new)
docs/publication-catalog/**
```

**Interdit de modifier :**
```
apps/web/src/features/creator/dashboard/**
apps/web/src/features/creator/components/Creator*
apps/web/src/features/creator/lib/creatorNavConfig.ts
apps/web/src/features/admin/**
packages/api/src/creator/creatorDashboard.*
```

---

## Ordre de priorité recommandé (exécution)

1. PUB-C4 (quick win)  
2. PUB-C1 (ReleaseList cover)  
3. PUB-C3 (submit guard)  
4. PUB-C2 (TrackList MVP)  
5. → Audit N°2  
6. PUB-M11, M6, M1, M8 (quick majors)  
7. PUB-M2, M5, M3, M4, M7, M9, M10  
8. → Audit N°3  
9. Mineures + cosmétiques  
10. Certification

---

*Document vivant — mis à jour après chaque cycle de remédiation.*
