> ⚠️ ARCHIVÉ — 26 juin 2026. Ce document reflète l'état au 23 juin 2026 uniquement.
> Source de vérité actuelle : `docs/EXECUTION_LOG.md`

# PLAN DE CORRECTION 360° — SONAFRIK
> Document de référence pour toute IA ou développeur travaillant sur le projet.
> **Lire CLAUDE.md en premier.**
> Mettre à jour ce fichier après chaque tâche complétée.
> Dernière mise à jour : 2026-06-23 — Certification globale A→E

---

## ÉTAT RÉEL AU 2026-06-23

**Score global : 88/100** — Projet certifié bêta fermée, prêt staging paiements.

> Rapport détaillé : `docs/RAPPORT-CERTIFICATION-GLOBALE.md`  
> Re-vérification : `pnpm probe:certification` → **103/103**

| Dimension | Score | État |
|---|---|---|
| Architecture | 92/100 | ✅ Couche API complète, admin isolé |
| Performance | 85/100 | ✅ React.cache, timeouts, next/image |
| Sécurité | 88/100 | ✅ RLS 53/53, règles financières strictes |
| Maintenabilité | 90/100 | ✅ 0 erreur TS, 0 warning lint, probes A→E |
| MVP Readiness | 85/100 | ✅ Bêta OK — prod paiements = credentials opérateurs |
| Qualité du code | 92/100 | ✅ 0× `as never`, 0× `as any` dans api |

---

## PLAN DE GUERRE — VAGUES

### ✅ VAGUE A — Sécurité urgente (TERMINÉE 2026-06-22)

| Tâche | Statut |
|---|---|
| Migration `20260621040000_subscription_plans_and_security_fixes` | ✅ |
| `admin_dashboard_stats` : SELECT révoqué à `anon`/`authenticated` | ✅ |
| `subscription_plans` : table + RLS + 3 plans + trigger | ✅ |
| `requireCreator.ts` : garde bypass aligné | ✅ |
| Vercel : aucun `BYPASS_AUTH` | ✅ |
| Probe certification | ✅ 15/15 |

### ✅ VAGUE B — Stabilisation (TERMINÉE 2026-06-22)

| Tâche | Statut |
|---|---|
| `formatGnf` unifié sur `@sonafrik/shared` | ✅ |
| Doublons RPC supprimés (`mark_all_notifications_read`, `send_tip`, `check_ownership_total`) | ✅ |
| Probe certification | ✅ 19/19 |

### ✅ VAGUE C — Architecture / couche API (TERMINÉE 2026-06-22)

| Tâche | Statut |
|---|---|
| 8 pages admin sans Supabase direct → `useAdminService` | ✅ |
| `AdminService/Repository` : catalog, rights, finance, fraud | ✅ |
| Route `/admin/health` | ✅ |
| Probe certification | ✅ 19/19 |

### ✅ VAGUE D — Typage & design tokens (TERMINÉE 2026-06-22)

| Tâche | Statut |
|---|---|
| 127 hex hardcodés → 0 | ✅ |
| Tokens CSS manquants ajoutés | ✅ |
| 71× `as never` → 0 dans `@sonafrik/api` | ✅ |
| 5× `as any` supprimés | ✅ |
| Probe certification | ✅ 22/22 |

### ✅ VAGUE E — Paiements mobiles (TERMINÉE 2026-06-23)

| Tâche | Statut |
|---|---|
| Module `_shared/payments.ts` — Wave, Orange, MTN, Soutra + sandbox | ✅ |
| Module `_shared/payment-callback.ts` — DRY + HMAC | ✅ |
| 4 edge callbacks refactorisés | ✅ |
| Edge `payment-initiate` déployée | ✅ |
| `packages/api/src/payments/` — service + schemas | ✅ |
| Web : `TopupModal`, `PayoutPage`, gate `NEXT_PUBLIC_PAYMENTS_ENABLED` | ✅ |
| Migration `20260624200000` — audit `request_withdrawal` | ✅ appliquée remote |
| Probe certification | ✅ 22/22 |

---

## PROCHAINES ÉTAPES (POST VAGUE E)

| Tâche | Priorité | Bloquant |
|---|---|---|
| Credentials sandbox/prod opérateurs (Orange, MTN, Wave, Soutra) | Critique | Revenu réel |
| Webhooks opérateurs → edge callbacks en prod | Critique | Revenu réel |
| `NEXT_PUBLIC_PAYMENTS_ENABLED=true` en staging | Haute | Test E2E paiement |
| Sprint G-5 — abonnements Mobile Money | Moyenne | Abonnements |
| Beat Store (`beat_store` flag) | Post-paiements | Marketplace beats |
| `/wallet/royalties` — UI réelle | Moyenne | Créateurs |

---

## ÉTAT DE LA BASE DE DONNÉES

| Métrique | Valeur |
|---|---|
| Tables | 53 (toutes avec RLS activé) |
| Policies RLS | ~161 |
| Migrations | **64/64** appliquées (local = remote) |
| Doublons RPC | 0 |
| Dernière migration | `20260624200000_vague_e_payout_audit_request` |

---

## ÉTAT DES PACKAGES

| Package | État | Note |
|---|---|---|
| `@sonafrik/types` | ✅ Sain | Source unique des types métier |
| `@sonafrik/api` | ✅ Sain | 0× `as never`, couche service complète |
| `@sonafrik/ui` | ✅ Sain | 17 composants centralisés |
| `@sonafrik/shared` | ✅ Sain | `formatGnf` unifié |
| `@sonafrik/database` | ✅ Sain | Client typé Supabase |
| `@sonafrik/web` | ✅ Sain | 47 routes, build OK |
| `@sonafrik/mobile` | ✅ Sain | Player partiel |

---

## PROBLÈMES RÉSOLUS (anciennement bloquants)

- ~~Tables fantômes~~ → créées ✅
- ~~1301 couleurs hex hardcodées~~ → 0 ✅
- ~~Button asChild crash~~ → corrigé ✅
- ~~RLS manquant~~ → 53/53 ✅
- ~~Drift migration~~ → 64/64 ✅
- ~~Doublons RPC~~ → 0 ✅
- ~~Composants `.from()` direct~~ → couche API ✅
- ~~Paiements stubs sans architecture~~ → Vague E complète ✅
- ~~Edge `payment-initiate` non déployée~~ → déployée 2026-06-23 ✅

---

## COMMANDES DE CERTIFICATION

```powershell
pnpm probe:certification   # 103 checks — A→E + globaux
pnpm probe:vague-a           # … jusqu'à e
pnpm typecheck && pnpm lint
pnpm --filter @sonafrik/web build
```
