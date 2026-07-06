# Vague B — Certification (Navigation + Rendering)

**Date :** 5 juillet 2026  
**Statut :** ✅ CERTIFIÉE (3 cycles complétés)  
**Prochaine vague :** Vague C (Architecture + dette silos)

---

## Périmètre Vague B

| ID | Tâche | Résultat |
|---|---|---|
| B-NAV1 | Suppression `router.refresh()` | ✅ 0 appel code (12 supprimés) |
| B-NAV2 | Audit 51 → 49 `loading.tsx` | ✅ 49 segments, 6 refactorés, 2 doublons supprimés |
| B-NAV3 | CSP nonce middleware | ✅ (hérité Vague A) |
| B-NAV4 | Root layout nonce | ✅ |
| B-NAV5 | RealtimeShell 5 route groups | ✅ listener, creator, admin, wallet, identity |
| B-NAV6 | Skeletons partagés | ✅ SkeletonRow / SkeletonCard |
| B-NAV7 | Notifications unifiées | ✅ NotificationsLiveList (settings + /notifications) |
| B-NAV8 | Signed URL TTL | ✅ 900s (15 min) |
| B-CI | Probes certification | ✅ **134/134** |
| B-AUTH | Triple gate creator | ✅ Layout `requireCreatorContext` + `React.cache()` ; gate redondant retiré sur catalog/team/labels |

---

## Cycle 1 — Corrections navigation

### Livraisons
- Suppression de **12** `router.refresh()` → invalidation LDSE/SRTSP + état local
- Fichiers : CreatorHeaderUtilities, PreferencesForm, ProfileEditForm, SessionList, BecomeArtistButton, TeamManager, LabelManager, CreateWorkForm

### Validation cycle 1
| Check | Résultat |
|---|---|
| router.refresh() | ✅ 0 |
| lint web | ✅ |

---

## Cycle 2 — Audit loading.tsx + probes CI

### Audit loading.tsx (51 fichiers → 49 après déduplication)

| Catégorie | Count |
|---|---|
| OK (tokens CSS, pattern valide) | 43 |
| Refactorés SkeletonRow/Card | 6 |
| Doublons supprimés | 2 |
| Hex hardcodé corrigé | 1 |

**Fichiers refactorés :**
- `(listener)/listen/beats/loading.tsx` → SkeletonCard
- `(listener)/library/loading.tsx` → SkeletonRow
- `(listener)/listen/album/[id]/loading.tsx` → SkeletonCard + SkeletonRow
- `(identity)/settings/notifications/loading.tsx` → SkeletonRow
- `(listener)/notifications/loading.tsx` → SkeletonRow
- `(wallet)/wallet/royalties/loading.tsx` → token `color-mix` (plus de rgba hex)

**Doublons supprimés (héritage parent Next.js) :**
- `creator/catalog/tracks/new/loading.tsx`
- `creator/catalog/tracks/[trackId]/edit/loading.tsx`

### Probes CI — corrections bloquantes (131 → 134)

| Probe | Problème | Correction |
|---|---|---|
| C3 | Supabase direct admin/settings | `admin.resolveProfileDisplayLabels()` via API layer |
| C8 | Notifications non unifiées | `NotificationsLiveList` shared (settings + /notifications) |
| F20 | Hex résiduels CSS/TSX | layout.css, pub-wizard.css, CropEditorModal |

### Validation cycle 2
| Check | Résultat |
|---|---|
| probe:hex-colors | ✅ 4/4 |
| probe:vague-c | ✅ 23/23 |
| probe:vague-f | ✅ 26/26 |
| probe:vague-b-navigation | ✅ 12/12 |

---

## Cycle 3 — Re-audit final

### Validation cycle 3 (3e passe indépendante)
| Check | Résultat |
|---|---|
| pnpm typecheck | ✅ 17/17 packages |
| pnpm lint | ✅ 17/17 packages |
| pnpm test:web-navigation | ✅ 13/13 |
| pnpm test:srtsp | ✅ 100/100 |
| pnpm probe:certification | ✅ **134/134** |
| pnpm probe:vague-b-navigation | ✅ **12/12** |
| pnpm --filter @sonafrik/web build | ✅ 50 pages |

---

## Architecture notifications (B-NAV7)

```
settings/notifications/page.tsx  ──┐
                                   ├── SSR createNotificationsService
/notifications/page.tsx          ──┘
                    └── NotificationsLiveList (shared)
                          ├── useNotificationsSrtspLive (shared)
                          └── NotificationsList (shared)
```

---

## Fichiers touchés (Vague B)

**Navigation :**
- 8 composants features (router.refresh supprimé)
- 3 pages creator (gate redondant retiré)

**Loading :**
- 6 loading.tsx refactorés
- 2 loading.tsx supprimés

**Shared / API :**
- `NotificationsLiveList.tsx`, `useNotificationsSrtspLive.ts` (shared)
- `admin.users.repository.ts`, `admin.service.ts`, `admin/settings/page.tsx`

**CSS / tokens :**
- `creator/layout.css`, `pub-wizard.css`, `CropEditorModal.tsx`

**Probes :**
- `probe-vague-b-navigation.ts` (nouveau)
- `probe-vague-c.ts` (C8 mis à jour)

---

## Décision

**Vague B certifiée.** CI **134/134**, navigation probe **12/12**, build production OK.

**→ Autorisation de démarrer Vague C** (plan correction 360°).
