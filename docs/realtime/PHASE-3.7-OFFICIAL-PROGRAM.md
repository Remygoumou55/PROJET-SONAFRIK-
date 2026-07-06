# SONAFRIK
## CORE INFRASTRUCTURE
## SRTSP PHASE 3.7
## ARTIST PROFILE LIVE INTEGRATION PROGRAM
## OFFICIAL CERTIFICATION PROGRAM

> **Enterprise Hardening Addendum** intégré le 2026-07-05  
> Document de référence unique — implémentation, certification et freeze Phase 3.7  
> Cartographie événements : `ARTIST-PROFILE-EVENT-MAP.md` · Rapport certification : `PHASE-3.7-CERTIFICATION.md`

---

###############################################################################
# CONTEXTE
###############################################################################

SONAFRIK est un Music Operating System africain.

Le moteur SRTSP Enterprise est officiellement :

✓ Enterprise Certified  
✓ Phase 2 Certified  
✓ Phase 3.1 Certified (Publication Wizard)  
✓ Phase 3.2 Certified (Mes publications)  
✓ Phase 3.3 Certified (Dashboard)  
✓ Phase 3.4 Certified (Catalogue Live)  
✓ Phase 3.5 Certified (Analytics Live)  
✓ Phase 3.6 Certified (Wallet Live)

Le dossier de préparation de la Phase 3.7 (Audit, Architecture Review, Event Mapping, Test Strategy et Documentation) est terminé.

Cette mission consiste à connecter **Artist Profile** au moteur SRTSP.

Le Profil Artiste devient le **HUB IDENTITAIRE** de SONAFRIK.

Toutes les informations affichées dans le profil doivent être synchronisées automatiquement via le SRTSP.

---

###############################################################################
# OBJECTIF
###############################################################################

Transformer Artist Profile en consommateur officiel du SRTSP.

Les informations suivantes doivent être mises à jour automatiquement :

• Avatar  
• Bannière  
• Nom d'artiste  
• Biographie  
• Réseaux sociaux  
• Statistiques publiques  
• Badges  
• Niveau de carrière  
• Vérification  
• Résumé artistique

L'utilisateur ne doit jamais :

- actualiser la page  
- utiliser F5  
- quitter puis revenir

Toutes les mises à jour doivent être :

✓ instantanées  
✓ cohérentes  
✓ ciblées  
✓ performantes

---

###############################################################################
# PÉRIMÈTRE
###############################################################################

Autorisé :

• Artist Profile  
• packages/core/realtime  
• Hooks Artist Profile  
• Adaptateurs Artist Profile  
• Cache Artist Profile

Interdiction absolue :

❌ Modifier Publication Wizard  
❌ Modifier Mes publications  
❌ Modifier Dashboard  
❌ Modifier Catalogue  
❌ Modifier Analytics  
❌ Modifier Wallet  
❌ Modifier Workspace Auditeur  
❌ Modifier Workspace Super Admin  
❌ Modifier les contrats SRTSP certifiés  
❌ Modifier Event Registry  
❌ Modifier la logique métier

---

###############################################################################
# ÉTAPE A
# AUDIT
###############################################################################

Avant toute implémentation :

Auditer :

• Hero  
• Avatar  
• Bannière  
• Profil public  
• Badges  
• Niveau  
• Vérification  
• Statistiques  
• Actions rapides  
• Hooks  
• Services  
• Cache  
• API  
• Performance  
• Sécurité

Comparer avec le dossier de préparation validé.

Identifier tous les écarts.

Produire un rapport.

Aucune modification avant Root Cause.

---

###############################################################################
# ÉTAPE B
# ARCHITECTURE REVIEW
###############################################################################

Valider :

• découplage  
• Event Bus  
• Synchronization Engine  
• Cache Strategy  
• extensibilité  
• maintenabilité

Valider les dépendances avec :

• Dashboard  
• Catalogue  
• Analytics  
• Wallet  
• Workspace Auditeur  
• Workspace Super Admin

Le Profil ne doit jamais contenir une logique métier appartenant à un autre module.

---

###############################################################################
# IDENTITY SYNCHRONIZATION
###############################################################################

**Exigence Enterprise — Hub identitaire SSOT**

Le Profil Artiste est l'**unique source officielle** de l'identité publique SONAFRIK pour un créateur.

Toute modification du Profil doit être propagée **automatiquement** via le SRTSP — jamais par appel direct inter-module.

### Champs synchronisés (minimum obligatoire)

| Domaine | Champs |
|---|---|
| Visuel | Avatar · Bannière · Photo de couverture |
| Identité | Nom d'artiste · Biographie |
| Trust | Badge Vérifié · Vérification |
| Carrière | Niveau de carrière · Badges |
| Social | Réseaux sociaux |
| Géo | Ville · Pays |
| Musical | Genres musicaux |
| Public | Informations publiques · Statistiques publiques autorisées |

### Règles de cohérence

- Toutes les représentations publiques du même créateur doivent rester **strictement cohérentes** après tout événement SRTSP pertinent.  
- **Aucune ancienne version** (avatar, nom, badge, bannière) ne doit rester affichée après propagation réussie.  
- La synchronisation passe exclusivement par le bus SRTSP — voir `ÉTAPE D`.  
- Les modules certifiés (Dashboard, Catalogue, etc.) consomment leurs propres événements ; le Profil **émet/consomme** via le registry sans les modifier.

---

###############################################################################
# CROSS MODULE VALIDATION
############################################################################===

**Exigence Enterprise — Zéro divergence inter-modules**

Chaque modification du Profil validée côté SRTSP doit être **automatiquement vérifiable** dans les surfaces suivantes :

| Module | Surface de contrôle | Critère |
|---|---|---|
| Dashboard | Hero · KPIs identité | Nom / avatar cohérents |
| Catalogue | Résumé créateur · métadonnées publiques | Nom / statut cohérents |
| Analytics | Stats publiques affichées | Pas de données identité obsolètes |
| Wallet | Indicateurs autorisés uniquement | Pas de fuite identité non prévue |
| Workspace Auditeur | Profil public artiste | Avatar · nom · bio · genres |
| Workspace Super Admin | Fiche artiste · vérification | Badge · statut vérification |

### Objectifs mesurables

- **Zéro désynchronisation** entre Profil et vues publiques contrôlées.  
- **Zéro divergence** entre modules consommateurs SRTSP du même `creatorId`.  
- **Zéro donnée obsolète** persistante après invalidation ciblée.

Le rapport final (voir `RAPPORT FINAL`) devra **démontrer par scénario** que toutes les vues publiques affichent immédiatement les nouvelles informations — sans F5.

> **Note :** cette validation est **read-only** sur les modules gelés — aucune modification de leur code certifié.

---

###############################################################################
# ÉTAPE C
# EVENT MAPPING
############################################################################===

Implémenter uniquement les événements validés.

Exemples :

• `creator.artist.updated` (registry)  
• `artist.profile.updated`  
• `artist.avatar.updated`  
• `artist.cover.updated`  
• `artist.social.updated`  
• `artist.verification.updated`  
• `artist.badges.updated`  
• `artist.level.updated`  
• `artist.statistics.updated`  
• `profile.invalidate`  
• `identity.profile.updated` · `identity.invalidate` (bridge LDSE)

Préparer uniquement (sans consommation active) :

• `wallet.balance.updated`  
• `creator.analytics.invalidate`  
• `wallet.royalty.generated`  
• `stream.play.recorded`

Ne jamais écouter :

• `publication.draft.*`  
• `upload.progress`  
• `cover.upload.progress`  
• `metadata.completed`

Tout événement inutile doit être ignoré.

Cartographie complète : `ARTIST-PROFILE-EVENT-MAP.md`

---

###############################################################################
# ÉTAPE D
# LIVE INTEGRATION
############################################################################===

Connecter Artist Profile exclusivement via :

• `useLiveQuery()`  
• `useEventSubscription()`  
• Synchronization Engine  
• Event Bus  
• Event Registry

Interdiction absolue :

- communication directe entre modules  
- import croisé  
- appels directs

Toute communication passe exclusivement par le SRTSP.

### Points d'intégration certifiés

| Surface | Hook |
|---|---|
| `/creator/identity` | `useArtistProfileSrtspLive` |
| `/creator/verification` | `useArtistVerificationsSrtspLive` |
| SSOT query | `useArtistProfileSrtspLiveQuery` |
| Adaptateur | `artist-profile-hub-consumer.ts` · `shouldRefreshArtistProfileHub` |

---

###############################################################################
# ÉTAPE E
# COMPORTEMENTS ATTENDUS
############################################################################===

Après modification du profil :

↓  
Le Hero est mis à jour automatiquement.

---

Après changement d'avatar :

↓  
Toutes les vues utilisant l'avatar sont synchronisées.

---

Après changement de bannière :

↓  
Le Profil est mis à jour immédiatement.

---

Après mise à jour Analytics :

↓  
Les statistiques publiques évoluent automatiquement (événements préparés — activation future).

---

Après mise à jour Wallet :

↓  
Seuls les indicateurs autorisés sont rafraîchis (événements préparés — activation future).

---

`profile.invalidate` / `identity.invalidate`

↓  
Refresh ciblé uniquement.

---

Aucun rechargement manuel.  
Aucun F5.

---

###############################################################################
# PROPAGATION VALIDATION
############################################################################===

**Exigence Enterprise — Scénarios de propagation obligatoires**

Chaque scénario ci-dessous doit être validé en **chaîne automatique** (SRTSP → consommateurs → UI). Aucun rechargement manuel. Aucun F5.

### Matrice de propagation (par attribut)

| Attribut modifié | Profil | Dashboard | Catalogue | Analytics | Auditeur | Super Admin |
|---|---|---|---|---|---|---|
| Avatar | ✅ | ✅ | — | — | ✅ | ✅ |
| Bannière / cover | ✅ | ✅ | — | — | ✅ | ✅ |
| Nom d'artiste | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Biographie | ✅ | — | — | — | ✅ | ✅ |
| Réseaux sociaux | ✅ | — | — | — | ✅ | — |
| Badge / vérification | ✅ | ✅ | — | — | ✅ | ✅ |
| Niveau carrière | ✅ | ✅ | — | — | — | ✅ |
| Genres | ✅ | — | ✅ | — | ✅ | — |
| Stats publiques | ✅ | ✅ | — | ✅ | ✅ | — |

*(— = pas d'affichage identité direct — pas de test requis)*

### Scénarios détaillés (format obligatoire rapport)

**Avatar**

```
Modification Avatar (Profil / crop / upload)
  ↓ Propagation Profil (/creator/identity)
  ↓ Propagation Dashboard (Hero — via SRTSP, module gelé)
  ↓ Propagation Workspace Auditeur (profil public)
  ↓ Propagation Workspace Super Admin (fiche artiste)
```

**Nom · Bannière · Badge · Biographie · Réseaux · Niveau · Genres · Vérification**

→ Même structure de chaîne, adaptée à la matrice ci-dessus.

### Critères de succès propagation

- Temps de propagation mesurable (voir `PERFORMANCE HARDENING`).  
- Aucune perte d'événement (dedupe + journal SRTSP Phase 2.2).  
- Filtre `creatorId` / `userId` respecté — pas de fuite cross-tenant.

---

###############################################################################
# ÉTAPE F
# PERFORMANCE
############################################################################===

Le Profil ne doit jamais :

- recharger toute la page  
- relancer toutes les requêtes  
- provoquer des re-render inutiles

Utiliser uniquement :

• invalidations ciblées  
• cache intelligent  
• refresh ciblé

---

###############################################################################
# PERFORMANCE HARDENING
############################################################################===

**Exigence Enterprise — Complète `ÉTAPE F`**

Renforce les contraintes performance sans les remplacer.

### Interdictions explicites

| Pattern | Statut |
|---|---|
| `router.refresh()` | ❌ Interdit sur surfaces Profil |
| `window.location.reload()` | ❌ Interdit |
| Refresh global non ciblé | ❌ Interdit |
| Refetch mount si `initialData` SSR disponible | ❌ Interdit (`skipInitialFetch: true`) |

### Patterns obligatoires

✓ Invalidations ciblées (`shouldRefreshArtistProfileHub`)  
✓ Cache intelligent (clés query `artist-profile:{creatorId}`)  
✓ Refresh ciblé (`liveQuery.refresh()` post-événement)  
✓ Mémorisation composants présentation (`memo` où applicable)  
✓ Optimisation React (sync état formulaire via `useEffect` sur `liveData` uniquement)

### Métriques obligatoires — rapport final

| Métrique | Seuil Enterprise cible |
|---|---|
| Temps propagation (événement → UI visible) | ≤ 500 ms (local) · ≤ 2 s (transport Supabase) |
| Temps refresh ciblé (fetch API) | ≤ 1 s P95 |
| Re-render par événement | ≤ 1 subtree Profil |
| Requêtes par invalidation | ≤ 1 fetch par hook actif |
| Requêtes au mount (SSR → client) | 0 (skipInitialFetch) |

Instrumentation : pipeline trace SRTSP Phase 2.2 (`enablePipelineTrace` en staging).

---

###############################################################################
# ÉTAPE G
# TESTS
############################################################################===

Tester :

✓ propagation  
✓ temps réel  
✓ avatar  
✓ bannière  
✓ statistiques  
✓ badges  
✓ niveau  
✓ vérification  
✓ cache  
✓ concurrence  
✓ retry  
✓ offline  
✓ mémoire  
✓ CPU  
✓ déduplication

Aucune perte d'événement.

### Tests automatisés obligatoires

- `artist-profile-hub-consumer.test.ts` — filtre événements · scope · ignored · prepared  
- Suite SRTSP globale — régression 83/83 minimum  
- Scénarios manuels — matrice `PROPAGATION VALIDATION`

---

###############################################################################
# ÉTAPE H
# AUDIT FINAL
############################################################################===

Produire :

• Audit UX/UI  
• Audit Frontend  
• Audit Backend  
• Audit Database  
• Audit Performance  
• Audit Sécurité  
• Audit Architecture  
• Audit Forensic 360° (voir section dédiée)

---

###############################################################################
# FORENSIC 360°
############################################################################===

**Exigence Enterprise — Inspection exhaustive post-intégration**

Contrôler systématiquement :

| Zone | Contrôle |
|---|---|
| Hooks | Hooks morts · listeners dupliqués |
| Services | Services inutilisés · appels Supabase hors couche API |
| Imports | Imports inutilisés · circular dependencies |
| Composants | Components inutilisés · re-render inutiles |
| Cache | Cache obsolète · clés LDSE non invalidées |
| Events | Event listeners dupliqués · handlers inutilisés |
| Mémoire | Memory leaks · subscriptions non nettoyées |
| Code | Dead code · duplication de logique |
| Dette | Dettes techniques créées · documentées |

### Classification anomalies (rapport obligatoire)

| Priorité | Définition | Impact certification |
|---|---|---|
| **P0** | Fuite sécurité · perte événement · régression module gelé | 🔴 Certification refusée |
| **P1** | Désynchronisation identité · double fetch · fuite cross-tenant | 🔴 Certification refusée |
| **P2** | Re-render excessif · cache stale · dette documentée | ⚠️ Certification conditionnelle |
| **P3** | Cosmétique · doc · optimisations futures | ✅ Acceptable post-freeze |

Chaque anomalie détectée doit être listée avec : fichier · root cause · remédiation · priorité.

---

###############################################################################
# NON REGRESSION VALIDATION
############################################################################===

**Exigence Enterprise — Gate certification bloquant**

L'implémentation Phase 3.7 **ne doit jamais modifier** le comportement, le code certifié, ni les contrats des modules suivants :

| Module gelé | Version freeze | Validation |
|---|---|---|
| Publication Wizard | v3.1.0 | Diff + tests E2E wizard |
| Mes publications | v3.2.0 | Diff + `usePublicationsSrtspLive` intact |
| Dashboard | v3.3.0 | Diff + `useCreatorDashboardSrtspLive` intact |
| Catalogue Hub | v3.4.0 | Diff adaptateurs catalogue intact |
| Analytics | v3.5.0 | Diff adaptateurs analytics intact |
| Wallet Hub | v3.6.0 | Diff adaptateurs wallet intact |
| Workspace Auditeur | — | Aucun fichier `listener/` modifié |
| Workspace Super Admin | — | Aucun fichier `admin/` modifié |

### Critères bloquants

- Toute modification de fichier appartenant à un module gelé → **certification refusée**.  
- Toute régression `pnpm build` · `pnpm lint` · `pnpm typecheck` · tests SRTSP → **certification refusée**.  
- Toute modification `domain-events.ts` ou contrats registry certifiés → **certification refusée**.

Validation : `git diff` ciblé périmètre Phase 3.7 + CI 130/130 probes.

---

###############################################################################
# CERTIFICATION
############################################################################===

Attribuer un score :

UX/UI · Frontend · Backend · Database · Performance · Sécurité · Architecture · Maintenabilité

Décision :

🟢 **CERTIFIÉ**

ou

🔴 **NON CERTIFIÉ**

Si certifié :

```
Artist Profile Live Integration
        ↓
    CERTIFIÉ
        ↓
      FREEZE v3.7.0
```

**Conditions Enterprise supplémentaires (addendum) :**

- Identity Synchronization validée (matrice champs)  
- Cross Module Validation documentée (scénarios passants)  
- Propagation Validation exécutée (0 F5)  
- Performance Hardening mesuré (seuils respectés)  
- Forensic 360° sans P0/P1 ouvert  
- Non Regression Validation sans écart module gelé

---

###############################################################################
# RÈGLES OFFICIELLES SONAFRIK
############################################################################===

Respecter obligatoirement :

```
Audit
  ↓
Root Cause
  ↓
Architecture Review
  ↓
Identity Synchronization (Enterprise)
  ↓
Cross Module Validation (Enterprise)
  ↓
Plan de Remédiation
  ↓
Corrections ciblées
  ↓
Propagation Validation (Enterprise)
  ↓
Performance Hardening (Enterprise)
  ↓
Tests
  ↓
Forensic 360° (Enterprise)
  ↓
Non Regression Validation (Enterprise)
  ↓
Re-audit
  ↓
Certification
  ↓
Freeze
```

Ne jamais modifier :

- Publication Wizard · Mes publications · Dashboard · Catalogue · Analytics · Wallet  
- Workspace Auditeur · Workspace Super Admin  
- Logique métier · Event Registry · Contrats SRTSP certifiés

Toute communication passe exclusivement par le SRTSP.

---

###############################################################################
# VALIDATION TECHNIQUE
############################################################################===

Exécuter obligatoirement :

✓ Typecheck  
✓ ESLint  
✓ Tests (`@sonafrik/realtime` — 83/83 minimum)  
✓ Build Production  
✓ Nettoyage complet des caches de développement (`.next` et caches pertinents)  
✓ Redémarrage automatique du serveur  
✓ Vérification complète de l'absence de régression (`NON REGRESSION VALIDATION`)

---

###############################################################################
# RAPPORT FINAL
############################################################################===

Produire :

• Audit Artist Profile  
• Architecture Review  
• Event Mapping (`ARTIST-PROFILE-EVENT-MAP.md`)  
• Identity Synchronization — matrice champs validée  
• Cross Module Validation — tableau scénarios  
• Propagation Validation — chaînes exécutées  
• Validation SRTSP  
• Validation des mises à jour automatiques  
• Performance Hardening — métriques mesurées  
• Forensic 360° — anomalies P0→P3  
• Non Regression Validation — diff modules gelés  
• Tests  
• Performance  
• Sécurité  
• Risques restants  
• Score final  
• Décision finale

Si la certification est obtenue :

```
🟢 CERTIFIÉ
     ↓
🧊 FREEZE v3.7.0
     ↓
Proposer le Commit (sur validation explicite)
```

---

###############################################################################
# CONTRÔLE QUALITÉ
############################################################################===

Avant clôture du programme :

| Critère | Statut requis |
|---|---|
| Cohérence inter-sections | ✅ |
| Absence de doublons contradictoires | ✅ |
| Homogénéité style SONAFRIK SRTSP | ✅ |
| Lisibilité et numérotation | ✅ |
| Compatibilité Phases 2.1 → 3.6 | ✅ |
| Conformité SRTSP (bus · registry · adaptateurs) | ✅ |
| Enterprise Addendum intégré sans réécriture | ✅ |

---

*Document officiel Phase 3.7 — Artist Profile Live Integration — Enterprise Ready*
