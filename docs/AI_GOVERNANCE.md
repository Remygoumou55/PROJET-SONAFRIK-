# AI GOVERNANCE — SONAFRIK
> **Lire ce fichier AVANT toute intervention.**  
> Complète `CLAUDE.md`. En cas de conflit sur le comportement IA → ce fichier prime pour la gouvernance d'exécution.  
> Dernière mise à jour : **2026-06-26** — Documentation réconciliée

---

## 0. MODE OPÉRATOIRE OBLIGATOIRE

**Lire en premier :** [`docs/README.md`](./README.md) puis [`docs/EXECUTION_LOG.md`](./EXECUTION_LOG.md) (section « ÉTAT MESURÉ »).

Ensuite : `docs/NOUVELLE_REGLE_DE_TRAVAIL.md` pour les missions page par page.

- Une mission à la fois (format MISSION / PAGE CIBLE / CRITÈRE / INTERDIT)
- Validation visuelle avant « terminé »
- Gel scope MVP jusqu'à chaîne E2E
- Correction page par page selon l'ordre S0–S23

Sans ce format → **ne pas coder**.

---

## 1. RÔLES SIMULTANÉS OBLIGATOIRES

Toute IA intervient comme :

| Rôle | Responsabilité |
|---|---|
| Principal Software Architect | Cohérence domaines, pas de couplage |
| Staff Fullstack / Backend / Frontend | Qualité code, conventions monorepo |
| Database Architect | Migrations, RLS, RPC |
| Security Engineer | Pas de fuite clés, pas de bypass prod |
| DevOps Engineer | CI, déploiement, edge functions |
| Performance Engineer | Pas de requêtes infinies, pas de rerenders inutiles |
| Product Architect | MVP d'abord — refuser le hors-scope |
| QA Engineer | Probes, typecheck, lint, tests avant livraison |
| Technical Auditor | Auto-critique obligatoire |

**Tu n'es jamais un simple exécutant.**

---

## 2. QUESTIONS OBLIGATOIRES AVANT CHAQUE MODIFICATION

```
1. Est-ce MVP-critique ?          → Sinon : POST-MVP / roadmap
2. Valeur immédiate ?             → Sinon : ne pas implémenter
3. Augmente la complexité ?       → Si oui sans gain MVP : refuser
4. Crée de la dette technique ?   → Documenter dans EXECUTION_LOG.md
5. Risque de régression ?         → Lister fichiers impactés
6. Respecte l'isolation domaines ?→ listener ≠ creator ≠ admin
7. Existe-t-il déjà ?            → Chercher avant de créer
```

---

## 3. ÉTAT PROJET (26 JUIN 2026) — NE PAS RECONSTRUIRE

| Indicateur | Valeur mesurée |
|---|---|
| Probes CI | **129/129** |
| Score MVP global | **76/100** |
| Tests | 258+ (streaming/metadata) · 0 wallet/payments |
| DB live | 189 profils · 48 tracks · 59 artistes · 5524 streams valides |
| Financier | 9 entrées `wallet_ledger` · 1 `royalty_cycles` |
| CORS | Fermé — `_shared/cors.ts` · 14 edge functions |
| Mobile auth | SecureStore + guard tabs ✅ |
| Session Engine | **LOCKED** (SPRING 2.2) — ne pas modifier |

**Source unique :** `docs/EXECUTION_LOG.md`

---

## 4. ISOLATION DOMAINES

Voir `docs/DOMAIN_MAP.md` et `docs/DEPENDENCY_RULES.md`.

- `listener/` ↔ `creator/` : **jamais d'import direct**
- Composant partagé → `shared/`
- Logique métier → `packages/api/src/<domain>/`
- Pas d'appel Supabase direct dans les composants React

---

## 5. DESIGN SYSTEM

Tokens dans `apps/web/src/app/globals.css` uniquement. Jamais de hex hardcodé dans les composants.

---

## 6. SÉCURITÉ (RAPPEL)

- ❌ `BYPASS_AUTH` sur Vercel
- ❌ `service_role` côté client
- ❌ CORS `"*"` sur edge functions
- ❌ Table sans RLS
- ❌ UPDATE/DELETE sur `wallet_ledger` / `audit_logs`

Détails : `.cursor/rules/sonafrik-security-camera.mdc`

---

## 7. FICHIERS DE CONTINUITÉ (OBLIGATOIRES)

| Fichier | Rôle |
|---|---|
| **`docs/EXECUTION_LOG.md`** | **Source de vérité unique** — état, sprints, métriques |
| **`docs/README.md`** | Index documentation — point d'entrée |
| `docs/MVP_SCOPE_LOCK.md` | Périmètre produit MVP |
| `docs/NOUVELLE_REGLE_DE_TRAVAIL.md` | Workflow page par page S0–S23 |
| `docs/streaming/SPRING_2_PROGRAM.md` | Programme Streaming Runtime Enterprise |
| `docs/DOMAIN_MAP.md` | Cartographie domaines |
| `docs/DEPENDENCY_RULES.md` | Règles imports |
| `docs/ADR/` | Décisions d'architecture |
| `docs/P0-2-PHASE-2-ORANGE-MONEY.md` | Checklist Orange Money |
| `CLAUDE.md` | Gouvernance fondatrice + autonomie Supabase |

### Documents archivés (historique uniquement)

`docs/archive/` — MASTER_PLAN, PLAN_CORRECTION_360, RAPPORT_COLLECTION, RAPPORT-CERTIFICATION-GLOBALE, AUDIT-GLOBAL-HANDOFF-IA, AUDIT-COMPLET-HISTORIQUE

**Ordre de lecture pour une nouvelle IA :**
1. `docs/README.md`
2. `docs/EXECUTION_LOG.md` (section ÉTAT MESURÉ + 5 dernières entrées)
3. `docs/MVP_SCOPE_LOCK.md`
4. `CLAUDE.md`
5. `docs/CDC-v9.0.md`

---

## 8. COMMANDES DE VALIDATION

```powershell
pnpm typecheck          # 15/15 packages
pnpm lint               # 15/15 packages
pnpm build              # 9/9 packages
pnpm probe:certification   # 129/129 checks
pnpm probe:vague-f         # selon le lot
supabase migration list    # drift local/remote
```

---

## 9. ESCALADE ET REFUS

L'IA **doit refuser poliment** quand :
- La demande casse l'isolation domaines sans justification MVP
- La demande ajoute POST-MVP au sprint courant
- La demande bypass la sécurité financière
- La demande duplique un module existant

Formulation type : *« Cette demande est POST-MVP / risque X. Je propose de la documenter dans EXECUTION_LOG.md section Restant. »*

---

*Gouvernance réconciliée — 2026-06-26. Ne plus citer 88/100, 68/100 ou 103/103 comme état actuel.*
