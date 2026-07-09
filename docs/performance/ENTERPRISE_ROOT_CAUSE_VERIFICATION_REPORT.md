# SONAFRIK — Mes Publications

## Enterprise Root Cause Verification

Date : **2026-07-09**  
Module : `Mes publications`  
Route : `/creator/catalog/tracks`  
Run CI de référence : **`29008531041`**  
Environnement de preuve : **GitHub Actions / Linux / `next start` / route authentifiée**

---

## Résumé exécutif

La mission ne portait **pas** sur une remédiation mais sur une **vérification causale** des écarts qui bloquent encore la certification Enterprise.

Conclusion :

1. Le blocage principal desktop n'est **pas** le réseau, le bundle brut, les images ni les tiers.
2. Le blocage principal desktop est une **charge JS/hydratation initiale trop élevée dans le shell créateur et ses wrappers client globaux**, qui explose le **TBT**.
3. Le blocage accessibilité final est **structurel et localisé** :
   - absence de landmark `main` ;
   - usage ARIA incorrect des filtres (`role="tablist"` avec enfants `button[aria-busy][aria-pressed]`) ;
   - contrastes insuffisants dans la navigation/sidebar desktop.
4. Le blocage SEO final est **prouvé** : Lighthouse ne voit **aucune `meta-description`** dans l'HTML final, alors que la route exporte bien un objet `metadata`. Le problème n'est donc plus "absence de code", mais **non-matérialisation effective de la metadata route dans le document audité**.
5. Le blocage Best Practices mobile est **exactement** l'audit Lighthouse `bf-cache`, échoué à cause du couple **WebSocket + `Cache-Control: no-store`**.
6. Le blocage FCP n'est pas causé par le TTFB. Il vient d'un **chemin critique initial encore trop chargé** : document dynamique, 2 feuilles CSS bloquantes, shell client global, et hydratation initiale.

---

## Périmètre de preuve

### Artifacts vérifiés

- `apps/web/perf-artifacts-final-29008531041/lighthouse-publications-desktop.report.json`
- `apps/web/perf-artifacts-final-29008531041/lighthouse-publications-mobile.report.json`
- `apps/web/perf-artifacts-final-29008531041/cwv-publications.json`
- `docs/performance/B3_4_ENTERPRISE_FINAL_CERTIFICATION_REPORT.md`

### Source code vérifiée

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/(creator)/layout.tsx`
- `apps/web/src/app/(creator)/creator/catalog/tracks/page.tsx`
- `apps/web/src/features/creator/publications/components/PublicationsLibrary.tsx`
- `apps/web/src/features/creator/publications/hooks/usePublicationsSrtspLive.ts`
- `apps/web/src/features/creator/components/CreatorLayoutClient.tsx`
- `apps/web/src/features/shared/ldse/RootLdseShell.tsx`
- `apps/web/src/features/shared/srtsp/RootSrtspShell.tsx`
- `apps/web/src/features/shared/ldse/LdseProvider.tsx`
- `apps/web/src/features/shared/navigation/MusicHeader.tsx`
- `apps/web/src/app/styles/creator.css`
- `apps/web/src/app/styles/music-navigation.css`

### Limitation de preuve

Les artifacts archivés contiennent les rapports Lighthouse HTML/JSON et les métriques Playwright/CWV, mais **pas de trace DevTools brute autonome exportée séparément**.  
La preuve "trace / flame chart" de ce rapport repose donc sur les audits Lighthouse dérivés de trace (`mainthread-work-breakdown`, `bootup-time`, `render-blocking-insight`, `bf-cache`, `script-treemap-data`) et sur le mapping source.

Cette limitation est classée **D — Limitation environnement / artefact archivé**, pas comme absence d'analyse.

---

## Tableau des métriques bloquantes

| Axe | Valeur | Seuil | Verdict | Cause racine dominante |
|---|---:|---:|---|---|
| Desktop Performance | 52 | >= 95 | ❌ | TBT desktop extrême + hydratation/client shell trop coûteux |
| Desktop TBT | 1774 ms | <= 300 ms | ❌ | exécution JS initiale + travail main thread |
| Desktop Accessibility | 91 | >= 95 | ❌ | `main` absent + ARIA `tablist` invalide + contrastes sidebar |
| Desktop SEO | 91 | >= 95 | ❌ | `meta-description` absente dans le document audité |
| Mobile Performance | 85 | >= 95 | ❌ | chemin critique initial (CSS + hydratation + document dynamique) |
| Mobile Best Practices | 96 | = 100 | ❌ | audit Lighthouse `bf-cache` échoué |
| Mobile SEO | 91 | >= 95 | ❌ | `meta-description` absente |
| CWV FCP | 1880 ms | < 1800 ms | ❌ | rendu initial encore retardé par CSS/hydratation/document dynamique |

---

## Phase 1 — Desktop Performance Investigation

### Constat de départ

Le run final donne :

- Desktop Performance = **52**
- LCP = **1928 ms** ✅
- CLS = **0.0048** ✅
- TTFB = **606 ms** ✅
- Bundle route = **239 kB first load JS** ✅
- TBT = **1774 ms** ❌

La chute du score desktop ne vient donc **pas** d'un LCP catastrophique ni d'un bundle hors budget. Elle vient presque entièrement du **temps CPU bloquant**.

### Preuves Lighthouse

- `total-blocking-time` : **1773.5 ms**
- `mainthread-work-breakdown` : **4823.8 ms**
- `bootup-time` : **1914.0 ms**

Détail main thread :

- Script Evaluation : **1979.3 ms**
- Other : **1626.3 ms**
- Style & Layout : **723.0 ms**
- Parse HTML & CSS : **296.4 ms**
- Script Parse/Compile : **88.8 ms**

### Arbre de causalité desktop

`Desktop Performance 52`
-> `TBT 1774 ms`
-> `main thread 4824 ms`
-> `Script evaluation 1979 ms`
-> `Hydratation + initialisation shell client`
-> `Wrappers client globaux montés avant la feature`
-> `RootLdseShell` + `RootSrtspShell` + `LdseProvider` + `PerformanceProvider` + `ToastProvider` + `CreatorMobileNav`
-> `activité runtime initiale + listeners + providers + navigation client`
-> `TTI retardé malgré un LCP correct`

Facteurs aggravants :

- page dynamique (`force-dynamic`) ;
- layout créateur entièrement riche avant le contenu ;
- 2 feuilles CSS bloquantes ;
- JS inutilisé encore significatif dans plusieurs chunks ;
- payload React Flight inline important dans le document initial.

### Ce qui est explicitement exclu comme cause principale

- Images : pas d'audit bloquant `uses-optimized-images` ou `modern-image-formats`
- Compression : `uses-text-compression` = ✅
- Tiers : `third-parties-insight` vide
- Fonts : `font-display` = ✅
- CLS : très faible, donc non contributif

---

## Phase 2 — Main Thread Investigation

### Preuves CPU/chunks

Audit `bootup-time` desktop :

| Ressource | CPU total |
|---|---:|
| document `/creator/catalog/tracks` | 1733.9 ms |
| chunk `5322-b50f2390aa9dfebb.js` | 1376.5 ms |
| `Unattributable` | 1216.6 ms |
| chunk `50e5fc21-baf2e2e3e00a9f2d.js` | 195.8 ms |
| chunk `2472-c1d9d6264620ef9a.js` | 75.9 ms |

Audit `script-treemap-data` desktop :

| Ressource | Taille encodée | JS inutilisé |
|---|---:|---:|
| chunk `5322-b50f2390aa9dfebb.js` | 46.6 kB | 66.9 kB |
| chunk `50e5fc21-baf2e2e3e00a9f2d.js` | 54.4 kB | 42.2 kB |
| document inline `/creator/catalog/tracks` | 10.4 kB | 0 |

### Mapping source -> causes plausibles prouvées

| Cause observée | Preuve | Impact | Temps CPU / poids | Correction potentielle |
|---|---|---|---:|---|
| Shell realtime global monté sur toute la zone créateur | `apps/web/src/app/(creator)/layout.tsx`, `RealtimeShell`, `RootLdseShell`, `RootSrtspShell` | initialise providers, bridge, transport, listeners avant usage métier | contribue au document + au JS initial | réduire le shell client global sur cette route ou différer ce qui n'est pas critique au first paint |
| `RootSrtspShell` crée le transport Supabase et monte `SrtspProvider` | `RootSrtspShell` lignes 18-31 | coût runtime et incompatibilité bf-cache | contributif au CPU initial | activer à la demande ou retarder la connexion |
| `RootLdseShell` exécute `registerLdseDomainRules()` au mount | `RootLdseShell` lignes 11-23 | travail client systématique au chargement | contributif au bootstrap | déplacer/enregistrer plus finement par domaine |
| `LdseProvider` abonne globalement `subscribeAll()` | `LdseProvider` lignes 56-61 | listeners et invalidation globaux | contributif au travail "Other" | scope plus étroit ou lazy mount |
| Layout créateur client enrichi | `CreatorLayoutClient` lignes 17-23 | `ToastProvider` + `CreatorMobileNav` sur toutes les pages | contributif au JS initial | réserver au contexte où ils sont requis |
| `PublicationsLibrary` côté client riche | route rendue via `PublicationsLibrary.tsx` | `useRouter`, `useSearchParams`, multiples `useEffect`, `useMemo`, détail dynamique | hydratation feature coûteuse | découper la partie interactive visible dès le first paint |
| `usePublicationsSrtspLive` | hook lignes 50-157 | `useLiveQuery`, invalidations, fetch orchestration, caches refs | coût d'hydratation et logique client | différer le live après paint ou après interaction |

### Localisation des zones de code les plus impliquées

- `apps/web/src/app/(creator)/layout.tsx`
- `apps/web/src/features/shared/rendering/RealtimeShell.tsx`
- `apps/web/src/features/shared/ldse/RootLdseShell.tsx`
- `apps/web/src/features/shared/srtsp/RootSrtspShell.tsx`
- `apps/web/src/features/shared/ldse/LdseProvider.tsx`
- `apps/web/src/features/creator/components/CreatorLayoutClient.tsx`
- `apps/web/src/features/creator/publications/components/PublicationsLibrary.tsx`
- `apps/web/src/features/creator/publications/hooks/usePublicationsSrtspLive.ts`

### Conclusion Main Thread

Le **TBT 1774 ms** n'est pas relié à un unique composant fautif, mais à un **empilement de client wrappers transversaux** plus la feature `PublicationsLibrary` hydratée d'emblée.  
La cause racine est donc principalement **E — Choix d'architecture**, avec une sous-part **B — Dette technique** liée au périmètre trop large du shell client.

---

## Phase 3 — Accessibility Investigation

### Écarts réellement démontrés

#### 1. Landmark principal manquant

- Audit : `landmark-one-main`
- Preuve : le document audité ne contient pas de landmark `main`
- Mapping code : `apps/web/src/app/(creator)/layout.tsx` rend des `div` structurantes mais pas de `<main>`
- Impact WCAG : navigation structurelle / repère principal
- Catégorie : **A — Bug produit**

#### 2. ARIA `tablist` invalide dans les filtres catalogue

- Audit : `aria-required-children`
- Élément Lighthouse : `div.pub-catalog__filters[role="tablist"]`
- Règle échouée : enfants `button[aria-busy]` non autorisés dans ce pattern
- Mapping code : `apps/web/src/features/creator/publications/components/PublicationsLibrary.tsx`
- Cause précise : usage d'un `role="tablist"` avec des boutons qui se comportent comme des toggles (`aria-pressed`) et non comme des tabs ARIA complètes
- Impact WCAG : `wcag131`, structure/relations ARIA
- Catégorie : **A — Bug produit**

#### 3. Contrastes insuffisants desktop dans la sidebar/navigation

Éléments explicitement remontés :

- `p.music-sidebar__story-eyebrow`
- `p.music-nav__section-title` pour plusieurs sections (`COMPRENDRE`, `CRÉER`, `REVENUS`)

Mapping source :

- `apps/web/src/app/styles/music-navigation.css`
  - `.music-sidebar__story-eyebrow`
  - `.music-nav__section-title`

Nature du défaut :

- textes trop petits (`10px` et `9px`) ;
- ratios de contraste mesurés à **4.4** et **4.03** pour un seuil attendu **4.5:1**.

Impact WCAG :

- contraste texte ;
- lisibilité desktop ;
- score A11y desktop.

Catégorie : **A — Bug produit**

### Points non démontrés comme bloquants

- labels de formulaires : ✅
- noms accessibles des boutons : ✅
- rôles parents ARIA : non applicable
- clavier / focus visible : pas d'échec Lighthouse démontré sur le run final

---

## Phase 4 — SEO Investigation

### Ce qui passe

- `<title>` : ✅
- robots : ✅
- crawlabilité : ✅
- HTTP status : ✅
- `hreflang` : ✅

### Ce qui échoue

#### 1. `meta-description`

- Audit : `meta-description`
- Résultat : **0** desktop et mobile
- Preuve : Lighthouse déclare explicitement `Document does not have a meta description`

### Ce que montre le code

La route exporte bien :

- `title`
- `description`

dans `apps/web/src/app/(creator)/creator/catalog/tracks/page.tsx`.

Le layout racine exporte aussi :

- `metadataBase`
- `description`
- `openGraph`
- `twitter`
- `robots`
- `manifest`

dans `apps/web/src/app/layout.tsx`.

### Cause racine vérifiée

Le problème n'est **pas** l'absence de déclaration `metadata` dans le code source.  
Le problème vérifié est la **non-présence effective** de cette meta description dans le document HTML audité par Lighthouse.

Donc la cause racine est :

- soit une **non-propagation App Router** sur cette route/auth flow ;
- soit un **comportement de rendu dynamique/authentifié** qui neutralise la metadata attendue ;
- dans tous les cas, **le produit livré au navigateur ne contient pas la balise**.

Catégorie :

- **A — Bug produit** si la balise n'est effectivement jamais rendue sur la page ;
- **E — Choix d'architecture** comme facteur contributif, car la route est `force-dynamic` et authentifiée.

### Canonical / Open Graph / Twitter / Robots / Schema.org

| Axe | État vérifié | Conclusion |
|---|---|---|
| Canonical | audit Lighthouse `canonical` = non applicable | pas de preuve d'écart bloquant, mais pas de canonical route-spécifique démontré |
| Open Graph | présent au layout racine | pas d'échec Lighthouse bloquant, mais métadonnées génériques et non spécifiques à la route |
| Twitter | présent au layout racine | idem, non bloquant dans le score Lighthouse final |
| Robots | présent au layout racine, audit crawlable ✅ | pas de blocage |
| Schema.org | audit manuel | aucune preuve de structured data route-spécifique ; non compté comme blocage Lighthouse final |

---

## Phase 5 — Best Practices Investigation

### Règle exacte qui bloque

Le score mobile Best Practices n'est pas 100 à cause de l'audit :

- `bf-cache`

### Preuve Lighthouse

Raisons exactes :

1. `Pages with WebSocket cannot enter back/forward cache.`
2. `Pages whose main resource has cache-control:no-store cannot enter back/forward cache.`
3. `Back/forward cache is disabled because some JavaScript network request received resource with Cache-Control: no-store header.`
4. `WebSocketUsedWithCCNS`

### Mapping source

- `RootSrtspShell` monte `SrtspProvider` et crée un transport Supabase
- la route est authentifiée/dynamique
- la page est servie dans un contexte où `no-store` est attendu

### Conclusion

Le non-100 Best Practices mobile est **entièrement expliqué** par l'incompatibilité Lighthouse `bf-cache` entre :

- realtime WebSocket ;
- document/auth/data marqués `no-store`.

Catégorie :

- **E — Choix d'architecture** pour WebSocket temps réel ;
- **D — Limitation environnement** pour l'aspect bfcache appliqué à un flux authentifié/no-store ;
- pas une régression aléatoire.

---

## Phase 6 — FCP Investigation

### Mesures officielles

- FCP CWV : **1880 ms** ❌
- TTFB CWV : **218 ms** ✅
- FCP desktop Lighthouse : **655 ms** ✅
- FCP mobile Lighthouse : **1224 ms** ✅

### Lecture causale

Le FCP qui bloque la certification est le **FCP CWV Playwright** à **1880 ms**, pas un FCP Lighthouse catastrophique.

### Causes démontrées

1. **TTFB non responsable**
   - 218 ms CWV
   - 606 ms desktop Lighthouse mais encore dans le budget Enterprise

2. **Ressources CSS bloquantes**
   - `render-blocking-insight` = échec
   - CSS `afc8c8da11ce1c0d.css`
   - CSS `d0e60fbefcc4a846.css`
   - savings estimées : **150 ms FCP / LCP**

3. **CSS largement inutilisé chargé trop tôt**
   - `unused-css-rules`
   - **16 KiB** économisables
   - `creator.css` importe tout le domaine créateur (`dashboard`, `hero`, `glance`, `panels`, `cover-studio`, `pub-wizard`, `publications`, `mobile`, `analytics`)

4. **Hydratation et shell client initial**
   - le contenu visible n'est pas retardé par le réseau seul ;
   - il est accompagné d'un shell client riche avant stabilité visuelle.

5. **Document dynamique**
   - `force-dynamic` sur la page ;
   - `connection()` dans `app/layout.tsx` ;
   - cohérent avec un rendu plus coûteux qu'une page statique ou partiellement statique.

### Ce qui n'est pas cause racine

- DNS/connexion : pas d'indice bloquant dans les artifacts
- images : pas d'audit image bloquant
- compression : ✅
- fonts : `font-display` ✅

### Conclusion FCP

Le dépassement FCP est un **résidu de chemin critique initial**, pas un problème backend ni image.

Catégorie :

- **B — Dette technique** pour le CSS global importé trop largement ;
- **E — Choix d'architecture** pour le rendu dynamique + shell client.

---

## Phase 7 — Cross Validation

### Comparaison des sources

| Source | LCP | FCP | TTFB | Long tasks | Lecture |
|---|---:|---:|---:|---:|---|
| CI final `cwv-publications.json` | 1880 | 1880 | 218 | 0 | preuve officielle certification |
| Artifact local `perf-artifacts-ci/cwv-publications.json` | 2040 | 2040 | 388 | 0 | même tendance, FCP/LCP proches |
| Desktop Lighthouse CI | 1928 | 655 | 606 | TBT 1774 | score cassé par CPU, pas par FCP |
| Mobile Lighthouse CI | 3760 | 1224 | 205 | TBT 105 | score cassé par LCP mobile + rendu critique |

### Incohérences apparentes expliquées

#### "Pourquoi Playwright voit 0 long task mais Lighthouse voit TBT 1774 ?"

Parce que :

- le script Playwright capte des long tasks runtime via `PerformanceObserver` dans une fenêtre précise ;
- Lighthouse simule/scorise la charge du thread principal sur le chargement complet.

Ce n'est **pas** contradictoire :

- Playwright dit : peu de longues tâches observables dans la fenêtre instrumentée ;
- Lighthouse dit : le thread principal reste trop chargé pour être interactif rapidement.

Catégorie : **C — Limitation Lighthouse** partielle sur la comparabilité directe des métriques, sans invalider le diagnostic.

#### "Pourquoi FCP Lighthouse est bon mais FCP CWV échoue ?"

Parce que :

- ce ne sont pas exactement les mêmes méthodes de capture ;
- le run de certification Enterprise retient le **FCP CWV officiel** comme preuve prioritaire pour le budget CWV.

Catégorie : **C — Limitation Lighthouse**

---

## Phase 8 — Architecture Validation

### Vérification

Les métriques sont dégradées par des choix d'architecture identifiables :

| Axe architecture | Preuve | Effet |
|---|---|---|
| App Router dynamique | `force-dynamic` sur la page | empêche certaines optimisations de rendu/cache |
| Layout créateur riche | `app/(creator)/layout.tsx` | beaucoup de structure et de logique avant le contenu métier |
| Providers globaux client | `RealtimeShell`, `RootLdseShell`, `RootSrtspShell`, `PerformanceProvider`, `ToastProvider` | hausse du JS initial et de l'hydratation |
| Realtime/WebSocket | `RootSrtspShell` | impact bfcache + coût bootstrap |
| CSS agrégé domaine créateur | `creator.css` | CSS inutile chargé au first paint |
| Navigation client/mobile commune | `CreatorMobileNav` + `usePathname` | JS transversal même hors besoin critique |

### Conclusion architecture

Le module n'est pas bloqué par une seule "erreur d'implémentation" mais par un **socle transverse trop lourd pour une route qui doit être certifiée au niveau Enterprise**.

Catégorie dominante : **E — Choix d'architecture**

---

## Phase 9 — Preuves consolidées par problème

| Problème | Capture Lighthouse | Preuve source | Catégorie |
|---|---|---|---|
| TBT desktop 1774 ms | `total-blocking-time`, `mainthread-work-breakdown`, `bootup-time`, `script-treemap-data` | layouts/providers/hooks client globaux | E / B |
| ARIA filtres invalide | `aria-required-children` | `PublicationsLibrary.tsx` (`role="tablist"` + `aria-busy` / `aria-pressed`) | A |
| `main` manquant | `landmark-one-main` | `app/(creator)/layout.tsx` sans `<main>` | A |
| Contrastes desktop sidebar | `color-contrast` | `music-navigation.css` (`.music-sidebar__story-eyebrow`, `.music-nav__section-title`) | A |
| Meta description absente | `meta-description` | metadata présente en code mais absente en HTML audité | A / E |
| Best Practices mobile 96 | `bf-cache` | `RootSrtspShell` + document/no-store | E / D |
| FCP CWV 1880 ms | `cwv-publications.json` + `render-blocking-insight` + `unused-css-rules` | `creator.css`, layout dynamique, shell client | B / E |

---

## Décision par écart

| Écart | Catégorie obligatoire | Justification |
|---|---|---|
| TBT desktop | **E — Choix d'architecture** | trop de shell client transverse monté au chargement |
| JS/CSS inutilisé initial | **B — Dette technique** | agrégation domaine large et sur-chargée pour la route |
| ARIA filtres | **A — Bug produit** | structure ARIA invalide |
| Absence de `main` | **A — Bug produit** | défaut sémantique du layout |
| Contrastes sidebar | **A — Bug produit** | défaut WCAG concret |
| `meta-description` absente | **A — Bug produit** | le document final reste non conforme |
| Propagation metadata route en App Router | **E — Choix d'architecture** | route dynamique/authentifiée, metadata non matérialisée |
| `bf-cache` mobile | **E — Choix d'architecture** + **D — Limitation environnement** | WebSocket + no-store en contexte authentifié |
| écart Playwright vs Lighthouse | **C — Limitation Lighthouse** | méthodes de mesure différentes |

---

## Conclusion Enterprise

### Ce qui est définitivement terminé

- la CI officielle Enterprise fonctionne ;
- les preuves officielles sont archivées ;
- les causes racines bloquantes sont maintenant **identifiées, localisées et classées** ;
- il n'y a plus de doute sur le fait que le blocage principal est **CPU/hydratation/architecture client**, pas le backend ni les images.

### Ce qui reste réellement bloquant

- TBT desktop
- shell client transverse trop coûteux
- landmark `main` manquant
- filtres ARIA invalides
- contrastes desktop sidebar
- `meta-description` absente dans le document final
- `bf-cache` mobile
- chemin critique initial encore trop lourd pour tenir le FCP Enterprise

### Les corrections finales à réaliser

Les corrections ne sont **pas** appliquées dans cette phase.  
Elles sont formalisées dans :

- `docs/performance/ENTERPRISE_CERTIFICATION_ACTION_PLAN.md`

Le prochain chantier devra être **l’ultime remédiation avant certification Enterprise définitive** de `Mes publications`.
