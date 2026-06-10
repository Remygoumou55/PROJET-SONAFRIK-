# Sprint 4 — Creator OS

**Statut :** ✅ TERMINÉ · **Date :** 10 Juin 2026

## Objectif

Construire un **Creator OS professionnel** — identité artiste, vérification KYC, labels, équipes, permissions, storage sécurisé et dashboards web/mobile — conforme CDC V9 (6 tables domaine Creator).

## Livrables

### Base de données (7 tables CDC Creator OS)

| Table | Rôle |
|-------|------|
| `creators` | Entité professionnelle artiste (owner, tier, status) |
| `artist_profiles` | Identité publique (stage_name, slug, genres, social) |
| `creator_roles` | Équipe & rôles internes (owner/manager/editor/accountant/viewer) |
| `labels` | Labels indépendants |
| `label_members` | Équipe label |
| `studios` | Espaces de création |
| `creator_verifications` | Workflow identity / artist / label |

**Migrations :**
- `20250610120000_sprint4_creator_os.sql`
- `20250610120001_sprint4_creator_rls.sql`

**Storage :** bucket privé `creator-assets` (10 Mo, images + PDF)

**RPC :**
- `ensure_creator_for_current_user()` — provisionnement sécurisé
- `submit_creator_verification()` — soumission avec contrôle `can_edit_creator`
- `review_creator_verification()` — revue admin

**Helpers RLS :** `is_artist_account`, `is_creator_member`, `can_manage_creator`, `can_edit_creator`, `is_label_member`, `can_manage_label`

### Edge Function

`supabase/functions/creator-asset-signed-url/` — upload/read bannière, cover, documents vérification, logo label (Règle #10 URLs signées)

### Permissions seed

`creator:*`, `label:*`, `admin:creator:verify` — assignées aux rôles artiste / auditeur_artiste / admin

### Packages

| Package | Contenu |
|---------|---------|
| `@sonafrik/types` | Creator, ArtistProfile, Label, CreatorTeamMember, CreatorVerification, CreatorContext |
| `@sonafrik/database` | Types 7 tables + RPC Sprint 4 |
| `@sonafrik/api` v0.4 | `CreatorService`, `CreatorRepository`, schémas Zod (`@sonafrik/api/creator`) |

### Web — feature `creator/`

| Route | Fonction |
|-------|----------|
| `/creator` | Dashboard (tier, stats, statut vérif) |
| `/creator/identity` | Identité artiste + upload bannière |
| `/creator/verification` | Demandes KYC + documents |
| `/creator/labels` | CRUD labels |
| `/creator/team` | Invitation équipe par téléphone |

Middleware : `/creator` protégé · réservé comptes `artiste` / `auditeur_artiste`

### Mobile — Creator OS sous Profil

`/(tabs)/profil/creator/*` — dashboard, identité, vérification, labels, équipe

Lien « Espace créateur » visible uniquement pour les comptes artiste.

## Règles CDC respectées

- ✅ 6 tables Creator OS CDC (+ studios)
- ✅ RLS Zero Trust + helpers SECURITY DEFINER avec `auth.uid()`
- ✅ Storage privé + URLs signées edge function
- ✅ `audit_logs` INSERT ONLY via RPC existant
- ✅ Français par défaut · messages `CREATOR_ERROR_MESSAGES`
- ✅ Architecture Repository + Service Layer inchangée
- ✅ Artist tiers CDC (`emergent`, `croissance`, `etabli`)

## Configuration requise

```bash
supabase db push
supabase functions deploy creator-asset-signed-url
```

## Validation

```bash
pnpm build      # ✅
pnpm lint       # ✅
pnpm typecheck  # ✅
```

## Prochain sprint

**Sprint 5 — Streaming OS** : genres, artists, albums, tracks (hors REAL LISTEN V7.2 complet).

---

*SONAFRIK · NOTRE BIEN COMMUN*
