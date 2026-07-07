# GLOBAL ENTERPRISE LAYOUT — Certification SONAFRIK

**Date :** 7 juillet 2026  
**Programme :** Global Design System Evolution — Enterprise UI Layout Standardization  
**Décision :** ✅ **GLOBAL DESIGN SYSTEM CERTIFIED**

---

## 1. Résumé exécutif

SONAFRIK dispose d'un **langage de layout Enterprise unifié** : trois surfaces flottantes (Sidebar Card · Header Card · Content Card) avec marges extérieures, coins arrondis et profondeur élégante. Tokens centralisés `--shell-*` dans `globals.css`. Appliqué sur Creator, Listener, Admin, Wallet et Identity. Identité jungle/or conservée — organisation inspirée des dashboards premium, jamais copiée.

---

## 2. Audit (état initial)

| Problème | Impact |
|---|---|
| Sidebar collée au bord viewport | Pas de respiration, aspect « outil brut » |
| Header barre pleine largeur | Hiérarchie faible, pas de séparation |
| Contenu sur fond plat | Cartes noyées, manque de profondeur |
| Padding incohérent entre silos | Rupture d'identité cross-pages |
| Admin / Creator / Listen layouts différents | Utilisateur perd ses repères |
| Wallet / Identity sans shell commun | Expérience fragmentée |

---

## 3. Standard officiel de layout

```
┌─ enterprise-shell (fond + marge extérieure) ─────────────────────────┐
│ ┌─ sidebar-card ─┐  ┌─ main-column ─────────────────────────────────┐ │
│ │  Navigation    │  │ ┌─ header-card ────────────────────────────┐ │ │
│ │  Logo          │  │ │ Titre · actions · notifications           │ │ │
│ │  Menu          │  │ └──────────────────────────────────────────┘ │ │
│ └────────────────┘  │ ┌─ content-card ───────────────────────────┐ │ │
│                       │ │  Sections · cartes · données              │ │ │
│                       │ └──────────────────────────────────────────┘ │ │
│                       └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Grille officielle

| Token | Mobile | Tablet (640+) | Desktop (1024+) |
|---|---|---|---|
| `--shell-gap-outer` | 0.625rem | 0.75rem | 1rem |
| `--shell-gap-inner` | 0.625rem | 0.75rem | 0.875rem |
| `--shell-padding-content` | 1.25rem | 1.5rem | 1.5rem |
| `--shell-sidebar-width` | — (masqué) | — | 16.25rem |
| `--shell-max-width` | 80rem | 80rem | 80rem |
| `--shell-radius-xl` | 1.5rem | 1.5rem | 1.5rem |
| `--shell-header-min-height` | 3.75rem | 3.75rem | 3.75rem |

---

## 5. Design Tokens (`globals.css`)

| Catégorie | Tokens |
|---|---|
| Surfaces | `--shell-bg`, `--shell-sidebar`, `--shell-header`, `--shell-content`, `--shell-card`, `--shell-card-hover`, `--shell-card-active` |
| Bordures | `--shell-border`, `--shell-border-hover` |
| Espacements | `--shell-spacing-xs` → `--shell-spacing-xl` |
| Rayons | `--shell-radius-xs` → `--shell-radius-xl` |
| Ombres | `--shell-shadow-light`, `--shell-shadow-medium`, `--shell-shadow-strong` |

---

## 6. Silos migrés

| Silo | Sidebar Card | Header Card | Content Card |
|---|---|---|---|
| **Creator** | ✅ `CreatorSidebar` | ✅ `CreatorWorkspaceHeader` | ✅ `CreatorLayoutClient` |
| **Listener** | ✅ Desktop sidebar | — (hero in-page) | ✅ Main scroll |
| **Admin** | ✅ Drawer mobile + card desktop | ✅ `AdminHeader` | ✅ Pages admin |
| **Wallet** | — (nav in header) | ✅ Titre + tabs | ✅ Contenu wallet |
| **Identity** | ✅ Nav compacte desktop | ✅ Titre profil | ✅ Settings / profil |

**Hors scope shell triple :** Auth, onboarding, pages publiques (layout minimal intentionnel).

---

## 7. Hiérarchie de profondeur

1. Fond `--shell-bg` (#010a06)
2. Sidebar Card `--shell-sidebar` + shadow medium
3. Header Card `--shell-header` + shadow light
4. Content Card `--shell-content` + shadow light
5. Cartes internes `.enterprise-card` / KPI / glance
6. Éléments interactifs (hover → `--shell-card-hover`)

---

## 8. Responsive

- **Desktop :** Sidebar card sticky, colonne principale flex
- **< 1024px :** Sidebar masquée, nav mobile (creator pills / listener bottom nav / admin drawer)
- **Safe areas :** `env(safe-area-inset-*)` sur padding shell
- **Player listener :** offset bas préservé sur content card

---

## 9. Accessibilité

- `role="navigation"` / `aria-label` conservés sur sidebars
- Focus visible inchangé (`--color-vert-energie`)
- Contraste texte principal AAA sur surfaces shell
- Touch targets ≥ 44px (MRCDOP)

---

## 10. Validation technique

| Check | Résultat |
|---|---|
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm build` | ✅ (après clean `.next`) |
| Dev server | ✅ `pnpm dev:clean` |

---

## 11. Fichiers clés

- `apps/web/src/app/globals.css` — tokens `--shell-*`
- `apps/web/src/app/styles/enterprise-shell.css` — CSS layout global
- Layouts : `(creator)`, `StreamingLayoutClient`, `AdminLayoutClient`, `WalletLayoutClient`, `IdentityShell`
- CSS silos : `creator/layout.css`, `admin/layout-shell.css`, `listen-home/sections-sidebar.css`, `wallet.css`, `identity.css`

---

## 12. Dette résiduelle

- Pages auth/onboarding : shell minimal (roadmap phase 2 si besoin)
- Search standalone : hérite listener shell ✅
- Player fullscreen : overlay hors shell (intentionnel)
- Catalog wizard : cartes internes à migrer progressivement vers `.enterprise-card`

---

## 13. Tests manuels recommandés

- [ ] `/creator` — 3 cartes flottantes visibles desktop
- [ ] `/listen` — sidebar card + content, player OK
- [ ] `/admin` — drawer mobile + header card
- [ ] `/wallet` — header + content empilés
- [ ] `/settings/account` — identity shell 3 zones
- [ ] Mobile 375px — pas de sidebar, content pleine largeur avec marges
