# Gel packages post-MVP

> **Problème audit #9** — `metadata` et `persistence` : suringénierie avant beta.

---

## Packages gelés (build OK, pas d'extension MVP)

| Package | Chemin | Action |
|---|---|---|
| `@sonafrik/metadata` | `packages/metadata/` | Pas de nouvelles features avant ISRC prod validé |
| `@sonafrik/persistence` | `packages/persistence/` | Pas de nouvelles features avant sync jobs prod |

## Règle turbo

Ces packages restent dans le monorepo pour les tests existants. **Ne pas** les importer depuis `apps/web` ou `apps/mobile` tant que le gel n'est pas levé.

## Levée du gel (critères)

1. Beta fermée validée (76→85/100 MVP)
2. Chaîne financière E2E prod confirmée
3. ADR metadata signé par Martin + Rémy

## Mobile parity (#10)

Parité mobile ~22 % vs web — roadmap Sprint 7+. Pas de parité forcée avant lancement web beta.

## RSC conversion (#7)

~148 composants `"use client"` — conversion progressive post-beta. Priorité : pages statiques (landing, legal) déjà en RSC. Ne pas convertir en masse avant beta (risque régression player/auth).
