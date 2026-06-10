# SONAFRIK

**NOTRE BIEN COMMUN** — Music Operating System Africain

Première infrastructure numérique de l'industrie musicale africaine.

## Stack

| Couche | Technologie |
|--------|-------------|
| Mobile | React Native + Expo + TypeScript |
| Web | Next.js 15 + TailwindCSS |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Monorepo | Turborepo + pnpm |

## Prérequis

- Node.js ≥ 20
- pnpm ≥ 9

## Démarrage

```bash
pnpm install
pnpm dev          # Lance web + mobile
pnpm build        # Build complet
pnpm lint         # ESLint
pnpm typecheck    # TypeScript
```

## Structure

```
apps/web/       → Next.js (admin + web)
apps/mobile/    → Expo (iOS + Android)
packages/ui/    → Design System & tokens
packages/types/ → Types partagés
packages/shared/→ Utilitaires
packages/database/ → Supabase client
packages/api/   → Service layer
supabase/       → Migrations & Edge Functions
docs/           → CDC V9.0
```

## Documentation

- **CDC V9.0** : [`docs/CDC-v9.0.md`](docs/CDC-v9.0.md)
- **Sprint actuel** : Sprint 5 — Catalog OS ✅

## Règles de développement

Voir `.cursor/rules/sonafrik-cdc.mdc` et le CDC V9.0.

---

*Mr Rémy Nyanga, Fondateur · SONAFRIK*
