# MVP SCOPE LOCK — SONAFRIK

> **Document officiel de verrouillage du périmètre MVP**  
> **Version :** 1.0 · **Date :** 2026-06-24  
> **Statut :** 🔒 VERROUILLÉ — toute dérive hors scope est interdite sans validation explicite de Rémy Goumou

---

## Hiérarchie documentaire

| Priorité | Document | Rôle |
|---|---|---|
| 1 | **`MVP_SCOPE_LOCK.md`** (ce fichier) | **Périmètre produit — ce qui est IN / OUT** |
| 2 | `docs/CDC-v9.0.md` | Spec produit fondatrice |
| 3 | `docs/AI_GOVERNANCE.md` | Comportement IA |
| 4 | `docs/MASTER_PLAN.md` | Audit technique + plan d'exécution |
| 5 | `docs/EXECUTION_LOG.md` | Journal des interventions |
| 6 | `CLAUDE.md` | Gouvernance fondatrice |

**Règle :** en cas de conflit entre une demande ad hoc et ce document → **ce document gagne**.

---

## Vision Produit

**SONAFRIK** est un **Music Operating System Africain**.

Ce n'est **pas** un clone de Spotify.

L'objectif est de construire **l'infrastructure de l'industrie musicale africaine** :

- permettre à un artiste guinéen (puis africain) de **publier**, **être écouté**, **être rémunéré** et **retirer ses revenus** ;
- garantir une **chaîne financière traçable** (écoute → royalties → wallet → retrait) ;
- poser les fondations (identity, catalog, streaming, wallet) avant toute expansion (marketplace, social, awards).

**Slogan :** NOTRE BIEN COMMUN  
**Revenue Pool artistes (CDC Règle #3) :** 65 % exact  
**Lancement public (CDC Règle #7) :** 2 000 abonnés payants minimum — **post-MVP technique**

---

## Chaîne MVP Unique

**Source de vérité absolue.** Le MVP n'est terminé que lorsque cette chaîne fonctionne **de bout en bout**, en conditions réelles (staging puis prod).

```
Compte
  ↓
Profil Artiste
  ↓
Album
  ↓
Cover
  ↓
Audio
  ↓
Publication
  ↓
Écoutes
  ↓
Royalties
  ↓
Revenus
  ↓
Retraits
```

### Règle de verrouillage

| Règle | Détail |
|---|---|
| **R1** | Aucune feature ne peut être ajoutée si elle ne sert pas directement cette chaîne |
| **R2** | Toute feature existante hors chaîne est **gelée** jusqu'à complétion MVP Core |
| **R3** | Le MVP est **incomplet** tant qu'une étape de la chaîne ne fonctionne pas en E2E |
| **R4** | L'audit technique (103/103 probes) **ne remplace pas** la validation de cette chaîne |

### État actuel (2026-06-24)

| Étape | Statut | Bloquant lancement |
|---|---|---|
| Compte | ✅ Opérationnel | Non |
| Profil Artiste | ✅ Opérationnel | Non |
| Album / Cover / Audio | ✅ Opérationnel | Non |
| Publication | ✅ Opérationnel | Non |
| Écoutes | ✅ Real Listen V7.2 | Non |
| Royalties | ❌ UI ComingSoon | **OUI** |
| Revenus | ⚠️ Analytics partiel | **OUI** |
| Retraits | ⚠️ Code prêt, flag + credentials | **OUI** |

---

## MVP CORE

Fonctionnalités **absolument indispensables** au lancement. Rien d'autre ne doit être développé en priorité.

---

### Identity

| Champ | Détail |
|---|---|
| **Description** | Inscription, connexion, onboarding auditeur/artiste, profil de base, sessions, préférences essentielles |
| **Périmètre IN** | `/auth/*`, `/onboarding/*`, `/profile`, `/settings/account`, `/settings/sessions`, `/settings/preferences` |
| **Pourquoi MVP** | Sans compte authentifié, aucune étape de la chaîne n'est possible |
| **Dépendances** | Supabase Auth, `profiles`, RLS identity, middleware |

**Hors périmètre MVP Core :** suppression compte avancée, OAuth multiples, 2FA, profils publics enrichis.

---

### Artist Profile

| Champ | Détail |
|---|---|
| **Description** | Création profil créateur, identité artiste (stage name, genres, bio), vérification basique |
| **Périmètre IN** | `/creator/identity`, `/creator/verification`, `creators`, `artist_profiles` |
| **Pourquoi MVP** | L'artiste doit exister en tant qu'entité avant de publier |
| **Dépendances** | Identity, Creator OS tables, `requireCreator` guard |

**Hors périmètre MVP Core :** labels enterprise, studios, team multi-rôles avancé, gestion label complexe.

---

### Catalog

| Champ | Détail |
|---|---|
| **Description** | Création album, upload cover, upload audio, métadonnées track, crédits basiques |
| **Périmètre IN** | `/creator/catalog/*`, `albums`, `tracks`, `track_files`, signed URLs storage |
| **Pourquoi MVP** | Contenu musical = prérequis de toute écoute et royalty |
| **Dépendances** | Artist Profile, buckets `catalog-audio` / `covers`, `packages/api/catalog` |

**Hors périmètre MVP Core :** crédits collaboratifs avancés, multi-format, stems, versioning fichiers.

---

### Publication

| Champ | Détail |
|---|---|
| **Description** | Workflow draft → review → published ; visibilité publique des albums/tracks |
| **Périmètre IN** | Statuts publication catalog, admin review basique si nécessaire |
| **Pourquoi MVP** | Un album non publié n'est pas écoutable → chaîne coupée |
| **Dépendances** | Catalog, admin catalog review (minimal) |

**Hors périmètre MVP Core :** workflow multi-approbateurs, scheduling release, pre-save campaigns.

---

### Streaming

| Champ | Détail |
|---|---|
| **Description** | Écoute album/track, player web, Real Listen V7.2 (≥90 % serveur), bibliothèque, recherche basique |
| **Périmètre IN** | `/listen`, `/listen/album/[id]`, `/listen/artist/[id]`, `/library`, `/search`, edge `stream-*` |
| **Pourquoi MVP** | Sans écoute validée, pas de royalties |
| **Dépendances** | Publication, `stream_sessions`, `stream_events`, player context |

**Hors périmètre MVP Core :** discovery IA, recommandations enterprise, offline mode, lyrics, podcasts, radio.

---

### Analytics

| Champ | Détail |
|---|---|
| **Description** | Statistiques créateur minimales : écoutes, top tracks, tendances basiques |
| **Périmètre IN** | `/creator/analytics` — dashboard essentiel |
| **Pourquoi MVP** | L'artiste doit **voir** que ses écoutes génèrent de l'activité avant royalties/revenus |
| **Dépendances** | Streaming (stream_events), RPC analytics basiques |

**Hors périmètre MVP Core :** analytics enterprise, heatmaps, cohortes, export BI, comparaisons marché.

---

### Royalties

| Champ | Détail |
|---|---|
| **Description** | Calcul et affichage des royalties créateur issus des écoutes validées (Revenue Pool 65 %) |
| **Périmètre IN** | `/wallet/royalties`, `royalty_cycles`, `royalty_calculations`, RPC royalty engine |
| **Pourquoi MVP** | Étape obligatoire de la chaîne — l'artiste doit voir **ce qu'il gagne** |
| **Dépendances** | Streaming (Real Listen), wallet backend, royalty engine SQL |

**État actuel :** backend présent, **UI ComingSoon** → **BLOQUANT MVP**.

---

### Revenus

| Champ | Détail |
|---|---|
| **Description** | Consolidation revenus créateur : solde wallet, historique crédits, royalties cumulées |
| **Périmètre IN** | `/wallet`, `wallets`, `wallet_ledger`, `transactions`, dashboard revenus créateur |
| **Pourquoi MVP** | L'artiste doit voir son **argent disponible** avant de retirer |
| **Dépendances** | Royalties, wallet OS, formatGnf unifié |

**Hors périmètre MVP Core :** multi-devises, fiscalité, factures PDF, split revenus multi-contributeurs.

---

### Retraits

| Champ | Détail |
|---|---|
| **Description** | Demande de retrait vers Mobile Money (Orange, MTN, Wave, Soutra), compte payout, validation |
| **Périmètre IN** | `/wallet/payout`, `withdrawals`, `payout_accounts`, edge `wallet-request-withdrawal`, `payment-initiate` |
| **Pourquoi MVP** | **Dernière étape** — sans retrait, la promesse produit n'est pas tenue |
| **Dépendances** | Revenus (solde suffisant), paiements activés, credentials opérateurs, webhooks |

**État actuel :** code prêt, **gated** par `NEXT_PUBLIC_PAYMENTS_ENABLED` + credentials prod → **BLOQUANT MVP**.

---

## MVP PLUS

Fonctionnalités **utiles mais non bloquantes** pour le lancement de la chaîne MVP. Peuvent être livrées **après** MVP Core E2E, **avant** lancement public 2 000 abonnés.

| Feature | Description | Valeur | Pourquoi non bloquant |
|---|---|---|---|
| **Notifications** | Cloche, liste, mark-as-read | Engagement utilisateur | La chaîne MVP fonctionne sans |
| **Social — Likes** | Like track/album | Engagement | Favorites suffisent pour MVP |
| **Social — Follows** | Suivre un artiste | Découverte | Non requis pour publier/écouter/payer |
| **Historique wallet avancé** | Filtres, export | Confort créateur | Historique basique suffit |
| **Dashboard admin enrichi** | Stats, fraud basique | Ops internes | Admin minimal suffit pour modération |
| **Admin catalog/rights review** | Validation contenu | Qualité catalogue | Workflow publication basique OK |
| **Profils publics étendus** | Bio, liens, stats publiques | Image artiste | Profil basique suffit |
| **Pourboires (Tips)** | Tip artiste 5 % commission | Revenu additionnel | CDC Règle #5 — **plus**, pas chaîne |
| **Onboarding listener enrichi** | Steps localisation, langue | UX auditeur | Écoute possible sans |
| **Search V1 enrichie** | Multi-type, filtres | Découverte | Search basique suffit |
| **Mobile app parité** | Expo player | Reach mobile | **Web first** pour MVP Core |

---

## POST-MVP

Fonctionnalités **explicitement interdites** avant validation de la chaîne MVP Core E2E. Toute IA **doit refuser** leur implémentation ou extension.

| Feature | Description | Raison du report |
|---|---|---|
| **Beat Store** | Marketplace beats, `beats`, `beat_purchases` | CDC hors MVP — commission 0 GNF = post-lancement |
| **Marketplace général** | Vente assets, merch | Complexité commerciale, hors chaîne artiste-album-écoute |
| **Social Network** | Fil social, commentaires, partages viraux | Distraction produit, non requis chaîne MVP |
| **SONAFRIK Awards** | Cérémonie, votes, gamification | Marketing événementiel — post-lancement public |
| **Gamification** | Badges, points, streaks | Gadget — zero valeur chaîne MVP |
| **IA avancée** | AI Music Coach, recommandations ML | Suringénierie — discovery basique suffit post-MVP |
| **Discovery Enterprise** | Moteur reco SQL 445L+, scoring complexe | Déjà en DB — **gelé**, pas d'UI avant MVP |
| **Subscription MM (G-5)** | Abonnements Mobile Money récurrents | Post top-up + retraits stables |
| **Rights OS complet** | Contracts, ownership versions, litigation | Infrastructure légale avancée — post-MVP |
| **Labels Enterprise** | Multi-label, royalties split complexe | Complexité organisationnelle |
| **Studios module** | Gestion studios | Table existante, **aucune UI MVP** — gelé |
| **Fan Tribes** | Communautés fans | Social avancé — post-MVP |
| **Podcasts** | Contenu non-musical | Hors scope Music OS MVP |
| **Landing compteur 2 000** | `/lancement`, compteur abonnés | **Marketing pré-lancement** — pas chaîne MVP |
| **Premium Jour 1 / Gratuit Jour 8** | Modèle freemium CDC | Post-MVP technique — après retraits OK |
| **Multi-tenant complexe** | Plusieurs pays, devises, régulations | Scalabilité future — pas MVP Guinée |
| **Clé USB / offline avancé** | Distribution physique | Hors scope digital MVP |
| **Collaboration avancée** | Co-création temps réel, DAW | Hors scope MVP |

---

## À SUPPRIMER OU GELER

Fonctionnalités **déjà présentes dans le codebase** mais sans valeur MVP immédiate. **Ne pas développer** tant que MVP Core E2E n'est pas validé.

| Élément | Statut | Action | Justification |
|---|---|---|---|
| `features/marketplace/` (Beat Store) | **GELÉ** | Flag `beat_store=false`, pas de dev | POST-MVP CDC |
| `/listen/beats` | **GELÉ** | ComingSoon tant que flag off | POST-MVP |
| `/wallet/royalties` UI | **REPORTÉ → MVP Core** | Brancher `RoyaltiesPage` — **priorité G1** | Bloque chaîne MVP |
| `RoyaltiesPage.tsx` (composant orphelin) | **À ÉVALUER** | Intégrer ou supprimer après G1 | Code mort actuel |
| `SubscriptionModal` / plans MM | **GELÉ** | Pas de dev avant G-5 | POST-MVP |
| Landing `/` + `/lancement` double | **GELÉ** | Pas de nouvelle feature landing | Marketing post-MVP technique |
| Discovery / Recommendation repos | **GELÉ** | Pas d'UI, pas de nouveau RPC | Enterprise prématuré |
| Rights OS UI avancée (contracts) | **GELÉ** | Works/claims basiques OK, pas contracts UI | POST-MVP |
| `studios` table + UI | **GELÉ** | Aucune ref API — ne pas construire | POST-MVP |
| Mobile app (37 fichiers vs web 301) | **REPORTÉ** | Maintenance minimale seulement | Web first MVP |
| Admin fraud/flags avancés | **GELÉ** | Admin minimal catalog/finance suffit | POST-MVP ops |
| Nouvelles tables enterprise sans UI | **GELÉ** | Interdiction nouvelles migrations hors chaîne | Dette technique |

---

## Critères Officiels de Fin du MVP

Le MVP SONAFRIK est déclaré **TERMINÉ** uniquement si **tous** les critères suivants sont **PASS** :

### Qualité technique

| Critère | Commande / validation | Requis |
|---|---|---|
| **Build PASS** | `pnpm --filter @sonafrik/web build` | ✅ 0 erreur |
| **Typecheck PASS** | `pnpm typecheck` | ✅ 12/12 packages |
| **Lint PASS** | `pnpm lint` | ✅ 12/12 packages |
| **Probes PASS** | `pnpm probe:certification` | ✅ 103/103 |

### Runtime & chaîne produit

| Critère | Validation | Requis |
|---|---|---|
| **Runtime PASS** | App démarre, pas de page blanche/noire sur routes MVP Core | ✅ |
| **Streaming PASS** | Real Listen ≥90 % enregistré serveur, player fonctionnel | ✅ |
| **Royalties PASS** | Artiste voit royalties calculées sur `/wallet/royalties` | ❌ **Manquant** |
| **Revenus PASS** | Solde wallet + historique reflètent royalties + crédits | ⚠️ **Partiel** |
| **Retraits PASS** | E2E : demande retrait → traitement (sandbox min.) | ❌ **Manquant** |
| **Régression PASS** | `scripts/artist-journey-live.ts` ou équivalent E2E chaîne complète | ❌ **À exécuter** |

### Critère E2E unique (définition produit)

Un parcours test automatisé ou manuel documenté doit prouver :

```
Compte test → Profil artiste → Créer album → Upload cover + audio
→ Publier → Écoute ≥90 % → Royalties visibles → Solde crédité
→ Demande retrait initiée
```

**Sans ce parcours vert, le MVP n'est PAS terminé** — même si les probes techniques sont à 103/103.

---

## Règle de Gouvernance

Toute nouvelle fonctionnalité, toute IA, tout développeur **doit répondre OUI aux trois questions** :

```
1. Est-elle indispensable à la chaîne MVP Unique ?
2. Empêche-t-elle le lancement si elle n'est pas faite ?
3. Apporte-t-elle une valeur immédiate à la chaîne Compte → Retraits ?
```

| Résultat | Décision |
|---|---|
| **3× OUI** | MVP Core — peut être implémenté |
| **1–2× OUI** | MVP Plus — backlog priorisé post-Core |
| **0× OUI** | **POST-MVP** — refus automatique |

**Procédure de refus :**

> « Cette demande est hors MVP Scope Lock (section POST-MVP / GELÉ). Je propose de la documenter dans MASTER_PLAN.md Vague H. »

**Escalade :** seul Rémy Goumou peut déverrouiller une feature POST-MVP avant fin MVP Core.

---

## Règle de Refus Automatique

Toute IA **doit refuser d'implémenter** tant que MVP Core E2E n'est **pas validé** :

| Catégorie | Exemples interdits |
|---|---|
| **Gadgets** | Animations fancy, easter eggs, widgets |
| **Marketing** | Landing compteur, campagnes, referral viral |
| **Social / viral** | Fil d'actu, partage social, commentaires |
| **Abstractions prématurées** | Frameworks internes, factories, over-engineering |
| **Architectures inutiles** | Nouveaux packages, microservices, event bus |
| **Nouvelles tables** | Sans lien direct chaîne MVP |
| **Nouvelles routes** | Hors périmètre MVP Core / Plus |
| **Mobile features** | Parité mobile avant web MVP Core OK |

**Exception unique :** corrections de bugs **sur la chaîne MVP** (sécurité, crash, données incorrectes).

---

## Références croisées

| Besoin | Document |
|---|---|
| Spec produit complète | `docs/CDC-v9.0.md` |
| Comportement IA | `docs/AI_GOVERNANCE.md` |
| Plan technique Vague F/G | `docs/MASTER_PLAN.md` |
| Journal interventions | `docs/EXECUTION_LOG.md` |
| Paiements | `docs/PAIEMENTS.md` |
| Certification actuelle | `docs/RAPPORT-CERTIFICATION-GLOBALE.md` |

---

## Historique du verrouillage

| Version | Date | Changement |
|---|---|---|
| **1.0** | 2026-06-24 | Création document officiel — audit forensique 360° |

---

*Ce document est la référence officielle du périmètre MVP SONAFRIK. Toute dérive est une violation de gouvernance.*
