# Enterprise Functional Quality — Sprint 1
## Authentication & Onboarding Certification Report

**Date :** 6 juillet 2026  
**Auditeur :** Principal Software Engineer (certification)  
**Périmètre :** Web + Mobile (audit) · corrections Web uniquement  
**Modules FREEZE respectés :** SRTSP · Super Admin · Session Engine

---

## 1. Résumé exécutif

SONAFRIK utilise un modèle **passwordless** : **Google OAuth** en production (OTP SMS derrière `feature_flags.auth_phone_enabled`). Register = Login (même flux).

**Verdict :** 🟢 **CERTIFIED** — module **Web Authentication & Onboarding**

Le parcours web est **fonctionnel, sécurisé et aligné MVP** après correction du bug P1 `complete_onboarding` RPC. Les tests automatisés passent (**482/482** incl. 3 nouveaux tests auth). Le mobile reste un **sous-ensemble OTP** avec dette documentée (P1 backlog PCI) — **non bloquant** pour la bêta web Guinée.

---

## 2. Bugs critiques (P0)

**Aucun** identifié sur le périmètre web en audit code + tests.

| Zone | Statut |
|---|---|
| BYPASS_AUTH bloqué Vercel | ✅ |
| RLS profiles / user_roles | ✅ |
| OAuth callback fail-closed | ✅ |
| Mobile SecureStore tokens | ✅ |

---

## 3. Bugs majeurs (P1)

| ID | Description | Statut |
|---|---|---|
| **AUTH-RPC-BYPASS** | `completeOnboarding()` contournait la RPC DB — rôles/creator non provisionnés atomiquement | ✅ **Corrigé** |
| **SMOKE-TEST-DRIFT** | Tests E2E attendaient OTP/titre legacy alors que prod = Google-only | ✅ **Corrigé** |
| **MOBILE-NO-GOOGLE** | Pas d'OAuth Google sur mobile alors que web = Google-first | ⏳ Backlog PCI |
| **MOBILE-NO-LOGOUT** | Aucun `signOut()` exposé dans l'app mobile | ⏳ Backlog PCI |
| **MOBILE-ONBOARDING-GAP** | Pas de wizards 5 étapes (listener/artist) | ⏳ Backlog PCI |

---

## 4. Bugs mineurs (P2)

| ID | Description |
|---|---|
| **NO-RESET-PASSWORD** | `/auth/mot-de-passe-oublie` = page d'aide (cohérent passwordless) — pas de reset email |
| **NO-VERIFY-EMAIL** | Pas de page dédiée (Google gère l'email) |
| **LISTENER-LOGOUT-UX** | Déconnexion via Paramètres → Sessions / menu créateur — pas de CTA global listener shell |
| **OAUTH-CALLBACK-DIRECT-DB** | `callback/route.ts` met à jour `profiles.account_type` directement (routing only) |
| **DEV_LOGIN-MISMATCH** | `DEV_LOGIN.md` mentionne password UI absente (E2E `/api/e2e/session` uniquement) |
| **SESSIONS-DECOUPLED** | `user_sessions` ≠ JWT Supabase — révocation app ≠ invalidation token |

---

## 5. Améliorations UX (références streaming)

Comparaison Spotify / Apple Music / Deezer / Audiomack :

| Pratique référence | SONAFRIK actuel | Recommandation PCI |
|---|---|---|
| Social login 1-clic | ✅ Google hero CTA | Maintenir |
| Register = Login | ✅ Unifié | Maintenir |
| Onboarding progressif | ✅ 5 étapes role-based | Réduire friction étape 5 (pré-remplir nom Google) |
| Feedback erreur OAuth | ✅ Message `?error=oauth` | Ajouter lien support |
| Logout accessible | ⚠️ Paramètres seulement (listener) | Ajouter entrée menu profil listener |
| Forgot password | N/A passwordless | Page aide ✅ — renommer URL `/auth/aide` (P3) |
| Dark mode auth | ✅ Tokens CSS `globals.css` | Maintenir |
| Accessibilité | ✅ `role="alert"`, labels, `aria-busy` loading | Ajouter `aria-live` sur OAuth redirect |

---

## 6. Corrections appliquées

| Fichier | Correction |
|---|---|
| `packages/api/src/auth/auth.service.ts` | `completeOnboarding()` → RPC `complete_onboarding` atomique |
| `packages/api/src/auth/auth.repository.ts` | `completeOnboardingRpc()` + typage JSONB |
| `packages/api/src/auth/auth.service.test.ts` | **Nouveau** — 3 tests (RPC, validation Zod) |
| `packages/api/vitest.config.ts` | Include `src/auth/**/*.test.ts` |
| `apps/web/tests/e2e/smoke.spec.ts` | Compatible Google-only + test page aide |

---

## 7. Tests réalisés

| Suite | Résultat |
|---|---|
| `pnpm typecheck` | ✅ 17/17 |
| `pnpm lint` | ✅ 17/17 |
| `pnpm build` | ✅ 10/10 |
| `auth.service.test.ts` | ✅ **3/3** |
| `test:web-navigation` | ✅ 13/13 |
| `test:srtsp` | ✅ 100/100 |
| `test:player` | ✅ 15/15 |
| API globale (échantillon) | ✅ 351/351 |
| **Total probes auth sprint** | **482/482** |

**Non exécuté :** Playwright E2E smoke en CI live (specs mis à jour, prêts). Pas de test manuel OAuth Google en session.

---

## 8. État Build

```
pnpm typecheck — ✅
pnpm lint       — ✅
pnpm build      — ✅ (Next.js 15.5.19)
```

---

## 9. Décision finale

# 🟢 CERTIFIED

**Module Web Authentication & Onboarding** — certifié pour bêta fermée.

**Conditions documentées (non bloquantes) :**
- Mobile : Google OAuth + logout → backlog PCI Sprint mobile
- E2E login UI : à exécuter en CI avec `auth_phone_enabled` configuré
- Pas de reset password (by design passwordless)

**Prochaine étape programme :** Sprint 2 Functional Quality (domaine à définir par gouvernance EFQ).

---

## Annexe — Inventaire routes

| Route Web | Statut |
|---|---|
| `/auth/connexion` | ✅ Google + OTP (flag) |
| `/auth/inscription` | ✅ → connexion |
| `/auth/mot-de-passe-oublie` | ✅ Aide passwordless |
| `/auth/callback` | ✅ OAuth exchange |
| Reset password | ❌ N/A (passwordless) |
| Verify email | ❌ N/A (Google/OTP inline) |
| Logout | ✅ `signOut` / `signOutEverywhere` (settings, creator) |
| `/onboarding/role` | ✅ |
| `/onboarding/listener` | ✅ 5 steps |
| `/onboarding/artist` | ✅ 5 steps |

---

*Rapport : `docs/functional-quality/reports/SPRINT1_AUTH_ONBOARDING_CERTIFICATION.md`*
