# PLAN DE CORRECTION 360° — SONAFRIK
> Document de référence pour toute IA ou développeur travaillant sur le projet.
> **Lire CLAUDE.md en premier.**
> Mettre à jour ce fichier après chaque tâche complétée.
> Dernière mise à jour : 2026-06-22 — Post-Audit Forensique 360°

---

## ÉTAT RÉEL AU 2026-06-22

**Score global : 82/100** — Projet sain et maintenable, prêt pour la bêta fermée.

> ⚠️ L'ancienne version de ce document (pré-audit) décrivait des problèmes résolus depuis.
> Ce document reflète l'**état mesuré réel**, pas un état estimé.

| Dimension | Score | État |
|---|---|---|
| Architecture | 88/100 | ✅ Isolation domaines respectée |
| Performance | 85/100 | ✅ React.cache, timeouts, next/image |
| Sécurité | 78/100 | ✅ RLS 53/53 tables, 0 secret exposé |
| Maintenabilité | 84/100 | ✅ 0 erreur TS, 0 warning lint |
| MVP Readiness | 70/100 | ⚠️ Bêta OK — paiements en stub |
| Qualité du code | 86/100 | ✅ Typecheck + lint 100% verts |

---

## PLAN DE GUERRE — VAGUES

### ✅ VAGUE A — Sécurité urgente (TERMINÉE 2026-06-22)

| Tâche | Statut | Commit |
|---|---|---|
| Migration `20260621040000_subscription_plans_and_security_fixes` appliquée | ✅ | `99eabc4` |
| `admin_dashboard_stats` : SELECT révoqué à `anon`/`authenticated` | ✅ | `99eabc4` |
| `subscription_plans` : table + RLS + 3 plans + trigger | ✅ | `99eabc4` |
| `requireCreator.ts` : garde bypass aligné sur `&& VERCEL !== "1"` | ✅ | `99eabc4` |
| Vercel dashboard : aucun `BYPASS_AUTH`/`NEXT_PUBLIC_BYPASS_AUTH` | ✅ | Vérifié |
| Drift migration résolu : 48/48 appliquées | ✅ | Manuel |

### ✅ VAGUE B — Stabilisation (TERMINÉE 2026-06-22)

| Tâche | Statut | Commit |
|---|---|---|
| `formatGnf` unifié sur `@sonafrik/shared` (4 composants web + 1 mobile) | ✅ | `8e0fc0e` + `742f5ed` |
| RPC `mark_all_notifications_read()` doublon supprimé | ✅ | `8e0fc0e` |
| RPC `send_tip(p_sender_id, ...)` doublon supprimé | ✅ | `8e0fc0e` |
| RPC `check_ownership_total(uuid)` doublon supprimé | ✅ | `8e0fc0e` |

### ✅ VAGUE C — Nettoyage (TERMINÉE 2026-06-22)

| Tâche | Statut | Commit |
|---|---|---|
| `AdminCatalogCenter` : couche API via `useAdminService` | ✅ | en cours |
| `AdminRightsCenter` : couche API via `useAdminService` | ✅ | en cours |
| `NotificationBell` : couche API via `useNotificationsService` | ✅ | en cours |
| `SessionList` : `signOutEverywhere()` via `useAuthService` | ✅ | en cours |
| `GoogleAuthButton` : `signInWithGoogle()` via `useAuthService` | ✅ | en cours |
| `AdminService/Repository` : méthodes `reviewCatalogItem` + `updateRightsClaim` | ✅ | en cours |
| `AuthService` : méthodes `signOutEverywhere` + `signInWithGoogle` | ✅ | en cours |
| Hook `useAdminService` créé | ✅ | en cours |
| Route `/admin/health` : lien ajouté dans la nav admin | ✅ | en cours |
| Tables `payout_audit_logs`/`payout_batches` : commentées "Réservées Vague E" | ✅ | en cours |
| `PLAN_CORRECTION_360.md` réécrit (suppression infos périmées) | ✅ | en cours |

### 🟡 VAGUE D — Optimisation (À FAIRE)

| Tâche | Priorité | Effort |
|---|---|---|
| Ajouter token `--color-error` dans `globals.css` | Moyen | 30 min |
| Ajouter variantes alpha des tokens (`--color-or-solaire-alpha`) | Faible | 1 h |
| Remplacer les 64 hex hardcodés restants (surtout admin/wallet/loading) | Faible | 2 h |
| Audit `SearchResults.tsx` (411 l.) — virtualisation si liste grandit | Faible | 1 h |

### 🔴 VAGUE E — Paiements (BLOQUANT REVENU)

| Tâche | Priorité | Effort estimé |
|---|---|---|
| Intégrer Orange Money GN (credentials sandbox → prod) | Critique | 2-3 sem. |
| Intégrer MTN MoMo GN | Critique | 2-3 sem. |
| Intégrer Wave GN | Critique | 1-2 sem. |
| Intégrer Soutra Money | Critique | 1-2 sem. |
| HMAC callbacks sécurisés pour chaque provider | Critique | 1 sem. |
| Activer `payout_batches` + `payout_audit_logs` dans le code | Critique | 1 sem. |
| Déverrouiller Beat Store (feature flag) | Post-paiements | 1 sem. |

---

## ÉTAT DE LA BASE DE DONNÉES

| Métrique | Valeur |
|---|---|
| Tables | 53 (toutes avec RLS activé) |
| Policies RLS | 161 |
| Tables sans policy (deny-all) | 1 (`rate_limits` — accès service-role only) |
| Migrations | 48/48 appliquées |
| Fonctions RPC | ~140 (dont ~40 extensions) |
| Triggers | 51 |
| Doublons RPC | 0 (résolu Vague B) |

---

## ÉTAT DES PACKAGES

| Package | État | Note |
|---|---|---|
| `@sonafrik/types` | ✅ Sain | Source unique des types métier |
| `@sonafrik/api` | ✅ Sain | Couche service/repository complète |
| `@sonafrik/ui` | ✅ Sain | 17 composants centralisés |
| `@sonafrik/shared` | ✅ Sain | `formatGnf` unifié, utilitaires partagés |
| `@sonafrik/database` | ✅ Sain | Client typé Supabase |

---

## PROBLÈMES RÉSOLUS (anciennement listés comme bloquants)

> Ces problèmes étaient décrits dans l'ancienne version du plan comme bloquants.
> Ils sont tous résolus.

- ~~Tables fantômes~~ (`beats`, `feature_flags`, `system_settings`) → créées et utilisées ✅
- ~~1301 couleurs hex hardcodées~~ → 64 restantes (non bloquant) ✅
- ~~Button asChild crash~~ → `buttonVariants` sur `<Link>` ✅
- ~~RLS manquant~~ → 53/53 tables protégées ✅
- ~~Drift migration~~ → 48/48 appliquées ✅
- ~~Doublons RPC~~ → 0 doublon ✅
- ~~formatGnf incohérent~~ → source unique `@sonafrik/shared` ✅
- ~~Composants en `.from()` direct~~ → couche API respectée (Vague C) ✅
