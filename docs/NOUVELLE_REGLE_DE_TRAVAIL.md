# NOUVELLE RÈGLE DE TRAVAIL — SONAFRIK

> **Document obligatoire pour toute IA et tout développeur**  
> **Version :** 1.3 · **Date :** 2026-06-24  
> **Validé par :** Rémy Goumou  
> **Statut :** 🔒 ACTIF — prime sur toute demande ad hoc non formatée

---

## Hiérarchie documentaire (mise à jour)

| Priorité | Document | Rôle |
|---|---|---|
| **0** | **`NOUVELLE_REGLE_DE_TRAVAIL.md`** (ce fichier) | **Mode opératoire — une mission, une page, validation visuelle** |
| 1 | `MVP_SCOPE_LOCK.md` | Périmètre produit IN / OUT |
| 2 | `docs/CDC-v9.0.md` | Spec produit fondatrice |
| 3 | `AI_GOVERNANCE.md` | Comportement IA |
| 4 | `MASTER_PLAN.md` | Audit technique + plan d'exécution |
| 5 | `EXECUTION_LOG.md` | Journal des interventions |
| 6 | `CLAUDE.md` | Gouvernance fondatrice |

**Règle :** sans format de mission (section A), **refuser d'implémenter** et demander le brief complet.

---

## A. Une seule mission à la fois

Chaque intervention doit commencer par ce bloc — **copié-collé obligatoire** :

```
MISSION : [une phrase]
PAGE CIBLE : http://localhost:3000/...
CRITÈRE DE SUCCÈS : [ce que Rémy doit voir à l'écran]
INTERDIT : ne pas toucher [fichiers/domaines]
```

### Exemple valide

```
MISSION : Faire marcher /listen avec du contenu visible pour un utilisateur connecté.
PAGE CIBLE : http://localhost:3000/listen
CRITÈRE DE SUCCÈS : Au moins 3 sections avec texte et cartes ; pas de page blanche/noire.
INTERDIT : admin, wallet, refacto CSS global, autres routes
```

### Règles

- **1 mission = 1 page** (ou 1 flux E2E documenté dans la mission).
- Pas de « nettoyage global », pas de refacto hors page cible.
- Pas de nouvelle feature hors chaîne MVP (`MVP_SCOPE_LOCK.md`).
- Si la mission est floue → **poser la question**, ne pas deviner.

---

## B. Validation visuelle avant « terminé »

**Interdit de déclarer terminé** sur la seule base de `pnpm build`.

### Livrable obligatoire (dans le chat + entrée `EXECUTION_LOG.md`)

| # | Élément | Détail |
|---|---|---|
| 1 | **Description visuelle** | Ce qui s'affiche à l'écran (sections, textes, boutons, erreurs) |
| 2 | **URL testée** | URL exacte, ex. `http://localhost:3000/listen` |
| 3 | **Build** | `pnpm build && pnpm lint && pnpm typecheck` → 0 erreur |
| 4 | **Scénario manuel 2 min** | Étapes que Rémy peut refaire seul pour valider ou refuser |

### Format du scénario manuel

```markdown
1. Ouvrir http://localhost:3000/...
2. Se connecter avec [compte]
3. Vérifier que [élément visible]
4. Résultat attendu : [description]
```

**Rémy valide ou refuse.** Pas de commit/push sauf demande explicite.

**L'IA exécute tout en fin de tâche** — voir section **F**. Rémy reçoit **uniquement le lien + la checklist**.

---

## F. Fin de travail — exécution IA obligatoire (livrable Rémy)

À **chaque fin de tâche** (fin de prompt), l'IA **exécute elle-même** tout le pipeline de **normalisation** avant de donner le lien de contrôle. Rémy ne lance rien.

**Principe :** pas de lien tant que l'app n'est pas **normalisée, ordonnée et vérifiée**. Évite les répétitions (écran noir, CSS absent, export manquant, `.next` corrompu).

### Pipeline obligatoire (dans l'ordre — tout exécuter)

```powershell
# 1. Rebuild packages touchés (si types / api / shared modifiés)
cd "e:\PROJET SONAFRIK"
pnpm build

# 2. Validation technique complète
pnpm lint
pnpm typecheck

# 3. Serveur dev PROPRE (apps/web — jamais la racine)
$p = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }
if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
cd "e:\PROJET SONAFRIK\apps\web"
pnpm dev:clean

# 4. Attendre "Ready" puis probe HTTP + contenu + CSS sur la page cible
# Exemple /creator :
#   - Status 200
#   - HTML contient les classes/composants attendus (ex. creator-hero)
#   - Pas d'erreur "Attempted import error" dans le terminal dev
#   - Lien stylesheet Next.js présent (pas Times New Roman / liens violets)
```

| Étape | Qui | Action |
|---|---|---|
| Rebuild monorepo | **IA** | `pnpm build` — packages `dist/` à jour |
| Lint + typecheck | **IA** | 0 erreur avant dev |
| `pnpm dev:clean` | **IA** | Toujours après un `pnpm build` ou changement `@sonafrik/*` |
| Probe page cible | **IA** | HTTP 200 + contenu métier + CSS (pas squelette HTML seul) |
| Logs terminal dev | **IA** | 0 `TypeError`, 0 `Attempted import error` |
| Lien de contrôle | **IA** | **Uniquement après** les étapes ci-dessus |

### Normalisation obligatoire avant lien

| Check | Échec typique | Action IA |
|---|---|---|
| Export API / shared | `is not a function` / `Attempted import error` | Rebuild package + retirer export du barrel optimizer si besoin + `dev:clean` |
| CSS absent | Times, liens violets, pas de fond #0D0D0D | `dev:clean`, vérifier `globals.css` chargé |
| Page vide | Layout seul, pas de `{children}` | Corriger crash RSC (logs terminal) |
| `.next` corrompu | ENOENT webpack cache | `pnpm dev:clean` |

### Ce que Rémy reçoit (et rien d'autre)

Le message de fin doit contenir **uniquement** :

1. **Le lien** à ouvrir (URL de la page cible de la mission)
2. **La checklist de contrôle** (cases à cocher visuelles)

**Interdit dans le message de fin :**
- Long rapport technique
- Liste de fichiers modifiés (sauf si Rémy demande)
- Demander à Rémy de lancer `pnpm dev` ou `dev:clean` lui-même
- Donner un lien **avant** d'avoir exécuté tout le pipeline ci-dessus
- Ouvrir 41 onglets

### Format livrable fin de tâche

```markdown
## Lien
http://localhost:3000/...

## Checklist de contrôle
- [ ] Page s'ouvre (pas blanc / noir / erreur)
- [ ] Fond sombre #0D0D0D visible
- [ ] Typo Montserrat (pas Arial/Times)
- [ ] [critère spécifique à la mission]
- [ ] [critère spécifique à la mission]

→ Coche et réponds **OK** ou **KO** (+ capture si KO).
```

### Exemple — fin de S0

```markdown
## Lien
http://localhost:3000/

## Checklist de contrôle
- [ ] Landing SONAFRIK visible (titre, nav, hero)
- [ ] Fond très sombre avec halos verts/dorés discrets
- [ ] Texte en Montserrat
- [ ] Pas de page blanche ni erreur console

→ OK ou KO ?
```

---

## G. Après validation Rémy — rappel page suivante

Quand Rémy dit **« tout est bon »**, **« OK »**, ou valide la checklist → l'IA **doit immédiatement** annoncer la **page suivante** dans l'ordre strict ci-dessous.

**Ne pas** attendre une nouvelle demande. **Ne pas** proposer d'autre page.

### Format obligatoire après chaque OK

```markdown
✅ [Sx] validé.

## Prochaine page — [S#] [Étape]
http://localhost:3000/...

## Checklist de contrôle
- [ ] ...
- [ ] ...

→ Contrôle cette page et dis **OK** ou **KO**.
```

Puis l'IA exécute le pipeline **F** (build, dev, ouverture navigateur) sur la **nouvelle URL**.

### Ordre strict S0 → S22 (ne jamais sauter)

| # | Étape | URL |
|---|---|---|
| **S0** | Environnement | http://localhost:3000 |
| **1** | Compte — connexion & inscription (OTP unique) | http://localhost:3000/auth/connexion |
| **2** | Onboarding rôle | http://localhost:3000/onboarding/role |
| **3** | Onboarding artiste | http://localhost:3000/onboarding/artist |
| **4** | Profil | http://localhost:3000/profile |
| **5** | Paramètres compte | http://localhost:3000/settings/account |
| **6** | Sessions | http://localhost:3000/settings/sessions |
| **7** | Préférences | http://localhost:3000/settings/preferences |
| **8** | Identité artiste | http://localhost:3000/creator/identity |
| **9** | Vérification | http://localhost:3000/creator/verification |
| **10** | Catalogue | http://localhost:3000/creator/catalog |
| **11** | Albums | http://localhost:3000/creator/catalog/releases |
| **12** | Morceaux | http://localhost:3000/creator/catalog/tracks |
| **13** | Publication admin | http://localhost:3000/admin/catalog |
| **14** | Écoute | http://localhost:3000/listen |
| **15** | Album public | http://localhost:3000/listen/album/[id] |
| **16** | Artiste public | http://localhost:3000/listen/artist/[id] |
| **17** | Bibliothèque | http://localhost:3000/library |
| **18** | Recherche | http://localhost:3000/search |
| **19** | Analytics | http://localhost:3000/creator/analytics |
| **20** | Royalties | http://localhost:3000/wallet/royalties |
| **21** | Wallet | http://localhost:3000/wallet |
| **22** | Retraits | http://localhost:3000/wallet/payout |

> `/auth/inscription` redirige automatiquement vers `/auth/connexion` (même flux OTP).

### Si Rémy dit KO

- Corriger **uniquement** la page en cours (pas la suivante).
- Re-livrer lien + checklist (section F).
- Ne passer à S#+1 **qu'après** OK explicite.

### Page en cours

| Champ | Valeur |
|---|---|
| **Actuelle** | **S3** — Onboarding artiste |
| **Après OK S3** | **S4** — Profil → http://localhost:3000/profile |

*(Mettre à jour cette ligne dans `EXECUTION_LOG.md` à chaque validation OK.)*

---

### Chaîne bloquante (source de vérité)

```
Compte → Profil Artiste → Album → Cover → Audio → Publication
  → Écoutes → Royalties → Revenus → Retraits
```

### État actuel (2026-06-24)

| Étape | Statut |
|---|---|
| Compte → Publication | ✅ |
| Écoutes | ✅ |
| Royalties | ❌ UI ComingSoon — **BLOQUANT** |
| Revenus | ⚠️ Partiel — **BLOQUANT** |
| Retraits | ⚠️ Gated — **BLOQUANT** |

### Gelé jusqu'à fin chaîne E2E

- Nettoyage global, refacto CSS 39 fichiers hex
- Nouvelles features POST-MVP (Beat Store, Awards, ML, landing compteur, etc.)
- Mobile parité, admin fraud/flags avancés
- Toute route hors liste « Ordre de correction MVP » ci-dessous

**Exception :** bug bloquant sur la page en cours de correction.

---

## D. Recette locale unique (ne plus changer)

```powershell
# Terminal 1 — Supabase (dev local uniquement)
cd "e:\PROJET SONAFRIK"
supabase start

# Terminal 2 — Web UNIQUEMENT (jamais pnpm dev à la racine)
cd "e:\PROJET SONAFRIK\apps\web"
pnpm dev
```

| Paramètre | Valeur |
|---|---|
| **URL app** | http://localhost:3000 |
| **Port interdit** | 3003 (obsolète — ne plus documenter) |
| **Supabase Studio** | http://127.0.0.1:54323 |
| **Compte dev** | `dev@sonafrik.local` / `DevSonafrik2026!` (voir `DEV_LOGIN.md`) |

**Avant d'ouvrir des liens :** vérifier que le serveur répond (`Invoke-WebRequest http://localhost:3000` ou navigateur).

---

## E. Signalement page cassée (format Rémy)

Quand une page ne marche pas, Rémy envoie **uniquement** :

1. **URL exacte**
2. **Ce qu'il voit** (blanc / noir / erreur / redirect / sans style)
3. **Capture d'écran** si possible

L'IA corrige **cette page uniquement**. Pas de mélange avec d'autres domaines.

---

## Ordre de correction MVP — page par page

Correction **séquentielle**. Ne pas passer à l'étape N+1 tant que N n'est pas **validée par Rémy**.

Légende statut initial :

- ✅ = déjà opérationnel (re-validation visuelle quand même)
- ❌ = bloquant / ComingSoon / cassé connu
- ⚠️ = partiel

| # | Étape chaîne | URL | Statut initial | Critère de succès (Rémy valide) |
|---|---|---|---|---|
| **S0** | Environnement | http://localhost:3000 | — | Page s'ouvre, styles visibles (fond sombre, typo Montserrat) |
| **1** | Compte — connexion & inscription (OTP unique) | http://localhost:3000/auth/connexion | ✅ | Téléphone + CGU + OTP, nouveau ou déjà inscrit |
| **2** | Onboarding rôle | http://localhost:3000/onboarding/role | ✅ | Choix auditeur/artiste visible et cliquable |
| **3** | Onboarding artiste | http://localhost:3000/onboarding/artist | ✅ | Formulaire profil, fin onboarding sans crash |
| **4** | Profil | http://localhost:3000/profile | ✅ | Nom, avatar, infos visibles |
| **5** | Paramètres compte | http://localhost:3000/settings/account | ✅ | Email, infos compte affichés |
| **6** | Sessions | http://localhost:3000/settings/sessions | ✅ | Liste sessions ou état vide cohérent |
| **7** | Préférences | http://localhost:3000/settings/preferences | ✅ | Options modifiables ou affichage stable |
| **8** | Profil artiste | http://localhost:3000/creator/identity | ✅ | Stage name, bio, genres éditables |
| **9** | Vérification artiste | http://localhost:3000/creator/verification | ✅ | Workflow soumission sans page blanche |
| **10** | Catalogue hub | http://localhost:3000/creator/catalog | ✅ | Navigation vers albums/tracks |
| **11** | Albums / releases | http://localhost:3000/creator/catalog/releases | ✅ | Créer album, upload cover |
| **12** | Morceaux | http://localhost:3000/creator/catalog/tracks | ✅ | Upload audio, métadonnées |
| **13** | Publication (admin) | http://localhost:3000/admin/catalog | ✅ | Revue pending → approuver/rejeter |
| **14** | Écoute accueil | http://localhost:3000/listen | ✅ | ≥3 sections, cartes, contenu DB |
| **15** | Album public | http://localhost:3000/listen/album/[id] | ✅ | Tracklist + bouton lecture |
| **16** | Artiste public | http://localhost:3000/listen/artist/[id] | ✅ | Discographie visible |
| **17** | Bibliothèque | http://localhost:3000/library | ✅ | Favoris/playlists ou état vide cohérent |
| **18** | Recherche | http://localhost:3000/search | ✅ | Résultats sur requête test |
| **19** | Revenus — analytics | http://localhost:3000/creator/analytics | ⚠️ | Stats écoutes visibles pour artiste |
| **20** | Royalties | http://localhost:3000/wallet/royalties | ❌ | Montants royalties (pas ComingSoon) |
| **21** | Wallet / revenus | http://localhost:3000/wallet | ⚠️ | Solde GNF + historique cohérent |
| **22** | Retraits | http://localhost:3000/wallet/payout | ⚠️ | Demande retrait sandbox initiée |

### Pages MVP hors parcours séquentiel (gelées sauf bug)

Ces routes existent mais **ne sont pas corrigées** tant que S0–S22 ne sont pas validés :

- `/`, `/lancement` — marketing gelé
- `/listen/beats` — POST-MVP
- `/admin/*` sauf `/admin/catalog` — gelé
- `/creator/rights`, `/creator/labels`, `/creator/team` — POST-MVP
- Mobile Expo — gelé (web first)

---

## Workflow IA par session

```
1. Lire ce fichier + MVP_SCOPE_LOCK.md
2. Attendre le brief format A (ou proposer la prochaine étape S#)
3. Corriger UNIQUEMENT la page cible
4. Exécuter pipeline section F COMPLET (build → lint → typecheck → dev:clean → probe)
5. Normaliser l'app (exports, CSS, contenu page) — corriger si probe KO
6. Livrer à Rémy : lien + checklist uniquement
7. Attendre validation Rémy (OK/KO)
8. Si OK → section G (rappel page suivante) + `EXECUTION_LOG.md`
9. Si KO → corriger même page, re-exécuter pipeline F entier, ne pas toucher ailleurs
```

---

## Anti-patterns interdits (sessions précédentes)

| ❌ Interdit | ✅ À la place |
|---|---|
| Ouvrir 41 onglets sans serveur | Vérifier `pnpm dev` avant tout lien |
| `pnpm dev` à la racine (web+mobile) | `cd apps/web && pnpm dev` |
| « Build OK = terminé » | Validation visuelle format B |
| Nettoyage global multi-fichiers | Une page, un diff |
| Port 3003 | Port 3000 uniquement |
| Toucher admin/wallet pendant /listen | Respecter champ INTERDIT |

---

## Prochaine action

**Page en cours : S0** — http://localhost:3000/

Rémy contrôle → **OK** ou **KO** (+ capture si KO).

---

*Document créé le 2026-06-24 — mode opératoire officiel SONAFRIK.*
