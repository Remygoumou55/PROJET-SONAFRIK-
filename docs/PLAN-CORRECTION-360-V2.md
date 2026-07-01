# Plan de correction 360° — V2

> **Date :** 30 juin 2026  
> **Validé par :** Martin (cadrage) + IA Architect  
> **Remplace :** `docs/archive/PLAN_CORRECTION_360.md` (obsolète — score 88/100)  
> **Audit source :** [`AUDIT-V2-FORENSIQUE.md`](./AUDIT-V2-FORENSIQUE.md)  
> **Journal d'exécution :** [`EXECUTION_LOG.md`](./EXECUTION_LOG.md) — **obligatoire après chaque lot**

---

## Règles pour toute IA (lire avant d'agir)

1. **Lire dans l'ordre :** `CLAUDE.md` → ce plan → `MVP_SCOPE_LOCK.md` → dernière entrée `EXECUTION_LOG.md`
2. **Ne jamais dire "oui oui"** — challenger Rémy/Martin si hors MVP ou prématuré
3. **Une vague à la fois** — ne pas mélanger découpage + déplacement + feature dans le même PR
4. **Après chaque lot :** `pnpm build && pnpm lint && pnpm typecheck && pnpm probe:certification`
5. **Mettre à jour `EXECUTION_LOG.md`** avec format collection (fichiers, avant/après, tests)
6. **Auto-critique :** relire son propre diff ; si qualité insuffisante → corriger avant rapport
7. **Session Engine LOCKED** — `packages/api/src/streaming/session/` interdit sans ADR

---

## Vue d'ensemble des vagues

| Vague | Nom | Objectif | Durée estimée | Bloque beta ? |
|---|---|---|---|:---:|
| **A→F** | Sécurité → Domaines | ✅ Fait (134/134 probes) | — | — |
| **20 biz** | Impact business | ✅ Fait (partiel prod OM) | — | — |
| **G** | Hygiène structurelle | Orphelins, flags, docs | 1–2 j | Non |
| **H** | Découpage | Fichiers/CSS longs | 3–5 j | Non |
| **I** | Déplacement backend | `packages/api` en silos | 5–8 j | Non |
| **J** | Global CSS SSOT | 1 source changement couleur | 2–3 j | Non |
| **K** | Finance prod | Orange Money + E2E réel | Externe | **Oui** |

---

# VAGUE G — Hygiène structurelle

> **Quand :** immédiatement · **Risque :** faible · **Type :** nettoyage, pas déplacement massif

## G1 — Supprimer orphelins et shims ✅ (30 juin 2026)

## G2 — Geler Profile OS (identity bloat) ✅ CSS MVP (30 juin 2026)

## G3 — Career OS gel API ✅ README (30 juin 2026)

## G4 — Documentation silos ✅ (30 juin 2026)

---

# VAGUE H — Découpage fichiers longs

> **Quand :** après G · **Distinct du déplacement** — on coupe, on ne déplace pas encore packages/api

## H1 — CSS monolithes

| Fichier source | Cible | Max lignes/module |
|---|---|---|
| `app/styles/admin.css` (1354L) | `admin/layout.css`, `admin/tables.css`, `admin/forms.css`, … | ≤600 |
| `app/styles/admin-dashboard-human.css` (863L) | `admin/dashboard/*.css` | ≤400 |
| `app/styles/identity.css` (694L) | Garder MVP only | ≤400 |
| `app/styles/listen-home/*.css` | Vérifier max module ≤700 | ✅ partiel |

**Fichier registry :** `app/styles/admin-bundle.css` (comme listen-home-bundle)

**Tests :** build Next · visuel admin dashboard · probe hex colors

---

## H2 — Composants web 350L+

| Fichier | Action | Nouveaux fichiers |
|---|---|---|
| `AdminArtistsClient.tsx` (375L) | Extraire table + filters | `AdminArtistsTable.tsx`, `AdminArtistsFilters.tsx` |
| `AdminRevenueClient.tsx` (356L) | Extraire charts | `AdminRevenueCharts.tsx` |
| `AdminWithdrawalsClient.tsx` (345L) | Extraire batch panel | déjà partiel `AdminPayoutBatchPanel` |
| `FullPlayerPanel.tsx` (352L) | Extraire controls/lyrics | `FullPlayerControls.tsx`, `FullPlayerLyrics.tsx` |
| `buildAdminDashboardView.ts` (357L) | ✅ helpers/types extraits | Finir si >300L |

---

## H3 — packages/api god file

| Fichier | Action | Interdit |
|---|---|---|
| `listener/listener.repository.ts` (484L) | Split `listener.read.repository.ts` + `listener.write.repository.ts` | Modifier session engine |
| `admin.repository.impl.ts` | Déjà facade — OK | — |

**Tests :** Vitest repos existants + `pnpm probe:certification`

---

# VAGUE I — Déplacement silos backend (`packages/api`)

> **Quand :** après H · **C'est le vrai "déplacement Martin" côté serveur**

## Structure cible

```
packages/api/src/
├── listener/          ← auditeur (discovery, playback port, social read)
├── creator/
│   ├── catalog/       ← déplacer depuis api/catalog/
│   ├── rights/        ← déplacer depuis api/rights/
│   ├── analytics/     ← déplacer depuis api/analytics/
│   └── dashboard/
├── admin/             ← existant
├── wallet/            ← transversal MVP (auditeur + artiste)
├── streaming/         ← LOCKED — reste top-level, ports only
└── shared/            ← utils cross-domain (pas de logique métier)
```

## I1 — catalog → creator/catalog

**Fichiers à déplacer :**
```
packages/api/src/catalog/*  →  packages/api/src/creator/catalog/*
```

**Fichiers à mettre à jour (imports) :**
```
packages/api/src/index.ts
packages/api/package.json exports
apps/web/** (createCatalogService imports)
apps/mobile/** si applicable
scripts/probe-*.ts
```

**Tests :** `publication-integration.test.ts` · build monorepo

---

## I2 — rights → creator/rights

**Fichiers :** `packages/api/src/rights/*` → `creator/rights/*`

---

## I3 — analytics → creator/analytics

**Fichiers :** `packages/api/src/analytics/*` → `creator/analytics/*`

---

## I4 — Re-exports compat (1 sprint)

Créer shims deprecated :
```
packages/api/src/catalog/index.ts → re-export from creator/catalog
```
Supprimer shims en Vague I fin (+1 mois).

---

# VAGUE J — Global CSS SSOT (1 clic couleur)

> **Quand :** après H (CSS déjà découpé) · **Objectif Martin**

## J1 — Tokens-only pour couleurs

| Tâche | Fichier |
|---|---|
| Audit `rgba()` dans features | 37 fichiers → variables `--overlay-*` dans globals |
| Interdire nouvelles couleurs hors `@theme` | ESLint rule ou probe |
| Documenter changement marque | `docs/DESIGN_TOKENS.md` |

## J2 — Script theme

```powershell
# Futur : scripts/apply-theme.ps1
# Lit tokens/globals.css, propage --color-* uniquement
```

## J3 — Registry CSS minimal

**Objectif :** `globals.css` importe ≤15 bundles domaine, chaque bundle utilise **uniquement** `var(--color-*)`

---

# VAGUE K — Finance prod (bloquant lancement)

> **Externe credentials** — code prêt

| Lot | Fichiers | Doc |
|---|---|---|
| K1 Secrets | Supabase dashboard | `PAYMENTS_PROD_SECRETS.md` |
| K2 Orange Money E2E | `payment-initiate`, `payment-orange-callback` | `ORANGE_MONEY_PHASE2_VALIDATION.md` |
| K3 Tests wallet | `packages/api/src/wallet/*.test.ts` | Vitest |
| K4 E2E Playwright | `apps/web/tests/e2e/finance-chain.spec.ts` | CI |

---

# Matrice silos — qui touche quoi en cas de bug

| Bug dans… | Impact auditeur UI | Impact artiste UI | Impact admin UI |
|---|---|---|---|
| `features/listener/` | **Direct** | Non | Non |
| `features/creator/` | Non | **Direct** | Non |
| `features/admin/` | Non | Non | **Direct** |
| `features/wallet/` | Partiel | Partiel | Partiel |
| `features/identity/` | Partiel | Partiel | Non |
| `globals.css` / tokens | **Tous** | **Tous** | **Tous** |
| `packages/api/streaming/` | **Tous** | Partiel | Non |
| `packages/api/admin/` | Non | Non | **Direct** |

---

# Format collection EXECUTION_LOG (obligatoire)

Chaque lot terminé → ajouter dans `docs/EXECUTION_LOG.md` :

```markdown
## [DATE] — [Vague X — Lot Y — Nom]

### Fichiers touchés
- `chemin/fichier.ts` — description

### Code avant (extrait)
\`\`\`before
// ...
\`\`\`

### Code après (extrait)
\`\`\`after
// ...
\`\`\`

### Validation
- [ ] pnpm build / lint / typecheck
- [ ] probe:certification
- [ ] Test manuel : scénario

### Dette créée
- … ou « Aucune »
```

---

# Checklist IA — auto-critique avant livraison

```
□ Ai-je challengé la demande (MVP vs roadmap) ?
□ Mon changement reste dans UN silo ?
□ Ai-je cherché code existant avant de créer ?
□ Couleurs = globals.css uniquement ?
□ Pas d'appel Supabase direct dans composant ?
□ Fichier < 400 lignes (ou justifié) ?
□ EXECUTION_LOG mis à jour ?
□ Probes 134/134 ?
□ Si qualité insuffisante → je corrige avant de dire "terminé"
```

---

# Liens rapides

| Besoin | Fichier |
|---|---|
| Comportement IA | [`../CLAUDE.md`](../CLAUDE.md) |
| Skill Cursor | [`.cursor/skills/sonafrik-governance/SKILL.md`](../.cursor/skills/sonafrik-governance/SKILL.md) |
| Périmètre MVP | [`MVP_SCOPE_LOCK.md`](./MVP_SCOPE_LOCK.md) |
| Audit complet | [`AUDIT-V2-FORENSIQUE.md`](./AUDIT-V2-FORENSIQUE.md) |
| État mesuré | [`EXECUTION_LOG.md`](./EXECUTION_LOG.md) |
| Probes | `pnpm probe:certification` |
| Design tokens | `apps/web/src/app/globals.css` |

---

*Ce plan est vivant. Toute IA qui ajoute une vague doit mettre à jour ce fichier + EXECUTION_LOG.*
