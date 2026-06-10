# Sprint 1 — Design System Enterprise SONAFRIK

**Statut :** ✅ TERMINÉ  
**Date :** 10 Juin 2026  
**Package :** `@sonafrik/ui` v0.1.0

---

## Objectif

Construire le Design System Enterprise conforme au CDC V9.0 — dark theme first, accessibilité WCAG, responsive mobile/tablette/desktop.

---

## Livrables

### Design Tokens (`packages/ui/src/tokens/`)

| Système | Fichier | Contenu |
|---------|---------|---------|
| Couleurs | `colors.ts` | 15 couleurs officielles CDC + cssVarMap |
| Typographie | `typography.ts` | Montserrat 400–800, échelle xs→4xl, textStyles |
| Spacing | `spacing.ts` | Base 4px (xs → 3xl) |
| Border Radius | `borderRadius.ts` | sm → full |
| Shadows | `shadows.ts` | sm → xl + glowVert/glowOr |
| Motion | `motion.ts` | Max 300ms (CDC), breakpoints responsive |

### Composants React (16/16)

| Composant | Fichier | Notes CDC |
|-----------|---------|-----------|
| Button | `Button.tsx` | 6 variantes, min 44px tactile |
| Input | `Input.tsx` | Label, erreur, hint, ARIA |
| SearchInput | `SearchInput.tsx` | role=searchbox, bouton effacer |
| Card | `Card.tsx` | 4 variantes + sous-composants |
| ArtistCard | `ArtistCard.tsx` | Tiers artiste, badge fondateur |
| AlbumCard | `AlbumCard.tsx` | Exclusivité Premium J+7 |
| TrackCard | `TrackCard.tsx` | État lecture, index |
| Badge | `Badge.tsx` | Standard → Fondateur |
| Modal | `Modal.tsx` | Radix Dialog, focus trap |
| Dropdown | `Dropdown.tsx` | Radix Menu, clavier natif |
| Tabs | `Tabs.tsx` | 4 onglets nav principale |
| Avatar | `Avatar.tsx` | Image ou initiales |
| Toast | `Toast.tsx` | Provider + useToast() |
| ProgressBar | `ProgressBar.tsx` | **REAL LISTEN — NON CLIQUABLE** |
| Skeleton | `Skeleton.tsx` | role=status |
| PlayerControls | `PlayerControls.tsx` | Barre REAL LISTEN intégrée |

### Storybook

- **17 stories** (16 composants + Design Tokens)
- Addons : Essentials, A11y
- Build statique : `packages/ui/storybook-static/`
- Commande : `pnpm storybook` ou `pnpm --filter @sonafrik/ui storybook`

### Documentation

- `packages/ui/docs/COMPONENTS.md` — Guide développeur complet
- Autodocs Storybook sur chaque composant

---

## Validation technique

| Commande | Résultat |
|----------|----------|
| `pnpm build` | ✅ 0 erreur (7 packages) |
| `pnpm lint` | ✅ 0 erreur (10 tâches) |
| `pnpm typecheck` | ✅ 0 erreur (10 tâches) |
| `pnpm build-storybook` | ✅ Build OK |

---

## Conformité CDC V9.0

- ✅ Fond `#0D0D0D` dark natif
- ✅ Vert = action · Or = premium
- ✅ Montserrat typographie
- ✅ Animations max 300ms
- ✅ ProgressBar NON CLIQUABLE (Règle REAL LISTEN #1)
- ✅ PlayerControls sans vitesse x1.5/x2
- ✅ TypeScript strict, jamais `any`
- ✅ Architecture monorepo préservée

---

## Exports package

```tsx
// Tokens (Server Components safe)
import { colors, tokens } from "@sonafrik/ui/tokens";
import { cn } from "@sonafrik/ui/server";

// Composants (Client Components)
import { Button, Card, PlayerControls } from "@sonafrik/ui";
import "@sonafrik/ui/styles.css";
```

---

## Prochain sprint

**Sprint 2 — Authentication**  
Tables : profiles, roles, permissions, user_roles, user_sessions  
Critère : Auth complète · RLS active · AUDIT_LOG actif

---

*SONAFRIK · Notre Bien Commun · Sprint 1 validé*
