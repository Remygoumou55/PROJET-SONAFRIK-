# AI GOVERNANCE — SONAFRIK
> **Lire ce fichier AVANT toute intervention.**  
> Complète `CLAUDE.md`. En cas de conflit sur le comportement IA → ce fichier prime pour la gouvernance d'exécution.  
> Dernière mise à jour : 2026-06-24 — Audit forensique 360°

---

## 0. MODE OPÉRATOIRE OBLIGATOIRE

**Lire en premier :** `docs/NOUVELLE_REGLE_DE_TRAVAIL.md`

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

**Si une réponse n'est pas clairement positive → NE PAS IMPLÉMENTER.**

---

## 3. CHAÎNE MVP UNIQUE (SOURCE DE VÉRITÉ PRODUIT)

Le MVP n'est terminé que lorsque cette chaîne fonctionne **de bout en bout** :

```
Compte → Profil Artiste → Album → Cover → Audio → Publication
  → Écoutes → Royalties → Revenus → Retraits
```

Toute feature hors de cette chaîne = **POST-MVP** sauf décision explicite de Rémy.

---

## 4. INTERDICTIONS ABSOLUES

- Fonctionnalités gadgets
- Suringénierie / abstractions prématurées
- Couches ou modules non nécessaires au MVP
- Hex hardcodés dans les composants (tokens `globals.css` uniquement)
- Appels Supabase directs dans les composants (passer par `packages/api`)
- Tables sans RLS
- `service_role` côté client
- Dire « oui oui » sans analyse d'impact

---

## 5. PROCESSUS AVANT CODE

### Impact Analysis
- Lister fichiers touchés + domaines (listener / creator / admin / wallet / identity)
- Vérifier imports croisés interdits

### Dependency Analysis
- `packages/types` → source unique des types
- `packages/api` → source unique logique métier
- `globals.css` → source unique visuelle

### Regression Analysis
- `pnpm typecheck && pnpm lint && pnpm build`
- Probes pertinents : `pnpm probe:vague-{a..e}` ou `pnpm probe:certification`

### Security Analysis
- RLS intacte ?
- Route protégée ?
- Pas de clé exposée ?

### Performance Analysis
- Pas de `useEffect` sans deps stables
- Pas de N+1 SSR
- Timeouts sur fetch Supabase (pattern existant : 8s)

---

## 6. PROCESSUS APRÈS CODE (AUTO-CRITIQUE)

```
□ Tokens CSS utilisés (pas de hex)
□ Bon domaine / dossier
□ Pas de duplication
□ Types depuis packages/types
□ Pas d'import cross-domaine interdit
□ Maintenable dans 6 mois
□ Pas de complexité inutile
□ Entrée ajoutée dans docs/EXECUTION_LOG.md
□ MASTER_PLAN.md mis à jour si vague/lot avancé
```

**Question finale :** *Si j'étais l'auditeur de mon propre travail, j'approuverais ?*  
Si **NON** → recommencer.

---

## 7. ARCHITECTURE CIBLE (DOMAIN DRIVEN)

```
apps/web/src/features/
├── listener/          ← ex-streaming : player, library, search, homepage
├── creator/           ← catalog, rights, analytics, team, labels
├── admin/             ← back-office
├── wallet/            ← wallet, paiements, royalties UI
├── identity/          ← profil, settings, sessions
├── auth/              ← connexion, inscription
├── shared/            ← social, notifications, tips (cross-domain OK)
└── marketplace/       ← POST-MVP (beat store) — isolé
```

**Règle :** `listener/` n'importe jamais `creator/` directement.  
Pont autorisé : `shared/`, `packages/api`, `packages/types`, `packages/ui`.

---

## 8. DESIGN SYSTEM — GLOBAL SCS

| Élément | Source unique | Fichier |
|---|---|---|
| Couleurs | `@theme` Tailwind v4 | `apps/web/src/app/globals.css` |
| Typographie | `--font-sans` | idem |
| Radius / shadows | tokens CSS | idem |
| Composants UI | `@sonafrik/ui` | `packages/ui/src/` |

**Interdit :** hex dans TSX, SCSS parallèle, tokens dupliqués.

**Futur Lot F5 :** documenter mapping token → usage + audit automatisé hex.

---

## 9. FICHIERS DE CONTINUITÉ (OBLIGATOIRES)

| Fichier | Rôle |
|---|---|
| `docs/MASTER_PLAN.md` | Audit + roadmap + vagues + lots + fichiers à toucher |
| `docs/streaming/SPRING_2_PROGRAM.md` | Programme Streaming Runtime Enterprise (SPRING 2) |
| `docs/DOMAIN_MAP.md` | Cartographie domaines code |
| `docs/DEPENDENCY_RULES.md` | Règles imports et couplage |
| `docs/ADR/` | Décisions d'architecture streaming et transverses |
| `docs/AI_GOVERNANCE.md` | Ce fichier — comportement IA |
| `docs/EXECUTION_LOG.md` | Journal chronologique interventions |
| `docs/RAPPORT_COLLECTION.md` | Historique détaillé (legacy — maintenir) |
| `CLAUDE.md` | Gouvernance fondatrice + autonomie Supabase |

**Ordre de lecture pour une nouvelle IA :**
1. `AI_GOVERNANCE.md`
2. `MASTER_PLAN.md`
3. `EXECUTION_LOG.md` (5 dernières entrées)
4. `CLAUDE.md`
5. `docs/CDC-v9.0.md`

---

## 10. COMMANDES DE VALIDATION

```powershell
pnpm typecheck          # 12/12 packages
pnpm lint               # 12/12 packages
pnpm --filter @sonafrik/web build
pnpm probe:certification   # 103 checks A→E
pnpm probe:vague-a         # … e selon le lot
supabase migration list    # drift local/remote
```

---

## 11. ESCALADE ET REFUS

L'IA **doit refuser poliment** quand :
- La demande casse l'isolation domaines sans justification MVP
- La demande ajoute POST-MVP au sprint courant
- La demande bypass la sécurité financière (Vague A)
- La demande duplique un module existant

Formulation type : *« Cette demande est POST-MVP / risque X. Je propose de la mettre en Lot G.x dans MASTER_PLAN.md. »*

---

*Gouvernance établie lors de l'audit forensique 360° — 2026-06-24.*
