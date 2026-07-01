# Career OS — GELÉ MVP

> **Statut :** POST-MVP · Flag `career_os=false` par défaut  
> **Ne pas étendre** avant validation beta publique.

## Comportement

- `creatorDashboard.service.ts` — skip `buildCareerOs()` si `career_os` OFF
- UI enterprise : `features/creator/dashboard/enterprise/*` — masquée si flag OFF
- Ce module reste compilé pour éviter breaking imports ; **0 appel métier** en MVP

## Réactivation

1. Activer flag `career_os` en DB
2. Valider E2E dashboard créateur
3. Mettre à jour `docs/MVP_SCOPE_LOCK.md`

## Fichiers

- `career.engine.ts` — orchestration Career OS
- `career.missions.ts` — définitions missions
- `career.levels.ts` — niveaux créateur
