# Audit forensique V2 — SONAFRIK

> **Date :** 30 juin 2026  
> **Auteur :** IA Senior Architect (réponse au cadrage Martin)  
> **Statut :** Document actif — complète les vagues A→F et les 20 corrections business  
> **Probes au moment de l'audit :** 134/134 · Build/lint/typecheck : OK

---

## Résumé exécutif (ce que Martin doit retenir)

| Question | Réponse honnête |
|---|---|
| Les 3 silos (auditeur / artiste / admin) sont-ils **totalement** isolés ? | **Non — ~75 % web, ~40 % backend** |
| Le découpage des gros fichiers est-il **terminé** ? | **Non — ~55 %** (web TS OK, CSS et API restent lourds) |
| Le global CSS permet-il de changer la couleur en **1 clic** ? | **Non — tokens OK, mais 39 fichiers CSS domaine** |
| Est-ce que les vagues précédentes ont fait le **déplacement** complet ? | **Partiellement** (Vague F web seulement) |
| Faut-il tout déplacer **maintenant** avant la beta ? | **Non — plan par vagues G→J** (voir `PLAN-CORRECTION-360-V2.md`) |

---

## 1. Cartographie des trois silos (vision Martin)

Martin décrit **3 bases fonctionnelles**. Voici la réalité code :

```
┌─────────────────────────────────────────────────────────────────┐
│  SILO AUDITEUR (listener)                                       │
│  features/listener/ · app/(listener)/ · packages/api/listener/  │
│  wallet (partagé auditeur+artiste) · identity/auth (commun)     │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  SILO ARTISTE (creator)                                         │
│  features/creator/ · app/(creator)/ · packages/api/creator/     │
│  + catalog, rights, analytics API (PAS sous creator/ — dette)   │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  SILO ADMIN                                                     │
│  features/admin/ · app/(admin)/ · packages/api/admin/           │
│  + LDSE partiellement dans shared/ldse/admin/ (couplage)        │
└─────────────────────────────────────────────────────────────────┘
```

**Conséquence :** un bug auditeur ne casse **plus** l'UI artiste/admin (imports interdits ESLint). Mais un bug **CSS global** ou **packages/api/streaming** peut encore impacter tout le monde.

---

## 2. Déplacement dossiers — état réel

### ✅ Fait (Vague F, juin 2026)

| Action | Preuve |
|---|---|
| `features/streaming/` → `features/listener/` | 0 import `@/features/streaming` |
| `features/catalog|rights|analytics/` → `features/creator/*` | Probes F3–F6 |
| Route groups `(listener)` / `(creator)` / `(admin)` | `apps/web/src/app/` |
| ESLint `no-restricted-imports` listener ↔ creator | 0 violation grep |
| Beat Store canonique → `listener/beats/` | Page `/listen/beats` |
| LDSE fetch admin → `shared/ldse/admin/admin-ldse-fetch.ts` | Plus d'import shared→admin |

### ❌ Pas fait / incomplet

| Problème | Impact si bug | Fichiers clés |
|---|---|---|
| **`packages/api` non aligné** | Bug catalog API touche streaming | `packages/api/src/catalog/`, `streaming/`, `rights/` |
| **`identity/` = 92 fichiers** | Profile OS post-MVP mélangé au MVP | `features/identity/lib/profile*` |
| **`shared/ldse/admin/`** | Logique admin dans shared | `shared/ldse/admin/*` |
| **`marketplace/` shims** | Confusion IA future | 2 fichiers deprecated |
| **`listen-home.css` orphan 2369L** | Dette, risque double-import | `app/styles/listen-home.css` |
| **`wallet/` transversal** | Normal MVP — pas un silo pur | `features/wallet/` |
| **Launch éclaté** | Pas de domaine `features/launch/` | `app/lancement/`, `components/lancement/` |
| **Career OS actif API** | Calculs même si UI gelée partiellement | `packages/api/src/creator/career/` |

---

## 3. Découpage fichiers longs — état réel

### Web TS/TSX (>400 lignes)

**0 fichier** au-dessus de 400 lignes — objectif atteint côté web.

Plus gros restants (à surveiller) :

| Lignes | Fichier |
|---:|---|
| 375 | `admin/components/AdminArtistsClient.tsx` |
| 357 | `admin/lib/buildAdminDashboardView.ts` |
| 356 | `admin/components/AdminRevenueClient.tsx` |
| 352 | `listener/components/FullPlayerPanel.tsx` |
| 345 | `admin/components/AdminWithdrawalsClient.tsx` |

### packages/api (>400 lignes)

| Lignes | Fichier | Action plan |
|---:|---|---|
| 484 | `listener/listener.repository.ts` | Vague H — split read/write |
| 416 | `streaming/playback/playback-engine.handlers.ts` | **LOCKED** — ADR requis |
| 440 | `publication/publication-integration.test.ts` | Test — acceptable |

### CSS (>800 lignes) — **priorité Martin**

| Lignes | Fichier | Statut |
|---:|---|---|
| 2369 | `listen-home.css` | Orphelin — bundle actif mais fichier reste |
| 1354 | `admin.css` | Monolithe |
| 863 | `admin-dashboard-human.css` | Monolithe |
| 694 | `identity.css` | + 6 bundles identity-* |

---

## 4. Global CSS — source unique de vérité

### Ce qui existe ✅

- `apps/web/src/app/globals.css` → bloc `@theme { }` avec **toutes les couleurs officielles**
- Probe `scripts/probe-hex-colors.ts` — 0 hex hardcodé dans `features/`
- Règle Cursor : jamais de `#` dans les composants

### Ce qui manque ❌

| Manque | Conséquence |
|---|---|
| **39 fichiers CSS domaine** | Changer une couleur = éditer tokens + parfois CSS domaine |
| **`rgba()` inline dans 37 fichiers features** | Overlays non centralisés |
| **`listen-future.css` dormant** | Retiré de globals — OK |
| **Pas de script "theme swap"** | Pas de changement marque en 1 commande |

**Verdict Martin :** le global CSS **existe** pour les couleurs, mais ce n'est **pas encore** un changement en un clic pour toute l'app.

---

## 5. Duplications et code mort (non mentionnés dans audit précédent)

| ID | Type | Détail | Priorité |
|---|---|---|---|
| DUP-01 | Domaine orphan | `marketplace/` — 2 shims | Basse |
| DUP-02 | CSS orphan | `listen-home.css` vs bundle | Moyenne |
| DUP-03 | Profile OS | 6 moteurs identity (`profileGoals`, `profileRewards`, `profileStory`, …) | Haute — gel MVP |
| DUP-04 | Career OS | UI partiellement gelée, API encore présente | Moyenne |
| DUP-05 | Admin post-MVP | Awards, Beatstore routes (flags OFF) | OK si guards actifs |
| DUP-06 | Types admin | Partiellement migrés vers `@sonafrik/types` | Basse |
| DUP-07 | `creators` table DB vs `artist_profiles` | Orphelin DB | Doc only MVP |
| DUP-08 | TipButton historique | Vérifier unique source shared/social | Basse |

---

## 6. Risques actifs (registre complet)

### 🔴 Critique (bloquant lancement)

| ID | Risque | Zone |
|---|---|---|
| R-01 | Credentials paiements prod absents | Supabase Secrets |
| R-02 | Orange Money Phase 2 non validée E2E réel | Edge functions |
| R-03 | 0 test E2E retrait réel | wallet/payout |

### 🟡 Haute (avant lancement public)

| ID | Risque | Zone |
|---|---|---|
| R-04 | `packages/api` non isolé par silo | Architecture backend |
| R-05 | CSS monolithes admin + listen orphan | styles/ |
| R-06 | Identity 92 fichiers — surface de bug large | identity/ |
| R-07 | CSP `unsafe-inline` prod | next.config.ts |
| R-08 | Parité mobile ~1:15 | apps/mobile |

### 🟢 Basse (post-beta)

| ID | Risque | Zone |
|---|---|---|
| R-09 | 87+ composants "use client" | Perf |
| R-10 | Tables DB orphelines | Supabase |
| R-11 | Session Engine LOCKED — dette documentée | streaming/session |

---

## 7. Score MVP révisé post-audit V2

| Dimension | Score | Commentaire |
|---|---:|---|
| Isolation web features | 88 | ESLint + 0 cross-import |
| Isolation packages/api | 55 | catalog/streaming/rights plats |
| Découpage fichiers | 70 | Web OK, CSS/API non |
| Global CSS SSOT | 65 | Tokens OK, pas 1-clic |
| Chaîne financière | 50 | Sandbox OK, prod bloqué |
| Gouvernance IA | 60 | CLAUDE.md existe, appliqué inégalement |
| **Global** | **78/100** | +2 vs 26 juin, structure pas finie |

---

## 8. Réponse directe à Martin — ordre des travaux

**Découpage ≠ Déplacement.** Les vagues A→F + 20 problèmes ont surtout :

1. **Corrigé des bugs** et des probes
2. **Découpé partiellement** (playerContext, admin dashboard, listen-home bundle)
3. **Déplacé le web** vers listener/creator/admin (Vague F)

**Ils n'ont PAS :**

1. Réorganisé `packages/api` en silos
2. Fini le découpage CSS
3. Consolidé identity (Profile OS hors MVP)
4. Atteint le "1 clic couleur"

**Ordre recommandé (ne pas inverser) :**

```
Vague G → Hygiène (orphelins, flags, docs)
Vague H → Découpage (CSS + composants 350L+ + listener.repository)
Vague I → Déplacement packages/api (silos backend)
Vague J → Global CSS consolidation (overlays, theme)
```

**Pourquoi pas tout déplacer maintenant ?**  
Un big-bang déplacement sans Vague H finie = risque de casser 134 probes + retard beta. Martin a raison sur l'objectif ; le **timing** doit être par vagues testables.

---

## Références

- Plan d'exécution : [`PLAN-CORRECTION-360-V2.md`](./PLAN-CORRECTION-360-V2.md)
- Journal : [`EXECUTION_LOG.md`](./EXECUTION_LOG.md)
- Gouvernance IA : [`../CLAUDE.md`](../CLAUDE.md)
- Probes : `pnpm probe:certification`
