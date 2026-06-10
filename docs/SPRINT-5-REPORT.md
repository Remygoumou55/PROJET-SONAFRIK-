# Sprint 5 — Catalog OS

**Statut :** ✅ TERMINÉ · **Date :** 10 Juin 2026

## Objectif

Construire le **système de catalogue musical professionnel SONAFRIK** — genres, albums, singles, morceaux, métadonnées (ISRC, UPC), assets audio/visuels, workflow de publication, permissions et dashboards web/mobile.

## Livrables

### Base de données (Streaming OS — catalogue)

| Table | Rôle |
|-------|------|
| `genres` | Taxonomie musicale (seed afro) |
| `albums` | Albums · Singles · EP + UPC + cover |
| `album_genres` | Genres par sortie |
| `tracks` | Morceaux + ISRC + métadonnées (BPM, tonalité) |
| `track_genres` | Genres par morceau |
| `track_files` | Assets audio (mp3/aac/flac/wav) |

**Migrations :**
- `20250610130000_sprint5_catalog_os.sql`
- `20250610130001_sprint5_catalog_rls.sql`

**Workflow publication :** `draft` → `pending_review` → `published` | `rejected` | `archived`

**RPC :**
- `submit_album_for_review`
- `review_album_publication` (admin)
- `submit_track_for_review` (exige fichier audio principal)

**Storage :**
- `catalog-audio` (50 Mo, privé)
- `catalog-visuals` (10 Mo, privé)

### Edge Function

`supabase/functions/catalog-asset-signed-url/` — upload/read audio & covers (Règle CDC #10)

### Permissions

`catalog:read:own` · `catalog:create` · `catalog:update:own` · `catalog:publish:submit` · `admin:catalog:review`

### Packages

| Package | Contenu |
|---------|---------|
| `@sonafrik/types` | Genre, Album, Track, TrackFile, CatalogContext |
| `@sonafrik/database` | Types Sprint 5 + RPC |
| `@sonafrik/api` v0.5 | `@sonafrik/api/catalog` |

### Web

| Route | Fonction |
|-------|----------|
| `/creator/catalog` | Dashboard stats catalogue |
| `/creator/catalog/releases` | CRUD sorties + UPC + cover signée + soumission |
| `/creator/catalog/tracks` | CRUD morceaux + ISRC + audio signé + soumission |

### Mobile

`/(tabs)/profil/creator/catalog/*` — dashboard, sorties, morceaux

## Règles CDC

- ✅ Tables Streaming OS catalogue (genres, albums, tracks, track_files)
- ✅ URLs audio/visuels **uniquement signées côté serveur**
- ✅ RLS Zero Trust + réutilisation helpers Creator (`can_edit_creator`)
- ✅ Audit INSERT ONLY via RPC existant
- ✅ Architecture Repository + Service + Feature folders

## Configuration

```bash
supabase db push
supabase functions deploy catalog-asset-signed-url
```

## Validation

```bash
pnpm build && pnpm lint && pnpm typecheck  # ✅ 0 erreur
```

## Prochain sprint

**Sprint 6 — Streaming playback** (REAL LISTEN V7.2, stream_sessions) — hors périmètre catalogue seul.

---

*SONAFRIK · NOTRE BIEN COMMUN*
