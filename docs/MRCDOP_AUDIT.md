# MRCDOP — Audit Responsive SONAFRIK Web

**Programme :** Mobile Responsive Compatibility & Device Optimization Program v1.0  
**Date :** 28 juin 2026 (mise à jour phases 2–4)  
**Périmètre :** `apps/web` + `apps/mobile` (Expo)  
**Statut certification :** ❌ **Non certifié Enterprise 100%** — phases 1–4 livrées, validation device lab manuelle restante

---

## 1. Audit Responsive — anomalies détectées

### Critiques (P0)

| ID | Zone | Anomalie | Impact |
|----|------|----------|--------|
| R-01 | Admin | Sidebar fixe 220px sans drawer mobile | Débordement / contenu étroit 320–390px |
| R-02 | Admin | Rail icônes 72px à 900px masquait libellés sans menu | UX confuse Android entry-level |
| R-03 | Global | Pas de `viewport-fit: cover` | Safe areas iPhone non gérées |
| R-04 | Global | Pas de garde `overflow-x` systémique | Scroll horizontal parasite possible |
| R-05 | Listen | `smart-search-dropdown` `min-width: 340px` | Débordement à 320px |
| R-06 | Listen | Bottom nav hauteur fixe 64px | Home indicator iOS chevauche la nav |
| R-07 | Listen | `pb-40` arbitraire sur `<main>` | Espacement player/nav incohérent |

### Hautes (P1) — ouvertes

| ID | Zone | Anomalie |
|----|------|----------|
| R-08 | Admin tables | `AdminTable` desktop-only — scroll horizontal sur mobile (acceptable MVP, cards Phase 2) |
| R-09 | Creator | `creator/mobile.css` partiel — dashboards enterprise à auditer |
| R-10 | Wallet | Pages wallet — padding / formulaires clavier non audités |
| R-11 | Identity | Story / goals CSS — grilles desktop-first résiduelles |
| R-12 | Landing | Sections landing — quelques `max-w-[Npx]` fixes |
| R-13 | Player | `listen-future.css` largeurs player 280px — à valider 320px portrait |
| R-14 | Admin Rights/Finance | Composants inline styles Tailwind — pas encore migrés tokens MRCDOP |

### Moyennes (P2) — backlog

- Typographie rigide (`text-[9px]`, `text-[13px]`) dans composants client admin
- Tableaux `admin-th { white-space: nowrap }` — scroll contrôlé mais pas de vue cards
- Apps mobile Expo (`apps/mobile`) — hors périmètre web MRCDOP Phase 1

---

## 2. Corrections effectuées (Phase 1)

### Architecture responsive enterprise

- **`responsive-system.css`** — tokens MRCDOP : safe areas, touch 44px, typo fluide `clamp()`, padding fluide, utilities (`container-responsive`, `touch-target`, `scroll-x-controlled`)
- **`viewport-fit: cover`** dans `layout.tsx`
- **`overflow-x: clip`** sur `html` / `body`
- Import global via `globals.css` (registre domaines respecté)

### Admin back-office

- **`admin-responsive.css`** — Mobile First :
  - **< 768px** : drawer navigation + backdrop + bouton ☰ (44×44)
  - **768–1023px** : rail icônes
  - **≥ 1024px** : sidebar complète
- **`AdminLayoutClient.tsx`** — état menu, Escape, lock scroll body
- KPI / modules / catalogue : grilles 1 colonne mobile
- Tableaux : scroll horizontal contrôlé edge-to-edge mobile

### Listener

- Bottom nav : `safe-area-inset-bottom` + `--listener-bottom-nav-h`
- Main content : `--listener-player-offset` dynamique
- Smart search dropdown : `max-width: calc(100vw - 2rem)`

---

## 3. Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `apps/web/src/app/styles/responsive-system.css` | **NEW** — système MRCDOP |
| `apps/web/src/app/styles/admin-responsive.css` | **NEW** — admin mobile |
| `apps/web/src/app/globals.css` | Import responsive-system |
| `apps/web/src/app/styles/admin-bundle.css` | Import admin-responsive |
| `apps/web/src/app/layout.tsx` | `viewportFit: cover` |
| `apps/web/src/app/styles/admin.css` | Suppression media 900px, `.admin-header-left` |
| `apps/web/src/app/styles/listen-home.css` | Fix dropdown 320px |
| `apps/web/src/features/admin/components/AdminLayoutClient.tsx` | **NEW** |
| `apps/web/src/features/admin/components/AdminLayoutShell.tsx` | Délègue au client |
| `apps/web/src/features/admin/components/AdminHeader.tsx` | Menu mobile |
| `apps/web/src/features/admin/components/AdminSidebar.tsx` | Drawer + `onNavigate` |
| `apps/web/src/features/listener/components/ListenerMobileBottomNav.tsx` | Safe areas |
| `apps/web/src/features/listener/components/StreamingLayoutClient.tsx` | Padding player |
| `docs/MRCDOP_AUDIT.md` | **NEW** — ce rapport |

---

## 4. Pages certifiées (Phase 1 — partiel)

| Route group | Statut Phase 1 | Notes |
|-------------|----------------|-------|
| `/admin/*` | ✅ Foundation | Drawer mobile, grilles, tables scroll |
| `/listen`, `/library`, `/search` | ⚠️ Partiel | Nav + safe areas ; player à valider |
| `/profile`, `/settings/*` | ⏳ Phase 2 | Non audité ligne par ligne |
| `/creator/*` | ⏳ Phase 2 | `creator/mobile.css` existant |
| `/wallet/*` | ⏳ Phase 2 | — |
| `/auth/*`, `/onboarding/*` | ⏳ Phase 2 | Shells existants |
| Landing `/`, `/lancement` | ⏳ Phase 2 | — |

---

## 5. Composants certifiés (Phase 1)

- `AdminLayoutClient`, `AdminHeader`, `AdminSidebar`
- `AdminPageFrame`, `AdminCatalogCenter`, `AdminModerationActions`
- `ListenerMobileBottomNav`, `StreamingLayoutClient`
- Utilities CSS MRCDOP globales

---

## 6. Matrice de compatibilité (Phase 1)

| Largeur | Admin drawer | Listener nav | Overflow-x global | Statut |
|---------|--------------|--------------|-------------------|--------|
| 320px | ✅ | ✅ | ✅ corrigé | Foundation OK |
| 360px | ✅ | ✅ | ✅ | Foundation OK |
| 375px | ✅ | ✅ | ✅ | Foundation OK |
| 390px | ✅ | ✅ | ✅ | Foundation OK |
| 412px | ✅ | ✅ | ✅ | Foundation OK |
| 430px | ✅ | ✅ | ✅ | Foundation OK |

**Portrait** : foundation validée sur breakpoints CSS.  
**Paysage** : non testé automatiquement — Phase 3.  
**Clavier mobile** : `font-size: 16px` inputs < 430px — Phase 2 formulaires.  
**Safe Areas / Dynamic Island** : tokens + `viewport-fit` — validation device réelle Phase 3.

---

## 7. Phases 2–4 livrées (28 juin 2026)

### Phase 2 — Domaines utilisateur
- **`wallet.css`** + `WalletLayoutClient` nav fluide, grilles stats/chips responsive
- **`IdentityMobileNav`** + pills scroll horizontal, sidebar masquée < 768px
- **`AdminTable`** — vue cartes mobile auto (`admin-table-card`)
- **Player** — breakpoints 320px (`listen-future.css`, `listen-home.css` gp-body)
- **Admin** — search wrap fluide, payout inputs `min-w-0`, table cards CSS
- **`TopupModal`** — grille montants 2 col mobile

### Phase 3 — Tests automatisés
- **`tests/e2e/responsive-mrcdop.spec.ts`** — matrix 320→430px, assertion `scrollWidth ≤ clientWidth`
- Routes : `/`, `/auth/connexion`, `/listen`, `/profile`, `/wallet`, `/search`, `/admin`

### Phase 4 — `apps/mobile` Expo
- **`SafeAreaProvider`** racine (`app/_layout.tsx`)
- **Tab bar + mini player** — `useSafeAreaInsets`, touch target 44px mini player

### Performance (post-phases)
- `content-visibility: auto` sur `.admin-card`
- Utility `.perf-defer-paint` dans `responsive-system.css`

---

## 8. Prochaines étapes recommandées

- Tests manuels TECNO / Infinix / iPhone SE (paysage + clavier)
- Migrer `AdminRevenueClient` tables brutes vers `AdminTable` cards
- Identity story/goals grilles desktop-first résiduelles (R-11)
- CI : ajouter `pnpm test:e2e responsive-mrcdop` sur PR

---

## 9. Limites restantes

- Certification **100 % pages / 0 overflow** non atteinte sur tous les écrans métier (creator enterprise panels partiels, landing)
- `AdminRevenueClient` utilise encore tables HTML brutes (scroll horizontal OK, pas cards)
- Paysage + clavier non couverts par Playwright
- Validation device physique requise avant label Enterprise

---

## 10. Certification finale

> **SONAFRIK Mobile Responsive Enterprise Certified** : **NON** — critères MRCDOP v1.0 non remplis intégralement (device lab + 100% pages).
>
> **SONAFRIK MRCDOP Phases 1–4** : **LIVRÉES** — architecture responsive, domaines core, tests viewport, mobile safe areas.

---

*Journal projet : mettre à jour `docs/EXECUTION_LOG.md` lors du commit utilisateur.*
