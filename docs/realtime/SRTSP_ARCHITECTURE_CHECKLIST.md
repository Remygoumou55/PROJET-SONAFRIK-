# SRTSP Architecture Checklist

> **Référence :** `SRTSP_ENTERPRISE_ARCHITECTURE_STANDARD.md` — Chapitres 1, 2, 3, 12  
> **Usage :** Design review **avant** implémentation d'une nouvelle phase ou extension SRTSP  
> **Version :** 1.0 · **Date :** 2026-07-05

---

## A. Principes architecturaux (Ch. 1)

- [ ] Communication **Event Driven** — aucun couplage direct inter-modules UI
- [ ] **Loose Coupling** — producteur/consommateur liés uniquement par événement + contrat + scope
- [ ] **Single Responsibility** — un adaptateur = un hub = un périmètre refresh défini
- [ ] **Open/Closed** — extension sans modification modules gelés
- [ ] **Eventual Consistency** — cohérence mesurable, pas de F5 utilisateur
- [ ] **Idempotence** — `dedupeKey` métier sur chaque publication
- [ ] **Atomicité** — un événement = une intention atomique au niveau contrat
- [ ] **Scalabilité** — filtres scope, pas de refresh global
- [ ] **Sécurité** — pas de bypass RLS · filtre tenant strict
- [ ] **Auditabilité** — journal + metrics prévus en staging

---

## B. Domain Ownership (Ch. 2)

- [ ] Domaine propriétaire identifié et documenté
- [ ] Aligné avec `DOMAIN_MAP.md`
- [ ] Aucune duplication de responsabilité avec un domaine existant
- [ ] Aucune mutation d'état appartenant à un autre domaine
- [ ] Pas de logique métier dans le bus SRTSP

---

## C. Source of Truth (Ch. 3)

- [ ] SSOT unique identifiée (table · service · domaine API)
- [ ] Consommateurs en read-only via SRTSP ou API propriétaire
- [ ] Aucun recalcul local de donnée possédée ailleurs
- [ ] Pattern `initialData` SSR + `skipInitialFetch: true` planifié
- [ ] Pattern `liveData ?? initialData` documenté

---

## D. Couche technique (alignement phases certifiées)

- [ ] Adaptateur consommateur dans `packages/core/realtime/src/adapters/`
- [ ] Filtre `shouldRefresh*(event, scope)` défini
- [ ] Hook live dans le bon domaine feature (`apps/web/src/features/`)
- [ ] Query keys scoped et documentées
- [ ] Aucun import cross-feature interdit (`DEPENDENCY_RULES.md`)

---

## E. Future Compatibility (Ch. 12)

- [ ] Aucune modification requise sur modules gelés v3.1 → v3.7
- [ ] Extension par nouveau consumer / nouveau hook uniquement
- [ ] ADR rédigé si impact transversal ou alias registry
- [ ] Pas de breaking change contrat sans versionnement

---

## F. Décision

| Résultat | Action |
|---|---|
| Toutes cases cochées | ✅ Architecture approuvée — passer à implémentation |
| Cases manquantes P0/P1 | 🔴 Bloquer — corriger design |
| Dette P2 documentée | ⚠️ Continuer avec note EXECUTION_LOG |

**Revieweur :** _______________ **Date :** _______________
