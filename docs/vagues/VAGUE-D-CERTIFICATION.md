# Vague D — Certification (Typage + design tokens)

**Date :** 6 juillet 2026  
**Statut :** ✅ CERTIFIÉE (Cycles 1–3 — typage strict + design tokens juillet 2026)  
**Prochaine vague :** Vague E (Paiements — selon plan audit 360°)

---

## Périmètre Vague D (audit 360° juillet 2026)

| ID | Tâche | Statut | Notes |
|---|---|:---:|---|
| D-TYPE1 | `as never` = 0 dans `packages/api` | ✅ | Probe D++ |
| D-TYPE2 | `as any` = 0 API + web | ✅ | 33 repos propres |
| D-TYPE3 | Edge functions typées | ✅ | payment-initiate sans `as never` |
| D-TYPE4 | Repositories sans contournement | ✅ | 33/33 |
| D-STRICT1 | `searchBeats` propage erreurs DB | ✅ | Pas de `return []` sur erreur |
| D-STRICT2 | Caps Zod analytics/payout | ✅ | periodDays ≤ 90, limits payout |
| D-STRICT3 | `count_unread_notifications` RPC | ✅ | identity + notifications |
| D-TOK1 | `@theme` globals.css SSOT | ✅ | Tokens officiels |
| D-TOK2 | 0 hex web/mobile/ui | ✅ | `pnpm probe:hex-colors` 4/4 |
| D-TOK3 | Module `overlayTokens` partagé | ✅ | Admin + listener + creator |
| D-TOK4 | rgba inline features réduit | ✅ | 146 → **0** (cible cycle 3 ≤60) |
| D-TOK5 | Palette Tailwind brute | ✅ | 0 violation |
| D-LIVE | RLS beats / admin RPC / royalties | ✅ | Live Supabase |

---

## Cycle 1 — Tokens overlay SSOT

### Livraisons

**Nouveau module design**
- `apps/web/src/lib/design/overlayTokens.ts` — `OVERLAY`, status admin, `ARTIST_RING_COLORS`, lignes listener actives
- `globals.css` — tokens chip/overlay étendus (`--chip-*`, `--overlay-noir-*`, etc.)

**Migration rgba → `var(--overlay-*)`**
- Admin : `AdminFinanceCenter`, `AdminRightsCenter`, `AdminRoyaltyPanel`, `AdminPayoutBatchPanel`, `AdminFlagsCenter`
- Listener : `FavoritesList`, `AlbumTracksClient`, `PlaylistDetail`, `PlayerControls`
- Home : `HomepageContentSections` — palette artist rings via tokens

**Nouveau probe**
- `scripts/probe-vague-d-cleanup.ts` — `pnpm probe:vague-d-cleanup`

### Validation cycle 1

| Check | Résultat |
|---|---|
| `pnpm probe:vague-d-cleanup` | ✅ **13/13** |
| `pnpm probe:vague-d` | ✅ **23/23** |
| `pnpm probe:vague-d-stabilisation` | ✅ **23/23** |
| `pnpm probe:hex-colors` | ✅ **4/4** |
| `pnpm probe:certification` | ✅ **134/134** |

---

## Cycle 2 — rgba features → tokens (0 inline)

### Livraisons

**`overlayTokens.ts` enrichi**
- `HOMEPAGE_SECTION_STYLES` (sections home, `playCtaGlow`)
- `BEAT_HIGHLIGHT_STYLE`, `NOTIFICATION_TYPE_STYLES`, `LIVE_CONTROL_STYLES`, `GENRE_CHIP_COLORS`, etc.

**Migration complète `features/**/*.tsx`**
- Homepage : `HomepageContentSections`, `HomepageTrendingRow`, `HomepageDiscoverySection`, `HomepageMediaCard`
- Listener : `BeatStoreClient`, `TipPanel`, `SearchPage`, `CreatePlaylistModal`, `PlaylistDetail`, etc.
- Creator : `WorkDetail`, `CreateWorkForm`, `VerificationPanel`, `LabelManager`, `DashboardCoachCard`, `LiveControlDashboard`
- Shared : `NotificationsList`, `TipButton`, `CropEditorModal`
- Identity : `SessionList`
- `useDayMode.utils.ts` — accents via `var(--day-accent-*)`

### Validation cycle 2

| Check | Résultat |
|---|---|
| `pnpm probe:vague-d-cleanup` | ✅ **13/13** |
| `pnpm typecheck` | ✅ OK |
| `pnpm lint` | ✅ OK |
| `pnpm build` | ✅ OK |

---

## Cycle 3 — Re-audit final (3 passes)

### Passe 1 — Probes dédiés + certification globale

| Check | Résultat |
|---|---|
| `pnpm probe:vague-d-cleanup` | ✅ **13/13** (seuil D-TOK4 ≤60) |
| `pnpm probe:vague-d` | ✅ **23/23** |
| `pnpm probe:vague-d-stabilisation` | ✅ **23/23** |
| `pnpm probe:hex-colors` | ✅ **4/4** |
| `pnpm probe:certification` | ✅ **134/134** |

### Passe 2 — Re-audit probe cleanup (stabilité)

| Check | Résultat |
|---|---|
| `pnpm probe:vague-d-cleanup` | ✅ **13/13** |

### Passe 3 — Build gate indépendante

| Check | Résultat |
|---|---|
| `pnpm typecheck` | ✅ 17/17 packages |
| `pnpm lint` | ✅ 17/17 packages |
| `pnpm build` | ✅ 50 pages |

---

## Dette technique (reportée Vague H)

- **0 rgba** dans `features/**/*.tsx` ✅
- CSS domaine (`admin.css` ~100, `listen-home/*.css`, `creator/hero.css`, etc.) — rgba acceptés en CSS via tokens `@theme` ; découpage **Vague H**

---

## Zones FREEZE respectées

- ✅ Session Engine — non touché
- ✅ SRTSP / Publication Library — non touchés

---

## Prochaine action

Lancer **Vague E** (paiements prod) selon plan audit 360° — credentials opérateurs, tests wallet, chaîne E2E financière.
