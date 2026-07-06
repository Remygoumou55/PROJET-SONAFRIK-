# Enterprise Functional Quality & Certification Program
## SONAFRIK Music Operating System — Phase 1
### Functional Quality Certification — Rapport Officiel MVP

**Date :** 6 juillet 2026  
**Auditeur :** Cabinet EFQ (Software Quality Engineering · Enterprise Functional Testing)  
**Périmètre :** MVP Web (9 phases) · Mobile (audit parité)  
**Méthode :** Analyse fonctionnelle read-only · inventaire routes/composants · traçage workflows · tests automatisés (unit + E2E inventory) · cross-check `MVP_SCOPE_LOCK.md`  
**Modules FREEZE respectés :** SRTSP · Session Engine · Super Admin · Performance Hardening — **aucune modification de code durant cet audit**

> **Note méthodologique :** Cette certification ne remplace pas une campagne QA manuelle exhaustive sur tous les viewports. Elle combine analyse statique du code applicatif, matrice de couverture E2E, exécution de tests unitaires ciblés, et validation des flux documentés. Les anomalies marquées « Confirmé code » sont reproductibles sans ambiguïté ; celles marquées « Non testé live » nécessitent validation manuelle en staging.

---

## 1. Résumé exécutif

SONAFRIK dispose d'une **base fonctionnelle solide** sur les piliers Identity, Catalog upload, Streaming playback (moteur certifié séparément) et Creator OS. Le parcours **wizard de publication** (draft → pending_review) et la **lecture auditeur** (search → play → player) sont implémentés et partiellement couverts par E2E.

**Cependant**, la chaîne MVP unique (`MVP_SCOPE_LOCK.md`) reste **incomplète** : retraits prod bloqués, workflow publication **rejet → resoumission** cassé côté UI Mes publications, favoris bibliothèque sans entrée utilisateur, deep links morceaux non fonctionnels, et couverture E2E insuffisante sur onboarding, album/artist, admin et finance.

### Décision globale

# 🔴 CERTIFICATION REFUSED — MVP Public Launch

**Sous-certifications :**

| Sous-module | Décision |
|---|---|
| Web Auth (Phase 1) | 🟢 **CERTIFIED** — voir `SPRINT1_AUTH_ONBOARDING_CERTIFICATION.md` |
| Web Onboarding (Phase 2) | 🟡 **CONDITIONAL** — implémenté, non certifié E2E |
| Phases 3–9 | 🔴 **REMEDIATION REQUIRED** |

**Score global qualité fonctionnelle MVP : 67 / 100**

**Recommandation :** Lancer le **Programme de Remédiation EFQ** (P0 → P4) avant toute ouverture publique. La bêta fermée web reste acceptable **avec parcours documentés** et wallet/retraits désactivés (`NEXT_PUBLIC_PAYMENTS_ENABLED=false`).

---

## 2. Score global et par module

| Phase | Module | Score | P0 | P1 | P2 | P3 | P4 | Verdict |
|---:|---|---:|---:|---:|---:|---:|---:|---|
| 1 | Authentification (Web) | **88** | 0 | 0* | 4 | 2 | 0 | 🟢 Certified |
| 2 | Onboarding (Web) | **78** | 0 | 2 | 3 | 2 | 1 | 🟡 Conditional |
| 3 | Listener Experience | **65** | 0 | 3 | 5 | 4 | 2 | 🔴 Partial |
| 4 | Creator Experience | **74** | 0 | 1 | 3 | 3 | 1 | 🟡 Partial |
| 5 | Catalog | **71** | 0 | 2 | 5 | 4 | 0 | 🟡 Partial |
| 6 | Publication Workflow | **58** | 1 | 2 | 3 | 2 | 0 | 🔴 Fail |
| 7 | Streaming UX | **72** | 0 | 2 | 4 | 3 | 2 | 🟡 Partial |
| 8 | Wallet | **55** | 3 | 2 | 3 | 1 | 1 | 🔴 Blocked |
| 9 | Admin (lecture cible) | **62** | 0 | 3 | 3 | 2 | 2 | 🟡 Partial |
| — | Mobile parité | **45** | 0 | 3 | 2 | 1 | 3 | 🔴 Non MVP web |

\*P1 Auth mobile en backlog PCI — non bloquant bêta web Guinée.

**Pondération chaîne MVP :** Wallet (×1.5) · Publication (×1.3) · Listener (×1.2) · autres (×1.0)

---

## 3. Méthodologie de certification

### 3.1 Sources analysées

- Routes : `apps/web/src/app/` (listener, creator, admin, auth, onboarding, wallet)
- Features : `apps/web/src/features/{listener,creator,admin,wallet,identity,shared}/`
- API services : `packages/api/src/{auth,listener,creator,wallet,payments,admin,streaming}/`
- E2E : `apps/web/tests/e2e/*.spec.ts` (10 fichiers)
- Tests unitaires exécutés : `auth.service.test.ts` (3/3), `wallet.service.test.ts` (16/16)
- Documents : `MVP_SCOPE_LOCK.md`, `SPRINT1_AUTH_ONBOARDING_CERTIFICATION.md`, `EXECUTION_LOG.md`

### 3.2 Matrice de contrôle par page (échantillon)

Pour chaque page : boutons · liens · inputs · selects · modales · loaders · skeletons · toasts · états vides · erreurs · permissions · responsive (via `responsive-mrcdop.spec.ts` partiel).

### 3.3 Couverture E2E actuelle

| Spec | Phases couvertes | CI |
|---|---|---|
| `smoke.spec.ts` | Auth redirect | ✅ |
| `auth.spec.ts` | Listen greeting, search input | ❌ |
| `streaming-player.spec.ts` | Search play, player controls | ❌ |
| `library.spec.ts` | Library visibility | ❌ |
| `mvp-chain.spec.ts` | Nav chain | ❌ |
| `wallet.spec.ts` | Wallet pages | ❌ |
| `finance-chain.spec.ts` | Payout UI, payment-initiate API | ❌ |
| `publication-wizard.spec.ts` | Wizard step 1 only | ❌ |
| `publications-library.spec.ts` | Library load | ❌ |
| `responsive-mrcdop.spec.ts` | Overflow viewports | ❌ |

**Lacune critique :** 9/10 specs E2E hors CI ; aucun test onboarding, OAuth Google, admin, album/artist, resubmit publication.

---

## 4. Liste complète des anomalies

Format standard EFQ pour chaque entrée.

---

### PHASE 1 — AUTHENTIFICATION

#### AUTH-P2-01 — Pas de reset password (by design)

| Champ | Valeur |
|---|---|
| **ID** | AUTH-P2-01 |
| **Titre** | Reset password absent — modèle passwordless |
| **Description** | `/auth/mot-de-passe-oublie` affiche une page d'aide, pas de flux email reset |
| **Étapes** | 1. Aller `/auth/mot-de-passe-oublie` 2. Observer contenu aide |
| **Résultat attendu** | N/A passwordless OU flux reset si mot de passe |
| **Résultat obtenu** | Page aide uniquement |
| **Priorité** | P2 |
| **Impact** | Utilisateurs Google : aucun. OTP-only : support manuel |
| **Fichier** | `apps/web/src/app/auth/mot-de-passe-oublie/page.tsx` |
| **Correction proposée** | Renommer route `/auth/aide` (P3) ; documenter support |
| **Risque correction** | Faible |

#### AUTH-P2-02 — Déconnexion absente du shell listener

| Champ | Valeur |
|---|---|
| **ID** | AUTH-P2-02 / LISTENER-LOGOUT-UX |
| **Titre** | Pas de CTA déconnexion dans navigation auditeur |
| **Description** | Logout accessible via `/settings/sessions` ou menu créateur uniquement |
| **Étapes** | 1. Connecté listener 2. Parcourir bottom nav + sidebar |
| **Résultat attendu** | Entrée déconnexion accessible (profil/menu) |
| **Résultat obtenu** | Aucun lien signOut dans `ListenerMobileBottomNav` / `ListenerDesktopSidebar` |
| **Priorité** | P2 |
| **Impact** | UX — friction déconnexion |
| **Fichier** | `apps/web/src/features/listener/components/ListenerMobileBottomNav.tsx` |
| **Correction proposée** | Ajouter « Déconnexion » dans menu profil listener |
| **Risque** | Faible |

#### AUTH-P2-03 — Sessions app découplées du JWT

| Champ | Valeur |
|---|---|
| **ID** | AUTH-P2-03 |
| **Titre** | Révocation `user_sessions` ≠ invalidation JWT Supabase |
| **Description** | `signOutEverywhere` révoque sessions DB mais token peut rester valide jusqu'à expiry |
| **Priorité** | P2 |
| **Impact** | Sécurité session — fenêtre résiduelle |
| **Fichier** | `packages/api/src/auth/auth.service.ts` |
| **Correction proposée** | Documenter + option `signOut({ scope: 'global' })` Supabase |
| **Risque** | Moyen |

#### AUTH-P1-MOB-01 — Mobile sans Google OAuth

| Champ | Valeur |
|---|---|
| **ID** | AUTH-P1-MOB-01 |
| **Titre** | App mobile OTP-only — pas de parité Google-first web |
| **Priorité** | P1 (mobile) / P4 (web MVP) |
| **Impact** | Parité mobile |
| **Fichier** | `apps/mobile/app/auth/` |
| **Correction proposée** | Backlog PCI Sprint mobile |

#### AUTH-P1-MOB-02 — Mobile sans logout

| Champ | Valeur |
|---|---|
| **ID** | AUTH-P1-MOB-02 |
| **Titre** | Aucun `signOut()` exposé mobile |
| **Priorité** | P1 (mobile) |
| **Fichier** | `apps/mobile/app/(tabs)/` |

---

### PHASE 2 — ONBOARDING

#### ONBOARD-P1-01 — Aucun E2E onboarding

| Champ | Valeur |
|---|---|
| **ID** | ONBOARD-P1-01 |
| **Titre** | Parcours onboarding non couvert Playwright |
| **Description** | Routes `/onboarding/role`, `/onboarding/listener`, `/onboarding/artist` sans spec E2E |
| **Étapes** | 1. Compte neuf 2. role → listener 5 steps → complete |
| **Résultat attendu** | `onboarding_completed=true`, redirect `/listen` |
| **Résultat obtenu** | Implémenté code ; **non validé automatisé** |
| **Priorité** | P1 |
| **Impact** | Régression onboarding non détectée en CI |
| **Fichier** | `apps/web/src/app/onboarding/` |
| **Correction proposée** | Spec E2E avec service role setup |
| **Risque** | Faible |

#### ONBOARD-P1-02 — OAuth Google non testé E2E

| Champ | Valeur |
|---|---|
| **ID** | ONBOARD-P1-02 |
| **Titre** | Flux Google OAuth jamais exécuté en Playwright |
| **Priorité** | P1 |
| **Impact** | Auth prod default non certifiée bout-en-bout |
| **Fichier** | `apps/web/src/app/auth/callback/route.ts` |

#### ONBOARD-P2-01 — Callback OAuth écrit DB directement

| Champ | Valeur |
|---|---|
| **ID** | ONBOARD-P2-01 |
| **Titre** | `callback/route.ts` update `profiles.account_type` hors service layer |
| **Priorité** | P2 |
| **Fichier** | `apps/web/src/app/auth/callback/route.ts` |

#### ONBOARD-P1-MOB-03 — Wizards 5 étapes absents mobile

| Champ | Valeur |
|---|---|
| **ID** | ONBOARD-P1-MOB-03 |
| **Titre** | Pas d'onboarding listener/artist sur Expo |
| **Priorité** | P1 (mobile) |

---

### PHASE 3 — LISTENER EXPERIENCE

#### LISTEN-P1-01 — Deep link morceau cassé

| Champ | Valeur |
|---|---|
| **ID** | LISTEN-P1-01 |
| **Titre** | `/listen/track/[id]` et SmartSearch ne déclenchent pas la lecture |
| **Description** | Redirect vers `/listen?track={id}` mais `listen/page.tsx` n'accepte que `category` |
| **Étapes** | 1. Ouvrir `/listen/track/{uuid}` ou sélectionner track dans SmartSearch |
| **Résultat attendu** | Lecture auto ou highlight + play |
| **Résultat obtenu** | Redirect accueil sans action |
| **Priorité** | P1 |
| **Impact** | Partage liens morceaux, SEO, UX recherche |
| **Fichier** | `apps/web/src/app/(listener)/listen/page.tsx`, `listen/track/[id]/page.tsx`, `SmartSearchBar.tsx` |
| **Correction proposée** | Client island consommant `searchParams.track` → `loadAndPlay` |
| **Risque** | Faible |

#### LISTEN-P1-02 — Favoris sans UI d'ajout

| Champ | Valeur |
|---|---|
| **ID** | LISTEN-P1-02 |
| **Titre** | Onglet Favoris vide — pas de bouton « ajouter aux favoris » |
| **Description** | `toggleFavorite` exposé dans `libraryLdseContext` mais jamais branché UI. `LikeButton` utilise table `likes`, pas `favorites` |
| **Étapes** | 1. Liker un morceau (player) 2. Aller `/library?tab=favoris` |
| **Résultat attendu** | Morceau dans favoris |
| **Résultat obtenu** | Like comptabilisé ; favoris reste vide. Message UI : « Ajoutez des morceaux en favoris » sans mécanisme |
| **Priorité** | P1 |
| **Impact** | Bibliothèque inutilisable pour favoris — promesse produit rompue |
| **Fichier** | `libraryLdseContext.tsx`, `FavoritesList.tsx`, `shared/social/LikeButton.tsx` |
| **Correction proposée** | Bouton favori distinct ou unifier likes/favorites produit |
| **Risque** | Moyen (modèle données) |

#### LISTEN-P1-03 — Likes vs Favoris incohérents

| Champ | Valeur |
|---|---|
| **ID** | LISTEN-P1-03 |
| **Titre** | Deux systèmes parallèles likes/favorites |
| **Priorité** | P1 |
| **Impact** | Confusion UX, compteurs sidebar trompeurs |
| **Fichier** | `packages/api/src/social/`, `packages/api/src/listener/` |

#### LISTEN-P2-01 — Téléchargements stub

| Champ | Valeur |
|---|---|
| **ID** | LISTEN-P2-01 |
| **Titre** | Sidebar « Téléchargés » toujours 0, lien vers `/library` |
| **Priorité** | P2 |
| **Fichier** | `packages/api/src/listener/listener.track.repository.ts` |

#### LISTEN-P2-02 — Feature flags listen UX off by default

| Champ | Valeur |
|---|---|
| **ID** | LISTEN-P2-02 |
| **Titre** | Fullscreen, queue panel, discover mode, lyrics, WhatsApp share désactivés |
| **Priorité** | P2 |
| **Fichier** | `apps/web/src/lib/listen/listen-feature-flags.ts` |

#### LISTEN-P2-03 — E2E player fragile

| Champ | Valeur |
|---|---|
| **ID** | LISTEN-P2-03 |
| **Titre** | Tests ciblent `div.fixed` au lieu de `.global-player` |
| **Priorité** | P2 |
| **Fichier** | `apps/web/tests/e2e/streaming-player.spec.ts` |

#### LISTEN-P2-04 — Pas de not-found segment listener

| Champ | Valeur |
|---|---|
| **ID** | LISTEN-P2-04 |
| **Titre** | `(listener)/not-found.tsx` absent |
| **Priorité** | P2 |

#### LISTEN-P3-01 — Paroles bouton disabled visible

| Champ | Valeur |
|---|---|
| **ID** | LISTEN-P3-01 |
| **Titre** | Bouton paroles visible mais disabled quand flag off |
| **Priorité** | P3 |
| **Fichier** | `FullPlayerPanel.tsx` |

#### LISTEN-P4-01 — Beat Store ComingSoon

| Champ | Valeur |
|---|---|
| **ID** | LISTEN-P4-01 |
| **Titre** | `/listen/beats` → ComingSoon (post-MVP intentionnel) |
| **Priorité** | P4 |
| **Fichier** | `apps/web/src/app/(listener)/listen/beats/page.tsx` |

---

### PHASE 4 — CREATOR EXPERIENCE

#### CR-P2-01 — Premium card CTA trompeur

| Champ | Valeur |
|---|---|
| **ID** | CR-P2-01 |
| **Titre** | Carte premium promet analytics/promotion, lien `/wallet` |
| **Priorité** | P2 |
| **Fichier** | `DashboardPremiumCard.tsx` |

#### CR-P2-02 — console.error dashboard crash

| Champ | Valeur |
|---|---|
| **ID** | CR-P2-02 |
| **Titre** | Handler erreur dashboard utilise `console.error` |
| **Priorité** | P2 |
| **Fichier** | `apps/web/src/app/(creator)/creator/page.tsx` |

#### CR-P3-01 — Hub catalog hors nav primaire

| Champ | Valeur |
|---|---|
| **ID** | CR-P3-01 |
| **Titre** | `/creator/catalog` accessible via dashboard seulement |
| **Priorité** | P3 |
| **Fichier** | `creatorNavConfig.ts` |

#### CR-P2-MOB-01 — Catalog mobile stub

| Champ | Valeur |
|---|---|
| **ID** | CR-P2-MOB-01 |
| **Titre** | Mobile creator catalog = titre/ISRC only, pas wizard |
| **Priorité** | P2 (mobile) |
| **Fichier** | `apps/mobile/app/(tabs)/profil/creator/catalog/tracks.tsx` |

---

### PHASE 5 — CATALOG

#### CAT-P1-01 — ReleaseList submit sans audio

| Champ | Valeur |
|---|---|
| **ID** | CAT-P1-01 |
| **Titre** | « Soumettre » depuis ReleaseList possible sans fichier audio |
| **Description** | Crée single + cover + submit ; échoue `assertAlbumReadyForSubmit` sans message clair |
| **Étapes** | 1. `/creator/catalog/releases` 2. Créer sortie 3. Cover 4. Soumettre sans audio |
| **Résultat attendu** | Bouton désactivé OU message « audio requis » |
| **Résultat obtenu** | Erreur serveur / échec silencieux |
| **Priorité** | P1 |
| **Fichier** | `ReleaseList.tsx`, `catalog.service.ts` |
| **Correction proposée** | Masquer submit jusqu'à audio confirmé |
| **Risque** | Faible |

#### CAT-P1-02 — TrackEditor sans resubmit

| Champ | Valeur |
|---|---|
| **ID** | CAT-P1-02 |
| **Titre** | Éditeur track ne propose pas « Soumettre » pour rejected |
| **Priorité** | P1 |
| **Fichier** | `TrackEditor.tsx` |

#### CAT-P2-01 — Genre optionnel TrackEditor vs requis wizard

| Champ | Valeur |
|---|---|
| **ID** | CAT-P2-01 |
| **Titre** | Validation genre incohérente entre éditeur et wizard |
| **Priorité** | P2 |
| **Fichier** | `TrackEditor.tsx`, `WizardStep3Panel.tsx` |

#### CAT-P2-02 — Filtre archived absent bibliothèque

| Champ | Valeur |
|---|---|
| **ID** | CAT-P2-02 |
| **Titre** | Statut `archived` a badge mais pas d'onglet filtre |
| **Priorité** | P2 |
| **Fichier** | `publicationConstants.ts` |

#### CAT-P2-03 — Album/EP multi-track non supporté

| Champ | Valeur |
|---|---|
| **ID** | CAT-P2-03 |
| **Titre** | Message MVP « singles only » — pas album multi-pistes |
| **Priorité** | P2 (attendu MVP) |
| **Fichier** | `ReleaseList.tsx` |

#### CAT-P3-01 — Erreurs chargement tracks avalées

| Champ | Valeur |
|---|---|
| **ID** | CAT-P3-01 |
| **Titre** | Page tracks affiche liste vide en cas d'erreur API |
| **Priorité** | P3 |
| **Fichier** | `creator/catalog/tracks/page.tsx` |

---

### PHASE 6 — PUBLICATION

#### PUB-P0-01 — Bouton « Renvoyer » mort

| Champ | Valeur |
|---|---|
| **ID** | PUB-P0-01 |
| **Titre** | Action resubmit rejected → `#publish` inexistant |
| **Description** | `getPublicationResubmitHref` pointe vers `edit#publish` ; `TrackEditor` n'a ni section `#publish` ni handler `submitAlbum` |
| **Étapes** | 1. Track `rejected` 2. Mes publications 3. « Renvoyer » |
| **Résultat attendu** | Resoumission → `pending_review` |
| **Résultat obtenu** | Navigation edit sans action submit ; utilisateur bloqué sauf workaround ReleaseList |
| **Priorité** | **P0** |
| **Impact** | **Chaîne MVP** — artiste rejeté ne peut pas republier via UI principale |
| **Fichier** | `actions.ts`, `PublicationContextualActions.tsx`, `TrackEditor.tsx` |
| **Correction proposée** | Section publish dans TrackEditor + `submitAlbum` pour `rejected` |
| **Risque** | Faible |

#### PUB-P1-01 — « Consulter » published cassé

| Champ | Valeur |
|---|---|
| **ID** | PUB-P1-01 |
| **Titre** | Consulter published → edit redirect library |
| **Description** | `edit/page.tsx` L29-31 redirect si status ≠ draft/rejected |
| **Étapes** | 1. Track published 2. « Consulter » |
| **Résultat attendu** | Vue lecture seule métadonnées |
| **Résultat obtenu** | Redirect `/creator/catalog/tracks` |
| **Priorité** | P1 |
| **Fichier** | `edit/page.tsx`, `PublicationContextualActions.tsx` |
| **Correction proposée** | Page consult read-only ou mode view |
| **Risque** | Faible |

#### PUB-P2-01 — Partager copie URL racine

| Champ | Valeur |
|---|---|
| **ID** | PUB-P2-01 |
| **Titre** | Share publication = `window.location.origin` pas lien track |
| **Priorité** | P2 |
| **Fichier** | `PublicationDetailPanel.tsx` L14-23 |

#### PUB-P2-02 — Continuer draft = edit pas wizard resume

| Champ | Valeur |
|---|---|
| **ID** | PUB-P2-02 |
| **Titre** | « Continuer » ne reprend pas étape wizard 2-4 |
| **Priorité** | P2 |

#### PUB-P3-01 — E2E wizard incomplet

| Champ | Valeur |
|---|---|
| **ID** | PUB-P3-01 |
| **Titre** | E2E wizard : step 1 + URL clamp seulement |
| **Priorité** | P3 |
| **Fichier** | `publication-wizard.spec.ts` |

---

### PHASE 7 — STREAMING UX (moteur exclu)

#### STREAM-P1-01 — Pas E2E album/artist/home

| Champ | Valeur |
|---|---|
| **ID** | STREAM-P1-01 |
| **Titre** | Pages `/listen/album/[id]`, `/listen/artist/[id]` non testées E2E |
| **Priorité** | P1 |

#### STREAM-P1-02 — Discover home non certifié

| Champ | Valeur |
|---|---|
| **ID** | STREAM-P1-02 |
| **Titre** | Lecture depuis DiscoveriesSection / homepage sans E2E |
| **Priorité** | P1 |

#### STREAM-P2-01 — Queue/shuffle/repeat E2E partiel

| Champ | Valeur |
|---|---|
| **ID** | STREAM-P2-01 |
| **Titre** | Next/prev testés via search ; shuffle/repeat/home queue non |
| **Priorité** | P2 |

**Note :** Moteur Session Engine + `test:player` 15/15 — **certifié séparément, non modifié**.

---

### PHASE 8 — WALLET

#### WALLET-P0-01 — Credentials Orange Money prod absents

| Champ | Valeur |
|---|---|
| **ID** | WALLET-P0-01 / PAY-PROD |
| **Titre** | Opérateurs paiement prod non configurés |
| **Description** | `payment-initiate` retourne `payment_operator_not_ready` (503) |
| **Priorité** | **P0** |
| **Impact** | **Lancement public bloqué** — chaîne retraits |
| **Fichier** | `supabase/functions/_shared/payments.ts`, `docs/P0-2-PHASE-2-ORANGE-MONEY.md` |

#### WALLET-P0-02 — Flag paiements désactivé

| Champ | Valeur |
|---|---|
| **ID** | WALLET-P0-02 |
| **Titre** | `NEXT_PUBLIC_PAYMENTS_ENABLED=false` → topup/retrait UI « bientôt » |
| **Priorité** | **P0** (lancement) / P2 (bêta fermée) |
| **Fichier** | `apps/web/src/features/wallet/lib/paymentsEnabled.ts` |

#### WALLET-P0-03 — Chaîne financière E2E prod non prouvée

| Champ | Valeur |
|---|---|
| **ID** | WALLET-P0-03 / FIN-E2E-PROD |
| **Titre** | stream → royalties → wallet → retrait réel non validé prod |
| **Priorité** | **P0** |
| **Référence** | `MVP_SCOPE_LOCK.md` — Revenus + Retraits **BLOQUANT** |

#### WALLET-P1-01 — Sandbox E2E hors CI

| Champ | Valeur |
|---|---|
| **ID** | WALLET-P1-01 |
| **Titre** | `scripts/run-finance-sandbox-e2e.ts` non intégré CI |
| **Priorité** | P1 |

#### WALLET-P2-01 — wallet.spec drift

| Champ | Valeur |
|---|---|
| **ID** | WALLET-P2-01 |
| **Titre** | Spec mentionne ComingSoon obsolète |
| **Priorité** | P2 |
| **Fichier** | `wallet.spec.ts` |

---

### PHASE 9 — ADMIN

#### ADMIN-P1-01 — Page audit stub

| Champ | Valeur |
|---|---|
| **ID** | ADMIN-P1-01 |
| **Titre** | `/admin/audit` = AdminModulePlaceholder |
| **Priorité** | P1 |
| **Fichier** | `apps/web/src/app/(admin)/admin/audit/page.tsx` |

#### ADMIN-P1-02 — Zéro E2E admin

| Champ | Valeur |
|---|---|
| **ID** | ADMIN-P1-02 |
| **Titre** | Aucun test Playwright navigation/admin lecture |
| **Priorité** | P1 |

#### ADMIN-P1-03 — Nav rights dupliquée

| Champ | Valeur |
|---|---|
| **ID** | ADMIN-P1-03 |
| **Titre** | `/admin/rights` listé 2× sidebar (Modération + Droits) |
| **Priorité** | P1 |
| **Fichier** | `admin-nav.ts` |

#### ADMIN-P2-01 — Scope read-only vs mutations

| Champ | Valeur |
|---|---|
| **ID** | ADMIN-P2-01 |
| **Titre** | Phase 9 cible lecture seule ; UI expose 20+ mutations |
| **Note** | Attendu pour ops admin MVP — clarifier périmètre certification |
| **Priorité** | P2 |

---

## 5. Priorisation consolidée

| Priorité | Count | Bloquant lancement public |
|---|---:|---|
| **P0** | 4 | ✅ Oui |
| **P1** | 18 | ✅ Oui (sous-ensemble) |
| **P2** | 22 | Partiel |
| **P3** | 12 | Non |
| **P4** | 6 | Non |
| **Total** | **62** | — |

### Top 10 bloqueurs remédiation

1. **PUB-P0-01** — Resubmit rejected mort
2. **WALLET-P0-01** — Credentials Orange Money prod
3. **WALLET-P0-03** — Chaîne financière E2E prod
4. **LISTEN-P1-01** — Deep links morceaux
5. **LISTEN-P1-02** — Favoris sans UI
6. **PUB-P1-01** — Consulter published
7. **ONBOARD-P1-01** — E2E onboarding CI
8. **CAT-P1-01** — Submit sans audio ReleaseList
9. **ADMIN-P1-01** — Audit log viewer
10. **STREAM-P1-01** — E2E album/artist

---

## 6. Analyse des risques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Artiste rejeté ne republie pas | **Élevée** | **Critique** | PUB-P0-01 — workaround ReleaseList non évident |
| Utilisateur partage lien morceau | **Élevée** | Majeur | LISTEN-P1-01 |
| Favoris promis mais vides | **Élevée** | Majeur | LISTEN-P1-02 |
| Retrait prod échoue | **Certaine** sans creds | **Critique** | WALLET-P0-01/02/03 |
| Régression onboarding | Moyenne | Majeur | ONBOARD-P1-01 |
| Admin audit inaccessible | Moyenne | Moyen | ADMIN-P1-01 |

---

## 7. Checklist de certification

### Chaîne MVP (`MVP_SCOPE_LOCK.md`)

| Étape | Fonctionnel | Certifié EFQ |
|---|---|---|
| Compte | ✅ | 🟢 Phase 1 |
| Profil Artiste | ✅ | 🟡 Phase 4 |
| Album / Cover / Audio | ✅ | 🟡 Phase 5 |
| Publication | ⚠️ Resubmit P0 | 🔴 Phase 6 |
| Écoutes | ✅ | 🟡 Phase 7 |
| Royalties | ⚠️ UI OK | 🔴 Phase 8 |
| Revenus | ⚠️ Partiel | 🔴 Phase 8 |
| Retraits | ❌ Flag + creds | 🔴 Phase 8 |

### Critères EFQ globaux

| Critère | Statut |
|---|---|
| Fonctionnement réel boutons/forms | ⚠️ Anomalies P0/P1 |
| Cohérence UX | ⚠️ Likes/favoris, logout |
| Flux utilisateur E2E | ❌ Gaps wallet, resubmit |
| États chargement/erreur/vide | ✅ Majoritairement OK |
| Navigation | ✅ OK |
| Permissions / guards | ✅ Middleware + require* |
| Responsive | 🟡 `responsive-mrcdop` partiel |
| Accessibilité base | 🟡 aria partiel auth/player |
| Robustesse | ⚠️ Erreurs avalées catalog |
| E2E CI | ❌ Smoke only |

---

## 8. État du MVP

| Dimension | Évaluation |
|---|---|
| **Architecture fonctionnelle** | Mature — silos respectés |
| **Couverture tests fonctionnels** | **~35%** parcours utilisateur (estimation) |
| **Chaîne MVP unique** | **Incomplète** — retraits + resubmit |
| **Prêt bêta fermée web** | **Oui** avec limitations documentées |
| **Prêt lancement public** | **Non** |

**Score MVP réaliste aligné EXECUTION_LOG :** 76/100 technique · **67/100 fonctionnel EFQ**

---

## 9. Décision finale

```
═══════════════════════════════════════════════
DÉCISION EFQ — MVP SONAFRIK
Date : 6 juillet 2026
═══════════════════════════════════════════════

STATUT GLOBAL : 🔴 CERTIFICATION REFUSED
                (Lancement public)

SOUS-STATUTS :
  Phase 1 Auth Web     : 🟢 CERTIFIED
  Phase 2 Onboarding   : 🟡 CONDITIONAL
  Phases 3-9           : 🔴 REMEDIATION REQUIRED

CONDITION BÊTA FERMÉE :
  Autorisée si wallet/retraits désactivés,
  parcours publication via wizard (pas resubmit),
  favoris documentés comme « likes only » temporaire.

═══════════════════════════════════════════════
```

---

## 10. Roadmap officielle de remédiation

### Vague R1 — P0 (Semaine 1) — Bloquants chaîne MVP

| # | ID | Action | Owner suggéré |
|---|---|---|---|
| 1 | PUB-P0-01 | Implémenter resubmit rejected (TrackEditor `#publish` + submit) | Creator/Catalog |
| 2 | WALLET-P0-01 | Configurer credentials Orange Money GN staging puis prod | Ops/Supabase Secrets |
| 3 | WALLET-P0-03 | Exécuter + documenter sandbox E2E finance chain | Wallet |
| 4 | WALLET-P0-02 | Activer `PAYMENTS_ENABLED` staging uniquement après #2 | Wallet |

### Vague R2 — P1 (Semaines 2–3) — Critiques UX

| # | ID | Action |
|---|---|---|
| 5 | LISTEN-P1-01 | Deep link track → auto-play |
| 6 | LISTEN-P1-02/03 | Unifier ou exposer favoris UI |
| 7 | PUB-P1-01 | Vue consult published read-only |
| 8 | CAT-P1-01 | Guard submit sans audio |
| 9 | CAT-P1-02 | Submit depuis TrackEditor rejected |
| 10 | ONBOARD-P1-01/02 | E2E onboarding + OAuth en CI |
| 11 | STREAM-P1-01/02 | E2E album/artist/home play |
| 12 | ADMIN-P1-01 | Audit log viewer read-only |
| 13 | ADMIN-P1-02 | E2E admin smoke |

### Vague R3 — P2 (Semaine 4) — Majeurs

- AUTH-P2-02 logout listener shell
- Validation genre/language TrackEditor
- Filtre archived publications
- Share URL track public
- Finance sandbox CI
- ReleaseList UX audio guard

### Vague R4 — P3/P4 (Post-beta)

- Rename `/auth/aide`
- Premium card copy
- Beat store (flag)
- Mobile parité (PCI backlog)
- Lyrics/queue flags enable + test

---

## Annexe A — Inventaire routes certifiées (lecture seule)

### Auth & Onboarding
`/auth/connexion` · `/auth/inscription` · `/auth/callback` · `/auth/mot-de-passe-oublie` · `/onboarding/role` · `/onboarding/listener` · `/onboarding/artist`

### Listener
`/listen` · `/search` · `/library` · `/library/playlist/[id]` · `/listen/album/[id]` · `/listen/artist/[id]` · `/listen/track/[id]` · `/notifications` · `/listen/beats`

### Creator
`/creator` · `/creator/identity` · `/creator/analytics` · `/creator/catalog` · `/creator/catalog/tracks` · `/creator/catalog/tracks/new` · `/creator/catalog/tracks/[id]/edit` · `/creator/catalog/releases`

### Wallet
`/wallet` · `/wallet/royalties` · `/wallet/payout`

### Admin
`/admin` · `/admin/analytics` · `/admin/users` · `/admin/artists` · `/admin/catalog` · `/admin/rights` · `/admin/revenue` · `/admin/withdrawals` · `/admin/settings` · `/admin/audit` (stub) · `/admin/health` · `/admin/flags` · `/admin/fraud` · `/admin/live-control`

---

## Annexe B — Tests automatisés exécutés durant audit

```
auth.service.test.ts     — 3/3 ✅
wallet.service.test.ts   — 16/16 ✅
```

Référence Sprint 1 : typecheck 17/17 · lint 17/17 · build 10/10 · srtsp 100/100 · player 15/15

---

*Rapport officiel EFQ Phase 1 — `docs/functional-quality/reports/PHASE1_MVP_FUNCTIONAL_CERTIFICATION.md`*  
*Prochaine étape : Programme de Remédiation EFQ Vague R1 (sur demande explicite — aucune correction durant cette phase)*
