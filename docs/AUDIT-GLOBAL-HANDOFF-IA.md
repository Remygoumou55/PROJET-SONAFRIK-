# AUDIT GLOBAL — HANDOFF POUR AUTRES IA
> **Objectif :** Mettre toute IA au même niveau de contexte que l'équipe après la première conversation jusqu'à l'état actuel.
> **Projet :** SONAFRIK — Music Operating System Africain
> **Workspace :** `E:\PROJET SONAFRIK`
> **Supabase :** `cxjpburiiazzvlczzupy`
> **Dernière mise à jour :** 2026-06-22
> **Statut global :** Bêta fermée possible — **paiements réels = bloquant revenu**

---

## 1. RÉSUMÉ EXÉCUTIF (30 secondes)

SONAFRIK est un monorepo Turborepo (Next.js 15 web + Expo mobile + Supabase) pour le streaming musical guinéen. Depuis le premier prompt (CDC V9.0), le projet est passé de **zéro à un MVP technique quasi-complet** : auth, identity, creator, catalog, streaming (Real Listen V7.2), wallet, royalties, rights, admin, mobile player.

**3 audits forensiques** (V1 → V2 → V3) + **4 vagues de correction** (A→D) ont été exécutées. Score actuel **82/100** — prêt bêta fermée, **pas prêt monétisation** (4 opérateurs paiement = stubs).

**Toute IA doit lire dans cet ordre :**
1. `CLAUDE.md`
2. `docs/CDC-v9.0.md`
3. `docs/PLAN_CORRECTION_360.md`
4. `docs/RAPPORT_COLLECTION.md` (5 dernières entrées)
5. `.cursor/rules/*.mdc` (6 caméras de surveillance)

---

## 2. CHRONOLOGIE COMPLÈTE DE LA CONVERSATION

| Phase | Date | Action | Livrable |
|---|---|---|---|
| **0** | 2026-06-10 | Réception CDC V9.0 DÉFINITIF | Source de vérité produit |
| **1** | 2026-06-10 | Sprint 0 — Foundation | Monorepo Turborepo, packages, CI, `.cursor/rules/sonafrik-cdc.mdc` |
| **2** | 2026-06-10 | Sprints 2–8 (Identity → Wallet) | Migrations SQL, RLS, packages/api |
| **3** | 2026-06-20 | Sprint 5 — Catalog OS | Tracks, albums, upload, signed URLs |
| **4** | 2026-06-20 | Sprint 6 — Streaming OS | WebPlayer, Real Listen, stream events, library, search V1 |
| **5** | 2026-06-20 | Audit forensique 360° V1 (read-only) | Canvas V1, `PLAN_CORRECTION_360.md`, `CLAUDE.md`, `RAPPORT_COLLECTION.md` |
| **6** | 2026-06-21 | Lecture gouvernance (CLAUDE, DEPLOIEMENT, ADMIN_GUIDE, PLAN) | Compréhension rules/skills |
| **7** | 2026-06-21 | Autonomie IA accordée par Rémy | `CLAUDE.md` §11–12 : migrations SQL, git push, audit post-tâche |
| **8** | 2026-06-21 | Audit forensique V2 (approfondi) | 15 nouveaux problèmes, 6 caméras Cursor rules |
| **9** | 2026-06-21 | Audit forensique V3 (DB live + mobile + edge fn) | 20 nouveaux problèmes, canvas V3 |
| **10** | 2026-06-22 | Vagues A→D corrections | Sécurité, stabilisation, couche API, 0 hex hardcodé |
| **11** | 2026-06-22 | État actuel | Score 82/100, build/lint/typecheck 100% verts |

---

## 3. CE QUI A ÉTÉ CONSTRUIT (PAR SPRINT)

### Sprint 0 — Foundation
- Monorepo : `apps/web`, `apps/mobile`, `packages/{types,shared,ui,database,api}`
- Turborepo + pnpm + TypeScript strict + ESLint
- CI GitHub Actions (lint, typecheck, build)
- `docs/CDC-v9.0.md` enregistré

### Sprint 2 — Identity OS
- Tables : `profiles`, `roles`, `permissions`, `user_roles`, `user_sessions`, `audit_logs`
- RLS Zero Trust (DENY ALL par défaut)
- RPC `log_audit_event()`

### Sprint 3 — Identity étendu
- `user_preferences`, notifications, avatar

### Sprint 4 — Creator OS
- `creators`, `artist_profiles`, `labels`, `creator_roles`, `studios`, `creator_verifications`
- Dashboard créateur web + mobile (partiel)

### Sprint 5 — Catalog OS ✅
- `tracks`, `albums`, `genres`, `track_files`, `track_credits`
- Upload audio/visuel, workflow publication, signed URLs
- Rapport : `docs/SPRINT-5-REPORT.md`

### Sprint 6 — Streaming OS ✅
- `stream_sessions`, `stream_events`, `playback_positions`
- Edge Functions : `stream-start`, `stream-progress`, `stream-complete`
- Real Listen V7.2 (seuil 90% côté serveur)
- WebPlayer, Library, Search V1, Analytics V1
- Rapport : `docs/SPRINT-6-REPORT.md`

### Sprint 8 — Wallet OS
- `wallets`, `wallet_ledger`, `transactions`, `withdrawals`, `payout_accounts`
- RPC `topup_wallet`, Edge Function `wallet-topup`
- Revenue Pool 65% (CDC Règle #3)

### Sprint 9 — Rights OS
- `works`, `contributors`, `ownerships`, `contracts`, `rights_claims`

### Post-sprints (enterprise)
- Discovery engine, recommendation, social engagement, antifraude, payout engine, royalty engine
- Search indexes, payment_intents, rate_limits, subscription_plans (migration 20260621040000)

---

## 4. ARCHITECTURE ACTUELLE

```
E:\PROJET SONAFRIK\
├── apps/
│   ├── web/          Next.js 15 — admin, streaming, creator, wallet, auth
│   └── mobile/       Expo Router — 27 écrans, mini player, creator catalog
├── packages/
│   ├── api/          Service + Repository (17 domaines)
│   ├── types/        Types métier (découpés en 11 fichiers)
│   ├── ui/           Design system (17 composants + tokens)
│   ├── shared/       formatGnf, utilitaires
│   └── database/     Client Supabase typé
├── supabase/
│   ├── migrations/   48 migrations SQL
│   └── functions/    14 Edge Functions
├── docs/             CDC, rapports sprint, plans, guides
├── .cursor/rules/    7 règles IA (6 caméras + CDC)
└── CLAUDE.md         Gouvernance IA principale
```

### Pattern obligatoire
```
Composant React → Hook useXxx → Service (packages/api) → Repository → Supabase
Types → packages/types UNIQUEMENT
Couleurs → globals.css tokens UNIQUEMENT (web) / @sonafrik/ui/tokens (mobile)
```

### Isolation domaines (NON NÉGOCIABLE)
- `listener/` (streaming, library, search) ≠ `creator/` (catalog, analytics, rights)
- Partagé → `shared/` (social, notifications, tips)

---

## 5. BASE DE DONNÉES — ÉTAT LIVE (VÉRIFIÉ 2026-06-21)

| Métrique | Valeur |
|---|---|
| Tables | **53** |
| RLS activé | **53/53 (100%)** |
| Policies RLS | **161** |
| Migrations appliquées | **48/48** |
| RPC functions | ~140 |
| Triggers | 51 |

### Tables principales
`profiles`, `artist_profiles`, `tracks`, `albums`, `track_files`, `stream_sessions`, `stream_events`, `wallets`, `wallet_ledger`, `transactions`, `payment_intents`, `subscription_plans`, `rate_limits`, `audit_logs`, `works`, `ownerships`, `beats`, `feature_flags`, `system_settings`

### Tables orphelines (DB oui, code API non)
- `creators`, `studios`, `creator_roles`, `label_members`, `labels`

### Incohérences ADMIN_GUIDE.md (à corriger si pas fait)
- `audit_log` → réalité = `audit_logs`
- `artist_profiles.user_id` → réalité = `creator_id`

---

## 6. LES 3 AUDITS FORENSIQUES

### Audit V1 (2026-06-20) — Read-only
**Découvertes majeures :**
- 1 301 hex hardcodés vs 12 tokens CSS
- TipButton dupliqué, Step5Confirm dupliqué
- BYPASS_AUTH exposé côté client
- Couplage cross-features
- moment.js installé inutilisé
- 8 routes admin sans loading.tsx

**Livrables :** Canvas V1, `PLAN_CORRECTION_360.md`, `CLAUDE.md`, `RAPPORT_COLLECTION.md`

**Emplacement canvas :** `C:\Users\remyg\.cursor\projects\e-PROJET-SONAFRIK\canvases\audit-forensique-360.canvas.tsx`

### Audit V2 (2026-06-21) — Approfondi
**15 nouveaux problèmes :**
- `subscription_plans` absente (corrigée Vague A)
- AsyncStorage non chiffré mobile
- 0 tests unitaires
- 3 composants morts (LaunchCounter, AuthHomeActions, useEngagementStats)
- Bug RPC : `toggleLike()` appelle `toggle_favorite`
- 5 artistes fictifs hardcodés sur `/lancement`
- 39 `as never` dans packages/api

**Livrables :** Canvas V2, 6 caméras `.cursor/rules/`

### Audit V3 (2026-06-21) — DB live + mobile + edge functions
**20 nouveaux problèmes :**
- 4 opérateurs paiement = TODO stubs (Orange, MTN, Wave, Soutra)
- Aucun guard auth sur `(tabs)/_layout.tsx` mobile
- CORS `"*"` fallback sur edge functions si ALLOWED_ORIGIN absent
- Texte "Sprint 2 — Auth OTP SMS" en prod mobile
- Tokens CSS incohérents (3 sources)
- DB types périmés → cause des `as never`
- Explorer mobile n'affiche que tracks (pas albums/artistes)
- URL signées audio = 7200s (2h) — trop long

**Livrables :** Canvas V3, caméras mises à jour

**Emplacement canvases :**
```
C:\Users\remyg\.cursor\projects\e-PROJET-SONAFRIK\canvases\
├── audit-forensique-360.canvas.tsx      (V1)
├── audit-forensique-360-v2.canvas.tsx   (V2)
└── audit-forensique-360-v3.canvas.tsx   (V3 — le plus complet)
```

---

## 7. CORRECTIONS POST-AUDIT (VAGUES A→D, 2026-06-22)

### ✅ Vague A — Sécurité urgente
- Migration `subscription_plans` + RLS + 3 plans
- `admin_dashboard_stats` : SELECT révoqué à anon/authenticated
- `requireCreator.ts` : garde bypass alignée
- Drift migration résolu : 48/48

### ✅ Vague B — Stabilisation
- `formatGnf` unifié sur `@sonafrik/shared`
- 3 RPC doublons supprimés

### ✅ Vague C — Nettoyage architecture
- Composants admin/auth : couche API respectée (plus de `.from()` direct)
- Hooks `useAdminService`, `useAuthService` créés
- Découpe `packages/types` (1754 lignes → 11 fichiers)

### ✅ Vague D — Design tokens
- **127 hex hardcodés → 0** dans tout le monorepo
- Tokens manquants ajoutés dans `globals.css`
- build + lint + typecheck : 100% verts

### Commits clés récents
```
c816db4 fix(design): Vague D re-audit final — 0 hex hardcodé
090f326 refactor(arch): Vague C — couche API respectée
99eabc4 fix(security): Vague A — 3 correctifs urgents
f62bf7e fix(audit-v1v2v3): 12 corrections forensiques
24e778f feat(cameras): mise a jour V3 regles surveillance
7231bc4 feat(surveillance): installer 6 cameras Cursor rules
```

---

## 8. CAMÉRAS DE SURVEILLANCE (`.cursor/rules/`)

| Fichier | Scope | Rôle |
|---|---|---|
| `sonafrik-cdc.mdc` | alwaysApply | CDC V9.0, stack, 10 règles absolues |
| `sonafrik-architecture-camera.mdc` | alwaysApply | Isolation domaines, anti-patterns, patterns obligatoires |
| `sonafrik-db-camera.mdc` | alwaysApply | 53 tables, workflow migrations, incohérences |
| `sonafrik-security-camera.mdc` | alwaysApply | BYPASS_AUTH, AsyncStorage, risques actifs |
| `sonafrik-tokens-camera.mdc` | globs: `**/*.tsx` | Tokens CSS, hex interdits |
| `sonafrik-plan-camera.mdc` | alwaysApply | Plan correction par priorité |
| `sonafrik-audit-camera.mdc` | alwaysApply | Protocole post-tâche obligatoire |

---

## 9. GOUVERNANCE IA — RÈGLES NON NÉGOCIABLES

### Accès autonomes (accordés par Rémy, 2026-06-21)
- Exécuter migrations SQL via `supabase db query --linked`
- `git push origin main` (jamais `--force`)
- `pnpm build && pnpm lint && pnpm typecheck` après chaque tâche
- Rapport structuré dans `docs/RAPPORT_COLLECTION.md`

### Interdictions absolues
- Committer `.env`, secrets, service_role key côté client
- BYPASS_AUTH sur Vercel
- Hex hardcodé dans composants
- Import cross-feature interdit (listener ↔ creator)
- Logique métier dans composants React
- Beat Store / ML / multi-currency avant validation MVP bêta

### Protocole post-tâche (Section 11 CLAUDE.md)
1. `pnpm build && pnpm lint && pnpm typecheck` — 0 erreur
2. Validation Supabase si migration
3. `git commit` + `git push origin main`
4. Entrée dans `RAPPORT_COLLECTION.md`

---

## 10. SCORES ACTUELS (2026-06-22)

| Dimension | Score | État |
|---|---|---|
| Architecture | 88/100 | ✅ Isolation domaines, couche API |
| Performance | 85/100 | ✅ React.cache, next/image, memo TrackRow |
| Sécurité | 78/100 | ✅ RLS 53/53, ⚠️ CORS edge fn, mobile guard |
| Maintenabilité | 84/100 | ✅ 0 erreur TS, 0 warning lint |
| MVP Readiness | 70/100 | ⚠️ Bêta OK, paiements stub |
| Qualité code | 86/100 | ✅ Typecheck + lint 100% |
| **Global** | **82/100** | Bêta fermée possible |

---

## 11. PROBLÈMES ENCORE OUVERTS (PRIORITÉ DÉCROISSANTE)

### 🔴 CRITIQUE — Bloquant revenu
| ID | Problème | Zone |
|---|---|---|
| PAY-1 | 4 opérateurs paiement = TODO stubs | `supabase/functions/payment-initiate/` |
| PAY-2 | Callbacks HMAC non validés en prod | `payment-*-callback/` |
| TEST-1 | 0 fichiers `.test.ts` / `.spec.ts` | Tout le monorepo |
| CI-1 | Pipeline CI sans step `test` | `.github/workflows/ci.yml` |

### 🟡 HAUTE — Avant lancement public
| ID | Problème | Zone |
|---|---|---|
| MOB-1 | Guard auth absent sur `(tabs)/_layout.tsx` | `apps/mobile/` |
| MOB-2 | AsyncStorage → expo-secure-store (partiellement fait) | `apps/mobile/lib/supabase.ts` |
| MOB-3 | Texte "Sprint 2" en prod | `apps/mobile/app/index.tsx` |
| SEC-1 | CORS `"*"` fallback edge functions | `supabase/functions/*/index.ts` |
| E1 | FLAC/OGG désactivés, WAV brut servi | catalog/schemas.ts |
| BUG-1 | `toggleLike()` appelle `toggle_favorite` RPC | social.repository.ts |

### 🟢 BASSE — Post-bêta
| ID | Problème | Zone |
|---|---|---|
| DEAD-1 | LaunchCounter, AuthHomeActions, useEngagementStats morts | features/ |
| ORPH-1 | 5 tables DB orphelines (creators, studios...) | packages/api |
| MOB-4 | Explorer mobile : albums/artistes ignorés | explorer.tsx |
| DOC-1 | ADMIN_GUIDE incohérences (audit_log, user_id) | docs/ADMIN_GUIDE.md |
| URL-1 | Signed URL expiry 7200s → réduire à 1800s | stream-start |

---

## 12. EDGE FUNCTIONS (14)

| Fonction | Auth | Statut |
|---|---|---|
| stream-start | JWT | ✅ Opérationnel |
| stream-progress | JWT | ✅ Opérationnel |
| stream-complete | JWT | ✅ Opérationnel (Real Listen 90%) |
| wallet-topup | JWT | ✅ Opérationnel |
| wallet-request-withdrawal | JWT | ✅ Opérationnel |
| payment-initiate | JWT | ⚠️ Sandbox uniquement |
| payment-orange-callback | Webhook | ⚠️ À valider prod |
| payment-mtn-callback | Webhook | ⚠️ À valider prod |
| payment-wave-callback | Webhook | ⚠️ À valider prod |
| payment-soutra-callback | Webhook | ⚠️ À valider prod |
| catalog-asset-signed-url | JWT | ✅ Opérationnel |
| creator-asset-signed-url | JWT | ✅ Opérationnel |
| avatar-signed-url | JWT | ✅ Opérationnel |
| audit-log | JWT | ✅ (sans ownership check) |

---

## 13. DOCUMENTS DE RÉFÉRENCE — OÙ TROUVER QUOI

| Besoin | Fichier |
|---|---|
| Cahier des charges produit | `docs/CDC-v9.0.md` |
| Gouvernance IA | `CLAUDE.md` |
| Plan de correction actuel | `docs/PLAN_CORRECTION_360.md` |
| Journal des modifications | `docs/RAPPORT_COLLECTION.md` |
| Guide admin opérations | `docs/ADMIN_GUIDE.md` |
| Déploiement Vercel/Supabase | `docs/DEPLOIEMENT.md` |
| Paiements mobiles | `docs/PAIEMENTS.md` |
| RPC disponibles | `docs/RPC_REFERENCE.md` |
| Rapports sprint | `docs/SPRINT-*-REPORT.md` |
| Audits visuels | `C:\Users\remyg\.cursor\projects\e-PROJET-SONAFRIK\canvases\` |
| Règles Cursor IA | `.cursor/rules/*.mdc` |
| Variables env | `.env.example` |
| CI | `.github/workflows/ci.yml` |

---

## 14. INSTRUCTIONS POUR UNE NOUVELLE IA

### Avant d'écrire une ligne de code :
```
1. Lire CLAUDE.md (obligatoire)
2. Lire docs/PLAN_CORRECTION_360.md (état actuel)
3. Lire docs/RAPPORT_COLLECTION.md (5 dernières entrées)
4. Vérifier .cursor/rules/ (caméras injectées automatiquement)
5. Poser les 5 questions CLAUDE.md §2 (MVP-critique ? impact ? dette ? existe déjà ? architecture ?)
```

### Commandes de validation (obligatoires après chaque tâche) :
```powershell
cd "E:\PROJET SONAFRIK"
pnpm build && pnpm lint && pnpm typecheck
```

### Migrations SQL :
```powershell
supabase db query --linked --file supabase/migrations/<fichier>.sql
supabase db query --linked "SELECT tablename FROM pg_tables WHERE schemaname='public'"
```

### Regénérer types DB (si schema change) :
```powershell
supabase gen types typescript --project-id cxjpburiiazzvlczzupy --schema public > packages/database/src/types/index.ts
```

### Ce qu'il NE FAUT PAS faire :
- Recréer ce qui existe déjà (chercher dans packages/api d'abord)
- Implémenter Beat Store avant paiements réels
- Utiliser hex hardcodé (#00D26A etc.)
- Appeler Supabase directement depuis un composant React
- Ignorer RLS sur une nouvelle table
- Push --force sur main

### Prochaine priorité recommandée (Vague E) :
1. Intégrer Wave GN (le plus simple des 4 opérateurs)
2. Tests Vitest sur wallet/royalties/streaming
3. Guard auth mobile sur tabs layout
4. Corriger ADMIN_GUIDE.md

---

## 15. LES 10 RÈGLES CDC V9.0 (RAPPEL)

1. **REAL LISTEN V7.2** — Barre non cliquable, calcul serveur, ≥90% = écoute valide
2. **Premium Jour 1 · Gratuit Jour 8**
3. **Revenue Pool = 65%** aux artistes
4. **Beat Store commission = 0 GNF**
5. **Pourboires** — 100% à l'artiste
6. **Mini player** — non cliquable (CDC)
7. **Lancement = 2 000 abonnés payants**
8. **Dark mode natif** — `#0D0D0D`, jamais blanc
9. **Zero Trust** — RLS sur toute table
10. **URLs audio** — signées côté serveur uniquement

---

*Document généré pour handoff inter-IA — SONAFRIK · Mr Rémy Nyanga · 2026-06-22*
