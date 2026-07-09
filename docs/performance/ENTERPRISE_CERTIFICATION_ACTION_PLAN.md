# SONAFRIK — Mes Publications

## Enterprise Certification Action Plan

Date : **2026-07-09**  
Base unique : `docs/performance/ENTERPRISE_ROOT_CAUSE_VERIFICATION_REPORT.md`

> Ce document ne contient **aucune correction appliquée**.  
> Il sert de backlog final de remédiation avant la prochaine et dernière tentative de certification Enterprise.

---

## Plan priorisé

| Correction n° | Cause racine | Priorité | Effort estimé | Gain attendu | Impact Lighthouse | Impact Runtime | Impact Maintenabilité |
|---|---|---|---|---|---|---|---|
| 1 | Shell client transverse trop lourd sur la route (`RealtimeShell`, `RootLdseShell`, `RootSrtspShell`, `LdseProvider`, `PerformanceProvider`, `ToastProvider`, `CreatorMobileNav`) | P0 | L | Très élevé | Très fort sur Desktop Performance / TBT | Très fort | Positif si réduction du périmètre de montage |
| 2 | JS initial inutilisé important dans les chunks desktop principaux (`5322...`, `50e5...`) | P0 | M | Élevé | Fort sur TBT / Performance | Moyen à fort | Positif si découpage plus explicite |
| 3 | CSS domaine créateur importé trop largement via `creator.css` | P0 | M | Moyen | Moyen sur FCP / Mobile Performance | Faible à moyen | Positif si CSS mieux scindé par route |
| 4 | `role="tablist"` invalide sur les filtres de statut dans `PublicationsLibrary.tsx` | P0 | S | Moyen | Fort sur Accessibility | Faible | Positif, sémantique plus propre |
| 5 | Landmark `main` absent dans le layout créateur | P0 | S | Moyen | Fort sur Accessibility | Nul | Positif |
| 6 | Contrastes insuffisants dans `music-navigation.css` (`.music-sidebar__story-eyebrow`, `.music-nav__section-title`) | P0 | S | Moyen | Fort sur Accessibility | Nul | Positif |
| 7 | `meta-description` non matérialisée dans le document HTML audité malgré `metadata` déclarée | P0 | M | Moyen | Fort sur SEO desktop/mobile | Nul | Positif si comportement App Router clarifié |
| 8 | Route dynamique/authentifiée et metadata route-spécifique pas suffisamment robuste | P1 | M | Moyen | Moyen sur SEO / FCP | Faible | Positif si clarification architecture SEO |
| 9 | Échec `bf-cache` causé par WebSocket + `Cache-Control: no-store` | P1 | M/L | Moyen | Fort sur Best Practices mobile | Faible sur first load | Mitigé, dépend du compromis realtime |
| 10 | Absence d’artefact trace/flame chart brut dans le pipeline de certification | P2 | S/M | Faible sur score, élevé sur auditabilité | Nul ou faible | Nul | Positif pour les futures certifications |

---

## Détail des corrections

### 1. Réduire le shell client transverse de la route

- Cause racine : providers globaux et realtime montés avant la feature.
- Priorité : **P0**
- Effort : **Large**
- Gain attendu :
  - baisse du TBT desktop ;
  - baisse du travail main thread ;
  - réduction du coût d'hydratation.
- Impact Lighthouse :
  - Desktop Performance
  - TBT
  - potentiellement FCP/LCP mobile
- Impact Runtime :
  - startup plus léger
  - moins de listeners initiaux
- Impact Maintenabilité :
  - positif si le périmètre de chaque provider devient explicite.

### 2. Réduire le JS initial inutilisé

- Cause racine : chunks initiaux avec part inutilisée élevée.
- Priorité : **P0**
- Effort : **Medium**
- Gain attendu :
  - baisse directe de l'évaluation JS ;
  - baisse du TBT ;
  - route plus proche d'un chargement réellement minimal.
- Impact Lighthouse :
  - Desktop Performance
  - TBT
  - Unused JavaScript
- Impact Runtime :
  - temps d'initialisation réduit
- Impact Maintenabilité :
  - positif si les frontières client/serveur sont plus nettes.

### 3. Scinder le CSS créateur par route

- Cause racine : `creator.css` importe des feuilles non critiques pour `Mes publications`.
- Priorité : **P0**
- Effort : **Medium**
- Gain attendu :
  - allègement du chemin critique ;
  - réduction du CSS inutilisé ;
  - amélioration possible du FCP.
- Impact Lighthouse :
  - Render Blocking
  - Unused CSS
  - Mobile Performance
- Impact Runtime :
  - négligeable hors chargement initial
- Impact Maintenabilité :
  - positif si les styles deviennent mieux encapsulés.

### 4. Corriger la sémantique ARIA des filtres

- Cause racine : pattern `tablist` incohérent avec des boutons toggle.
- Priorité : **P0**
- Effort : **Small**
- Gain attendu :
  - suppression d'un échec A11y critique.
- Impact Lighthouse :
  - Accessibility
- Impact Runtime :
  - nul
- Impact Maintenabilité :
  - positif, sémantique plus simple.

### 5. Ajouter un vrai landmark `main`

- Cause racine : layout créateur structuré en `div` seulement.
- Priorité : **P0**
- Effort : **Small**
- Gain attendu :
  - suppression d'un échec A11y structurel.
- Impact Lighthouse :
  - Accessibility
- Impact Runtime :
  - nul
- Impact Maintenabilité :
  - positif.

### 6. Corriger les contrastes sidebar desktop

- Cause racine : tailles très petites + couleurs sous le seuil WCAG.
- Priorité : **P0**
- Effort : **Small**
- Gain attendu :
  - correction du score A11y desktop.
- Impact Lighthouse :
  - Accessibility
- Impact Runtime :
  - nul
- Impact Maintenabilité :
  - neutre à positif.

### 7. Corriger la non-matérialisation de la `meta-description`

- Cause racine : l'HTML final audité ne contient pas la meta attendue.
- Priorité : **P0**
- Effort : **Medium**
- Gain attendu :
  - suppression du blocage SEO desktop/mobile.
- Impact Lighthouse :
  - SEO
- Impact Runtime :
  - nul
- Impact Maintenabilité :
  - positif si la stratégie metadata App Router est clarifiée.

### 8. Clarifier la stratégie metadata des routes dynamiques authentifiées

- Cause racine : interaction route dynamique/auth/auth flow/metadata.
- Priorité : **P1**
- Effort : **Medium**
- Gain attendu :
  - stabilisation SEO pour les futures routes similaires.
- Impact Lighthouse :
  - SEO
- Impact Runtime :
  - faible
- Impact Maintenabilité :
  - fort effet positif transverse.

### 9. Décider du compromis `bf-cache` vs realtime

- Cause racine : WebSocket + `no-store`.
- Priorité : **P1**
- Effort : **Medium/Large**
- Gain attendu :
  - récupération du 100 Best Practices mobile si compatible produit.
- Impact Lighthouse :
  - Best Practices
- Impact Runtime :
  - faible sur first load, potentiellement fort sur navigation retour
- Impact Maintenabilité :
  - dépend du choix retenu ; peut être coûteux si le realtime doit devenir conditionnel.

### 10. Ajouter une capture brute de trace dans la prochaine certification

- Cause racine : manque d'artefact bas niveau pour l'audit post-mortem.
- Priorité : **P2**
- Effort : **Small/Medium**
- Gain attendu :
  - pas de gain score direct ;
  - gain élevé de preuve et de diagnostic.
- Impact Lighthouse :
  - nul
- Impact Runtime :
  - nul
- Impact Maintenabilité :
  - positif pour les futurs audits Enterprise.

---

## Ordre recommandé de remédiation

1. P0 accessibilité pure : `main`, ARIA filtres, contrastes.
2. P0 SEO : `meta-description` réellement rendue.
3. P0 performance architecture : shell client transverse + JS initial.
4. P0 performance chargement : CSS critique / CSS inutile.
5. P1 décision architecture : `bf-cache` vs realtime.
6. P2 auditabilité : export trace brute pour la prochaine preuve finale.

---

## Résultat attendu après remédiation

La prochaine phase devra viser exclusivement :

- **Desktop Performance >= 95**
- **Desktop Accessibility >= 95**
- **Desktop SEO >= 95**
- **Mobile Performance >= 95**
- **Mobile Best Practices = 100**
- **Mobile SEO >= 95**
- **FCP < 1800 ms**

Sans nouvelle feature, sans refonte inutile, et sans modification hors des causes racines vérifiées.
