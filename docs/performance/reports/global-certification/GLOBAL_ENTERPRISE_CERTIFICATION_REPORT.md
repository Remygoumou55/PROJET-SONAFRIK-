# SONAFRIK
## CORE INFRASTRUCTURE
## PERFORMANCE HARDENING PROGRAM
## GLOBAL ENTERPRISE CERTIFICATION
## OFFICIAL FINAL CERTIFICATION REPORT

**Date :** 6 juillet 2026  
**Périmètre :** Sprint 1 → Sprint 7  
**Décision finale :** 🔴 **GLOBAL CERTIFICATION REFUSÉE**

---

## 1. Executive Summary

Le programme est **structurellement solide** sur l’architecture, le backend, la base de données, le runtime et le SRTSP. Les validations de build, lint, typecheck et toutes les suites de tests disponibles passent. Les audits sécurité et SRTSP ne montrent aucune régression bloquante.

La certification globale est néanmoins **refusée** car les nouvelles mesures Lighthouse exécutées sur l’environnement local de production montrent encore **deux écarts P0** sur les pages P0 métier :

- `/listen` : **LCP 3.6 s** > cible SONAFRIK **2.5 s**
- `/creator` : **LCP 3.2 s** > cible SONAFRIK **2.5 s**

Selon `docs/performance/reports/CORE_WEB_VITALS_REPORT.md`, le dépassement LCP sur pages P0 est un **bloquant certification P0**.

---

## 2. Root Cause Global

### Forces consolidées

- Navigation, rendering et runtime ont bien réduit les refresh inutiles, l’hydratation excessive et les timers non maîtrisés.
- Le backend est plus propre après Sprint 7 : agrégats catalogue sans chargement complet, batch upsert admin fraud.
- Le SRTSP reste conforme à sa constitution : invalidations ciblées, `skipInitialFetch`, aucune régression des modules gelés.
- La sécurité applicative reste fermée : CSP, middleware, guards auth, RLS et stockage mobile sécurisé.

### Causes bloquantes résiduelles

1. **LCP encore trop élevé sur surfaces métier P0**
   - `/listen` et `/creator` dépassent la cible officielle 4G.
2. **Bundle web P0 en hausse sur certaines routes**
   - `/listen` : **248 kB** First Load JS
   - `/creator` : **228 kB** First Load JS
3. **Dette payload/API encore visible**
   - `select("*")` reste largement présent dans les repositories API.
4. **Lighthouse remonte des erreurs console sur `/listen` et `/creator`**
   - non suffisantes à elles seules pour refuser, mais aggravent le verdict P0.

---

## 3. Architecture Review

### Verdict

**Architecture globale cohérente et stable.**

### Constat

- Séparation en silos respectée (`listener`, `creator`, `admin`, transversal `wallet`, `identity`, `shared`)
- Session Engine non modifié
- Contrats SRTSP inchangés
- Aucune évolution fonctionnelle introduite pendant cette certification
- Aucune modification d’architecture majeure

### Risque croisé

Aucune régression croisée détectée entre :

- Navigation
- Rendering
- Data Engine
- Asset Engine
- Runtime
- Database / Backend
- SRTSP

---

## 4. Performance Review

### Lighthouse relancé

Rapports générés :

- `docs/performance/reports/global-certification/lighthouse-lancement-global.json`
- `docs/performance/reports/global-certification/lighthouse-listen-global.json`
- `docs/performance/reports/global-certification/lighthouse-creator-global.json`

### Résultats actuels

| Route | Score perf | FCP | LCP | TBT | CLS | TTFB |
|---|---:|---:|---:|---:|---:|---:|
| `/lancement` | 98 | 1.2 s | 2.3 s | 0 ms | 0 | 470 ms |
| `/listen` | 89 | 1.2 s | **3.6 s** | 100 ms | 0 | 90 ms |
| `/creator` | 90 | 1.1 s | **3.2 s** | 190 ms | 0 | 50 ms |

### Verdict

- `/lancement` : conforme
- `/listen` : **non conforme**
- `/creator` : **non conforme**

---

## 5. Navigation Review

### État

- Tests navigation web : **13/13**
- Sprint 2 et Sprint 3 restent compatibles
- Pas de rechargement global détecté côté user flows principaux

### Conclusion

Navigation **certifiable isolément**, mais la certification globale reste bloquée par la performance P0 sur pages métier.

---

## 6. Rendering Review

### État

- `/lancement` conserve le gain Sprint 3
- `RealtimeShell` reste scoped
- Hydratation publique mieux contenue qu’au baseline

### Mesure comparable

| Route | Sprint 2 | Sprint 3 | Global |
|---|---:|---:|---:|
| `/lancement` LCP | 3.2 s | 2.3 s | 2.3 s |
| `/lancement` Perf | 92 | 93 | 98 |

### Conclusion

Le rendering public est stabilisé. Le problème n’est plus le landing, mais les surfaces métier riches `/listen` et `/creator`.

---

## 7. Data Engine Review

### Validations

- SRTSP : **100/100**
- Invalidations ciblées maintenues
- Pas de double refresh restauré
- `useLiveQuery()` reste conforme SSOT SRTSP

### Conclusion

Le Data Engine est **stable et compatible** avec les Sprints 4 à 7.

---

## 8. Asset Engine Review

### Validations

- `next/image`, AVIF/WebP, caches actifs
- icons/manifest stabilisés
- URLs signées stream à 900 s

### Dette

- URLs signées `catalog-asset`, `creator-asset`, `avatar` à 3600 s : acceptable mais à réduire plus tard

### Conclusion

Asset Engine **non bloquant**.

---

## 9. Runtime Review

### Validations

- Polling et timers arrière-plan stabilisés
- listeners runtime stables
- aucune régression build/runtime détectée

### Conclusion

Runtime **certifiable**.

---

## 10. Database Review

### Validations

- Index SQL en place
- RPC analytics déjà agrégées côté DB
- RLS maintenues
- pas de migration de schéma ajoutée durant la certification globale

### Dette

- dette `select("*")` encore large dans `packages/api`

### Conclusion

Database **solide**, dette surtout optimisationnelle.

---

## 11. Backend Review

### Validations

- Sprint 7 backend intact
- tests API : **351/351**
- optimisations catalogue/fraud en place

### Dette

- projections encore trop larges
- payloads inutiles dans plusieurs repositories

### Conclusion

Backend **stable**, non bloquant pour la certification globale.

---

## 12. Lighthouse

Lighthouse a été exécuté localement sur serveur de production existant (`localhost:3001`). Sous Windows, l’outil a échoué au nettoyage temporaire (`EPERM`) après exécution, **mais les rapports JSON ont bien été générés** et sont exploitables.

---

## 13. Core Web Vitals

Référence officielle : `docs/performance/reports/CORE_WEB_VITALS_REPORT.md`

### Seuils

- LCP ≤ 2.5 s = **bloquant P0**
- CLS ≤ 0.1 = bloquant
- INP ≤ 200 ms = bloquant
- FCP ≤ 1.8 s = avertissement
- TTFB ≤ 0.8 s = avertissement

### Résultat

- CLS : **OK** sur toutes les pages mesurées
- FCP : **OK**
- TTFB : **OK**
- LCP : **KO** sur `/listen` et `/creator`
- INP : non mesuré en field data ; pas de preuve de conformité globale terrain

### Verdict

**Core Web Vitals globaux non certifiés.**

---

## 14. Build Validation

### Rebuild propre exécuté

- suppression `.next`
- suppression `node_modules/.cache`
- rebuild complet monorepo

### Résultats

- `pnpm build` ✅
- `pnpm lint` ✅
- `pnpm typecheck` ✅

### Note

Le build Next remonte toujours le message de dynamic server usage sur `/creator`, sans échec de build.

---

## 15. Tests Validation

### Résultats

- `@sonafrik/realtime` : **100/100** ✅
- `@sonafrik/web` navigation/security : **13/13** ✅
- `@sonafrik/api` : **351/351** ✅

### Verdict

Zéro régression critique détectée dans les suites disponibles.

---

## 16. SRTSP Validation

### Constat

- Constitution SRTSP respectée
- modules gelés compatibles
- aucun `router.refresh()` généralisé sur surfaces SRTSP
- `useLiveQuery()` reste ciblé

### Verdict

SRTSP **certifié et non régressé**.

---

## 17. Mobile Validation

### Validation disponible

- build/typecheck mobile inclus dans monorepo ✅
- stockage session mobile via `expo-secure-store` ✅
- guard auth tabs mobile ✅
- heartbeat streaming mobile nettoyé au pause/stop/unmount ✅

### Limite

Pas de mesure device réelle batterie/réseau pendant cette certification.

### Verdict

Mobile **structurellement sain**, mais validation terrain encore partielle.

---

## 18. Security Validation

### Contrôles positifs

- RLS non affaiblie
- `BYPASS_AUTH` toujours bloqué sur Vercel
- middleware fail-closed
- CSP active
- SecureStore mobile actif
- aucun secret commité

### Dette

- CSP production garde `style-src 'unsafe-inline'`
- signed URLs non stream à 3600 s

### Verdict

Sécurité **acceptable** et **non dégradée** par les optimisations performance.

---

## 19. Forensic 360°

### P0

- `/listen` LCP 3.6 s > 2.5 s
- `/creator` LCP 3.2 s > 2.5 s

### P1

- erreurs console Lighthouse sur `/listen`
- erreurs console Lighthouse sur `/creator`

### P2

- `select("*")` encore très présent dans `packages/api/src/**/*.repository.ts`
- `setInterval()` encore présent sur plusieurs composants, même si les principaux cas critiques ont été corrigés
- First Load JS `/listen` au-dessus du gate historique 230 kB

### P3

- TTL signed URLs assets à harmoniser
- manque de mesures device réelles mobile

---

## 20. Dette technique restante

- projections SQL/API à resserrer
- routes P0 `/listen` et `/creator` à profiler pour LCP
- instrumentation field data INP/CWV à renforcer
- nettoyage erreurs console Lighthouse

---

## 21. Avant / Après (Programme)

### Mesures comparables disponibles

| Mesure | Baseline discovery / sprint initial mesurable | État global |
|---|---:|---:|
| Score performance programme | 69/100 | 86/100 estimé |
| `/lancement` LCP | 3.2 s (Sprint 2) | 2.3 s |
| `/lancement` TBT | 100 ms | 0 ms |
| Probes globales | 92/92 partiel | 92/92 toujours OK |
| SRTSP tests | 14 initiaux | 100 |
| API tests | 283 antérieurs | 351 |

### Régression observée

| Route | Baseline repo | État global |
|---|---:|---:|
| `/listen` First Load JS | 219 kB | 248 kB |
| `/creator` First Load JS | 111 kB | 228 kB |

---

## 22. Gains mesurés

- stabilité tests et SRTSP significativement améliorée
- `/lancement` rendu public stabilisé à 2.3 s LCP
- backend Sprint 7 plus efficient sur catalogue/fraud
- build global propre et reproductible

---

## 23. Recommandations minimales

**Aucune nouvelle fonctionnalité.**

Seulement les corrections minimales nécessaires à la re-certification :

1. profiler et réduire le LCP de `/listen`
2. profiler et réduire le LCP de `/creator`
3. éliminer les erreurs console Lighthouse sur ces deux routes
4. si nécessaire, réduire le First Load JS de `/listen` sous le gate historique

---

## 24. Score détaillé

| Axe | Note /100 |
|---|---:|
| Navigation | 90 |
| Rendering | 92 |
| Data Engine | 93 |
| Asset Engine | 88 |
| Runtime | 91 |
| Database | 88 |
| Backend | 90 |
| Frontend | 84 |
| Architecture | 93 |
| Mobile | 82 |
| Sécurité | 88 |
| Maintenabilité | 86 |

---

## 25. Score global

**Score global programme : 88/100**

### Décision officielle

🔴 **GLOBAL CERTIFICATION REFUSÉE**

### Motif unique

Les critères de performance web globale ne sont **pas encore satisfaits** à cause de **deux blocages P0 mesurés** sur `/listen` et `/creator`.

### Conséquence

Le **Performance Hardening Program n’est pas officiellement clôturé**.  
Le **FREEZE GLOBAL** ne peut pas être prononcé à ce stade.

### Suite autorisée

Uniquement :

- corrections minimales ciblées sur les blocages P0
- re-mesure Lighthouse / CWV
- re-audit final

---

## 26. P0 Remediation Re-Audit — 6 juillet 2026

### 26.1 Root Cause Analysis (prouvé Lighthouse)

#### `/listen` — avant remediation

| Métrique | Valeur |
|---|---:|
| LCP | **3.6 s** |
| FCP | 1.2 s |
| TBT | 100 ms |
| Élément LCP | `h1.listen-hero-greeting` |
| Element render delay | **1093 ms** |
| TTFB | 90 ms |

**Cause exacte :** `ListenHeroGreeting` était un composant client (`useDayMode`) — le H1 ne peignait qu’après hydratation (~1.1 s de délai post-FCP).

#### `/creator` — avant remediation

| Métrique | Valeur |
|---|---:|
| LCP | **3.2 s** |
| FCP | 1.1 s |
| TBT | 190 ms |
| Élément LCP | `nav.cs-nav` (sidebar) |
| Element render delay | **1239 ms** |
| TTFB | 50 ms |

**Causes exactes :**
1. Sidebar entière dans `CreatorLayoutClient` (client) → nav invisible jusqu’à hydratation
2. FOUC mobile : `aside.cs-sidebar` visible dans le HTML avant chargement CSS (`display:none` tardif)

---

### 26.2 Remédiations appliquées (minimales, sans logique métier)

| ID | Route | Fix | Fichiers |
|---|---|---|---|
| P0-L1 | `/listen` | Hero greeting rendu serveur via `getDayMode()` | `ListenHeroGreeting.tsx` |
| P0-L2 | `/listen` | Fetch parallèle contenu + identité, suppression Suspense page | `listen/page.tsx` |
| P0-C1 | `/creator` | Sidebar sortie du client boundary + `x-pathname` middleware | `CreatorSidebar.tsx`, `layout.tsx`, `middleware.ts` |
| P0-C2 | `/creator` | Header `h1` rendu serveur hors client layout | `CreatorWorkspaceHeader.tsx`, `creatorPageMeta.ts` |
| P0-C3 | `/creator` | FOUC sidebar : `style={{display:'none'}}` + `!important` desktop | `layout.css`, `CreatorSidebar.tsx` |
| P0-C4 | `/creator` | HeroCard SSR dans `page.tsx`, import statique, Suspense retiré | `creator/page.tsx`, `CreatorDashboardView.tsx` |
| P0-C5 | `/creator` | `content-visibility:auto` sur `.ahero` mobile | `creator/mobile.css` |

---

### 26.3 Mesures post-remediation (3 runs Lighthouse, médiane, prod locale `:3001`)

| Route | LCP avant | LCP après (médiane) | FCP après | TBT après | Élément LCP après | Verdict |
|---|---:|---:|---:|---:|---|---|
| `/listen` | 3.6 s | **4.1 s** | 1.4 s | 820 ms | cover `listen-track-card` | ❌ |
| `/creator` | 3.2 s | **3.2 s** | 1.3 s | 320 ms | `h1.creator-page-title` | ❌ |
| `/lancement` | 2.3 s | **2.2 s** | 1.0 s | 180 ms | `h1#lancement-hero-title` | ✅ |

Rapports : `lighthouse-*-global-final.json`

---

### 26.4 Analyse post-fix

**`/listen`**
- Le hero SSR fonctionne (H1 présent dans le HTML initial).
- L’élément LCP migre vers la cover discovery (160×160) avec **84 % render delay** dû au boundary client `HomepageContentLive` + `StreamingLayoutClient`.
- Tentative de sortie RSC de `HomepageContentSections` : instable sous Lighthouse (error boundary `Impossible de charger le lecteur.` intermittente).

**`/creator`**
- LCP migré du sidebar FOUC vers le header serveur `h1.creator-page-title` — progrès architectural.
- LCP reste ~3.2 s : render delay résiduel sur shell client + données dashboard.

---

### 26.5 Validations techniques

| Check | Résultat |
|---|---|
| `pnpm build` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm typecheck` | ✅ |
| Tests navigation web | ✅ 13/13 |
| Tests SRTSP | ✅ 100/100 |
| Régression sécurité | ✅ aucune |

---

### 26.6 Décision re-certification

🔴 **GLOBAL CERTIFICATION REFUSÉE** (maintenu)

| Critère P0 | Cible | `/listen` | `/creator` |
|---|---:|---:|---:|
| LCP | ≤ 2.5 s | 4.1 s ❌ | 3.2 s ❌ |

### 26.7 Prochaines corrections minimales recommandées

1. **`/listen`** : sortir `DiscoveriesSection` du boundary client (îlot play handler uniquement) OU `dynamic(..., { ssr:false })` retardé pour la grille discovery
2. **`/creator`** : réduire TBT/render delay du shell `CreatorDashboardView` (coach/modal en lazy post-LCP)
3. Mesures CWV sur **Vercel Preview** (localhost Windows + throttling 4× = variance ±40 %)

### 26.8 Commit proposé (non exécuté — attente validation Rémy)

```
perf(lcp): remediation P0 listen hero SSR + creator server shell

- Server-render listen hero greeting (remove hydration LCP delay)
- Server-render creator sidebar/header; fix sidebar FOUC on mobile
- SSR HeroCard on /creator; drop redundant page Suspense
- Middleware x-pathname for server nav active state
```

---

## 27. LCP Precision Remediation Program — Phase 1 (`/listen`) — 6 juillet 2026

### 27.1 Correction réellement appliquée

Correction unique testée sur `/listen` :

- `HomepageContentSections` rendu directement par la page serveur
- `HomepageContentLive` réduit à un bridge client SRTSP, sans rendu visuel
- objectif : sortir la chaîne `HomepageContentLive -> HomepageContentSections -> DiscoveriesSection -> TrackCard -> CoverImage` du subtree client principal

Fichiers modifiés :

- `apps/web/src/app/(listener)/listen/page.tsx`
- `apps/web/src/features/listener/components/HomepageContentLive.tsx`
- `apps/web/src/features/listener/components/HomepageContentSections.tsx`

### 27.2 Raisons architecturales

L’investigation Root Cause #1 avait montré que la cover discovery attendait le boundary client `HomepageContentLive` avant paint. La correction visait donc à :

1. conserver le SSR initial du contenu homepage ;
2. conserver SRTSP via un bridge client dédié ;
3. éviter de toucher au player, aux API, au CSS, aux images ou aux contrats d’événements.

### 27.3 Validation technique

| Check | Résultat |
|---|---|
| `pnpm build` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm test:web-navigation` | ✅ 13/13 |
| `pnpm test:srtsp` | ✅ 100/100 |
| `pnpm test:player` | ✅ 15/15 |
| `pnpm probe:performance-discovery` | ✅ 27/27 |

### 27.4 Lighthouse avant / après (`/listen` uniquement)

**Avant** : `docs/performance/reports/global-certification/lighthouse-listen-global-final.json`  
**Après** : `listen-phase1-run1.json`, `listen-phase1-run2.json`, `listen-phase1-run3.json`

| Métrique | Avant | Après (médiane 3 runs) | Delta |
|---|---:|---:|---:|
| LCP | 4081 ms | 4687 ms | **-606 ms** |
| CLS | 0.000 | 0.000 | 0 |
| INP | n/a | n/a | n/a |
| FCP | 1450 ms | 1139 ms | +311 ms |
| TTFB | 45 ms | 55 ms | -10 ms |
| TBT | 823 ms | 982 ms | **-159 ms** |
| Score Lighthouse | 67 | 61 | **-6** |

### 27.5 Élément LCP après correction

Sur les 3 runs, le nouvel élément LCP devient :

- `div.has-global-player > main.flex-1 > div.flex > p.text-sm`
- libellé : `Impossible de charger le lecteur.`

### 27.6 Régression prouvée

Le log runtime du serveur de prod locale montre :

```text
Error: Attempted to call usePlayerContext() from the server but usePlayerContext is on the client.
```

Conclusion prouvée :

- sortir `HomepageContentSections` du boundary client principal est insuffisant à lui seul ;
- `DiscoveriesSection` dépend encore du player client (`usePlayerContext`);
- la route `/listen` bascule donc vers l’error boundary auditeur, qui devient le nouvel élément LCP.

### 27.7 Décision

**B. La correction n’apporte pas le gain attendu.**

Pourquoi :

1. LCP régresse de **606 ms** ;
2. TBT régresse de **159 ms** ;
3. la correction introduit une régression runtime sur `/listen` ;
4. le vrai découplage demandé nécessite un îlot client plus fin autour des interactions du player, pas un simple passage en SSR des sections homepage.

