# @sonafrik/ui — Documentation des composants

Design System Enterprise SONAFRIK · CDC V9.0 · Sprint 1

## Installation

```tsx
import "@sonafrik/ui/styles.css";
import { Button, Card, tokens } from "@sonafrik/ui";
```

## Design Tokens

| Catégorie | Export | Description |
|-----------|--------|-------------|
| Couleurs | `tokens.colors` | Palette officielle (#0D0D0D, #00D26A, #FFC20E…) |
| Typographie | `tokens.typography` | Montserrat 400–800 |
| Spacing | `tokens.spacing` | Base 4px (xs → 3xl) |
| Border Radius | `tokens.borderRadius` | sm → full |
| Shadows | `tokens.shadows` | sm → xl + glow vert/or |
| Motion | `tokens.motion` | Max 300ms (CDC) |

## Composants

### Button
CTA principal de la plateforme. Variantes : `primary`, `secondary`, `outline`, `ghost`, `premium`, `destructive`.  
Taille minimale tactile : **44×44px** (WCAG).

### Input / SearchInput
Champs de formulaire avec label, erreur, hint. SearchInput inclut icône et bouton effacer.

### Card
Conteneur de base. Variantes : `default`, `elevated`, `interactive`, `premium`.

### ArtistCard / AlbumCard / TrackCard
Cartes métier streaming. Support badges tier artiste, exclusivité Premium, état lecture.

### Badge
Badges tier : Standard, Vérifié, Premium, Légende, Fondateur.

### Avatar
Image ou initiales. Tailles : sm → 2xl.

### Modal
Dialog Radix accessible. Focus trap, fermeture clavier (Escape).

### Dropdown
Menu contextuel Radix. Navigation clavier native.

### Tabs
Navigation principale (Accueil · Explorer · Bibliothèque · Profil).

### Toast
Notifications via `ToastProvider` + `useToast()`.

### ProgressBar — REAL LISTEN V7.2
**NON CLIQUABLE** · `pointer-events-none` · `cursor-default` · `tabIndex={-1}`.  
≥90% = écoute valide (calcul serveur Sprint 6).

### Skeleton
États de chargement avec `role="status"`.

### PlayerControls
Lecteur avec barre REAL LISTEN intégrée. Pas de contrôle vitesse.

## Accessibilité

- Contraste WCAG AA sur fond `#0D0D0D`
- Focus visible vert `#00D26A`
- Labels ARIA sur tous les composants interactifs
- Cibles tactiles ≥ 44px

## Storybook

```bash
pnpm --filter @sonafrik/ui storybook
pnpm --filter @sonafrik/ui build-storybook
```

## Responsive

Mobile-first · breakpoints : sm 640 · md 768 · lg 1024 · xl 1280
