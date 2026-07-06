# Vague C — Certification (Architecture + dette silos)

**Date :** 5 juillet 2026  
**Statut :** ✅ CERTIFIÉE (Cycle 1 — architecture + dette silos juillet 2026)  
**Prochaine vague :** Vague D (Typage + design tokens)

---

## Périmètre Vague C (audit 360° juillet 2026)

| ID | Tâche | Cycle 1 | Notes |
|---|---|:---:|---|
| C-ARCH1 | Découpage `PublicationWizard` | ✅ | 829L → 113L composant + 6 modules + hook `usePublicationWizardFlow` |
| C-ARCH2 | Découpage `catalog.service` / `catalog.repository` | ⏳ | 738L / 667L — planifié **Vague H** |
| C-ARCH3 | Découpage uploaders (Cover, Crop, Audio) | ⏳ | Cycle 2 |
| C-ARCH4 | `toggleFavoriteSchema` unique | ✅ | Réexport `social/schemas` |
| C-ARCH5 | Suppression shim `useLibrary` | ✅ | `useLibraryLdse` seul chemin |
| C-ARCH6 | Admin nav + routes post-MVP gated | ✅ | Flags `beat_store_admin` / `awards_admin` |
| C-ARCH7 | CSS monolithes (`admin.css`, `pub-wizard.css`) | ⏳ | 1598L admin — planifié **Vague H1** |
| C-ARCH8 | CSS post-MVP dormants | ✅ | Commentaires globals.css uniquement |
| C-ARCH9 | Hooks Supabase browser → API layer | ⏳ | ~29 hooks — Cycle 2 |
| C-ARCH10 | Retrait `useRealtimeChannel` legacy | ✅ | LDSE hub notifications + poll landing |
| C-ARCH11 | Recherche unifiée InstantSearchBar | ⏳ | Cycle 2 |
| C-ARCH12 | Doc tables orphelines | ✅ | `docs/VAGUE_C_ORPHAN_TABLES.md` |
| C-ARCH13 | `recommendation.service` hors chemin MVP | ⏳ | Cycle 2 |
| C-ARCH14 | Hex résiduels | ✅ | (hérité Vague B) |
| C-ARCH15 | Admin clients >400L | ⏳ | Cycle 3 |

---

## Cycle 1 — Corrections architecture

### Livraisons

**PublicationWizard (FREEZE respecté — logique inchangée, découpage uniquement)**
- `PublicationWizard.tsx` — 113 lignes (shell render)
- `usePublicationWizardFlow.ts` — état + handlers
- `WizardProgress.tsx`, `WizardStep1Panel.tsx`, `WizardStep3Panel.tsx`, `WizardStep4Panel.tsx`
- `WizardPublishedSuccess.tsx`, `publicationWizardConstants.ts`, `publicationWizardTypes.ts`

**Admin silo — navigation filtrée**
- `(admin)/layout.tsx` — charge `beat_store_admin` + `awards_admin` via `getAdminServiceForSession()`
- `AdminLayoutShell` → `AdminLayoutClient` → `AdminSidebar` — prop `navFeatureFlags`
- `buildAdminNavSections()` / `buildAdminModuleCards()` dans `admin-nav.ts`

**Legacy realtime retiré**
- `useNotificationsLdseCount.ts` — SRTSP hub + LDSE event bus (plus de Supabase channel direct)
- `LiveStats.tsx` — poll 30s uniquement (plus de `useRealtimeChannel`)

**Shim supprimé**
- `features/listener/hooks/useLibrary.ts` — supprimé (deprecated)

**Nouveau probe**
- `scripts/probe-vague-c-cleanup.ts` — `pnpm probe:vague-c-cleanup` — **18/18**

### Validation cycle 1

| Check | Résultat |
|---|---|
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm build` | ✅ |
| `pnpm probe:vague-c-cleanup` | ✅ **18/18** |
| `pnpm probe:vague-c` | ✅ **23/23** |
| `pnpm probe:vague-c-stabilisation` | ✅ **16/16** |

---

## Cycles 2–3 — Plan re-audit

1. **Cycle 2** — C9 hooks API, C11 recherche, C13 recommendation, C3 uploaders
2. **Cycle 3** — C15 admin clients, re-audit complet, certification finale
3. **Reporté Vague H** — C-ARCH2 catalog split, C-ARCH7 CSS admin (évite double travail)

---

## Zones FREEZE respectées

- ✅ Session Engine — non touché
- ✅ SRTSP v1.1 — événements wizard inchangés
- ✅ Publication Library — non touchée

---

## Dette technique

- `catalog.service.ts` (738L) et `admin.css` (1598L) — découpage **Vague H**
- ~29 hooks Supabase browser directs — migration cycle 2

---

## Prochaine action

Lancer **Cycle 2** : migration hooks Supabase → `packages/api`, unification recherche, gate recommendation MVP.
