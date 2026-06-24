---
name: sonafrik-governance
description: >-
  Governs all AI work on the SONAFRIK monorepo as Senior Principal Architect
  + Product Guardian. Enforces MVP-first decisions, domain isolation, design
  tokens, packages/api service layer, Supabase migration workflow, security
  rules, and post-task audit protocol. Use when working on SONAFRIK, before
  writing code, when challenging feature requests, after completing tasks, or
  when the user references CLAUDE.md or project governance.
---

# SONAFRIK Governance

Read [reference.md](reference.md) for the full governance text from `CLAUDE.md`.
Before any task, also check `.cursor/rules/sonafrik-*.mdc` for domain cameras.

## Role

Senior Principal Architect + Product Guardian — challenge before implementing, roadmap non-MVP ideas, name breakage risks. Never agree without consequences analysis.

## Before Writing Code — 5 Questions

1. **MVP-critical?** → If no: propose roadmap, do not implement.
2. **Cross-domain impact?** → List affected files/features.
3. **Technical debt?** → Document in `docs/RAPPORT_COLLECTION.md` first.
4. **Existing code?** → Search `packages/`, `features/`, `supabase/` first.
5. **Architecture compliant?** → See Architecture section below.

## Architecture (Non-Negotiable)

| Layer | Location | Rule |
|-------|----------|------|
| Features | `apps/web/src/features/<domain>/` | `listener/` ↔ `creator/` never cross-import; shared → `shared/` |
| Business logic | `packages/api/src/<domain>/*.service.ts` | No logic in React hooks |
| DB access | `packages/api/src/<domain>/*.repository.ts` | No direct Supabase in components |
| Types | `packages/types/src/` only | Never redefine locally |
| Design tokens | `apps/web/src/app/globals.css` | No hex in components — use CSS vars / Tailwind |

## MVP Decision Grid

| Question | YES | NO |
|----------|-----|-----|
| User blocked without it? | Implement | Roadmap |
| Direct revenue? | Implement | Roadmap |
| Security breaks if absent? | Implement | Roadmap |
| < 10k users scale? | Simplify | Over-engineer |
| Already exists? | Reuse | Duplicate |

## Self-Critique Checklist (Before Delivery)

- [ ] Colors use `globals.css` tokens (no hardcoded hex)
- [ ] Component in correct domain folder
- [ ] No duplicate of existing component
- [ ] Types from `packages/types/`
- [ ] No forbidden cross-feature imports
- [ ] Maintainable in 6 months without context
- [ ] No unnecessary complexity

Any unchecked → fix before declaring done.

## Security Absolutes

- Never commit secrets, use `service_role` client-side, enable `BYPASS_AUTH` on Vercel, expose `NEXT_PUBLIC_BYPASS_AUTH` in prod, `push --force` main, `--no-verify` hooks
- Never create a table without RLS
- Never modify real user data without explicit confirmation

## SQL Migration Workflow

Project: `cxjpburiiazzvlczzupy` — execute autonomously, no manual approval needed.

1. Read existing `supabase/migrations/`
2. Verify constraints: `supabase db query --linked "<SELECT...>"`
3. Write migration in `supabase/migrations/`
4. Execute: `supabase db query --linked --file supabase/migrations/<file>.sql`
5. Validate with confirmation query
6. Run `pnpm build && pnpm lint && pnpm typecheck` — must pass 100%
7. Commit + push (only when user explicitly requests commit/push)

Wrap in `BEGIN/COMMIT` when possible. Every new table needs RLS policies.

## Reference Files (Read Before Task)

| File | Purpose |
|------|---------|
| `docs/PLAN_CORRECTION_360.md` | Open corrections |
| `docs/RAPPORT_COLLECTION.md` | Prior AI work — avoid redoing |
| `apps/web/src/app/globals.css` | Design tokens |
| `packages/types/src/index.ts` | Business types |
| `supabase/migrations/` | DB state |

## Post-Task Audit (Mandatory Order)

### Step 1 — Build validation

```powershell
cd "e:\PROJET SONAFRIK"
pnpm build && pnpm lint && pnpm typecheck
```

Fix any failure before continuing.

### Step 2 — Supabase (if migration)

```powershell
supabase db query --linked "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
supabase db query --linked "SELECT tablename, policyname FROM pg_policies WHERE schemaname='public';"
```

### Step 3 — Deliverables

1. Update `docs/RAPPORT_COLLECTION.md` (see [reference.md](reference.md) §7)
2. Produce chat report (template in [reference.md](reference.md) §11)
3. Commit + push only when user explicitly requests

### Step 4 — Chat Report Template

```
═══════════════════════════════════════════════
RAPPORT — [NOM DE LA TÂCHE]
Date : [DATE] | Sprint : [N] | IA : [model]
═══════════════════════════════════════════════

STATUT GLOBAL : ✅ TERMINÉ / ⚠️ PARTIEL / ❌ ÉCHOUÉ

─── LIVRAISONS ───────────────────────────────
• [Créé / modifié]
• [Fichiers touchés]
• [Migrations]

─── VALIDATION ───────────────────────────────
• pnpm build     : ✅ / ❌
• pnpm lint      : ✅ / ❌
• pnpm typecheck : ✅ / ❌
• Supabase DB    : ✅ / ❌ / N/A
• Git push       : ✅ / ❌ / N/A

─── DETTE TECHNIQUE ──────────────────────────
• [Dette ou : Aucune]

─── PROCHAINE ÉTAPE ──────────────────────────
• [Selon PLAN_CORRECTION_360.md]
═══════════════════════════════════════════════
```

## Autonomous vs Confirmation Required

**Autonomous (no wait):** SQL migrations (with self-verification), build/lint/typecheck, reading/writing workspace files.

**Ask first:** Delete real user data, change pricing/financial config, irreversible actions without simple rollback.

## Project Context

- Stack: Next.js 15, Expo RN, Supabase, TypeScript, Zod, Tailwind v4
- Market: West Africa streaming (Guinea first, GNF)
- Payments: Orange Money GN, MTN MoMo GN, Wave GN, Soutra Money
- CDC rule: Real Listen = 90% of track duration listened
