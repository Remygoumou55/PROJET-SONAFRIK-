# SRTSP Governance Checklist

> **Référence :** `SRTSP_ENTERPRISE_ARCHITECTURE_STANDARD.md` — Chapitres 4, 14  
> **Usage :** Création/modification événements · ADR · modification Constitution  
> **Version :** 1.0 · **Date :** 2026-07-05

---

## A. Gouvernance événements (Ch. 4)

### Nouvel événement

- [ ] Domaine propriétaire validé (`DOMAIN_MAP.md`)
- [ ] Nommage `domaine.entité.action` respecté
- [ ] Entrée `SRTSP_DOMAIN_EVENTS` / EventRegistry planifiée
- [ ] Contrat payload Zod versionné
- [ ] `dedupeKey` métier défini
- [ ] Scope tenant obligatoire dans payload
- [ ] Destinations consommatrices listées
- [ ] Entrée `*-EVENT-MAP.md` planifiée
- [ ] Tests adaptateur filtre planifiés
- [ ] **Aucun événement sauvage**

### Modification événement existant

- [ ] Impact consommateurs gelés analysé
- [ ] Version bump si breaking change
- [ ] Période coexistence N / N-1 documentée
- [ ] ADR rédigé si transversal

### Dépréciation

- [ ] Marquage deprecated registry + doc
- [ ] Coexistence ≥ 1 phase certifiée
- [ ] Retrait consommateurs planifié
- [ ] Validation Rémy pour retrait registry

---

## B. Gouvernance modules gelés

- [ ] Modification module gelé = **interdit** sauf bug critique / sécurité
- [ ] Bug critique : ADR + validation Architecture + Rémy
- [ ] Diff ciblé · tests non-régression complets
- [ ] FREEZE.md mis à jour si exception approuvée

---

## C. Gouvernance Constitution (Ch. 14)

### Modification `SRTSP_ENTERPRISE_ARCHITECTURE_STANDARD.md`

- [ ] ADR rédigé (`docs/realtime/ADR-NNN-*.md`)
- [ ] Impact phases 2.1 → 3.7 analysé
- [ ] Compatibilité MVP_SCOPE_LOCK · DOMAIN_MAP · DEPENDENCY_RULES vérifiée
- [ ] Validation Architecture obtenue
- [ ] Validation Technique (build · lint · typecheck · tests)
- [ ] **Validation Rémy Goumou explicite**
- [ ] Version Constitution incrémentée (v1.0 → v1.1)

---

## D. Alignement gouvernance SONAFRIK

- [ ] Compatible `AI_GOVERNANCE.md` (MVP-first · une mission · auto-critique)
- [ ] Compatible `MVP_SCOPE_LOCK.md` (pas de dérive produit)
- [ ] Compatible `CLAUDE.md` (Session Engine LOCKED · RLS · pas de bypass prod)
- [ ] Entrée `EXECUTION_LOG.md` si dette ou décision structurante

---

## E. Décision gouvernance

| Demande | Type | Décision |
|---|---|---|
| | Nouvel événement / Alias / Dépréciation / ADR Constitution / Exception freeze | ☐ Approuvé ☐ Refusé ☐ Différé |

**Décideur Architecture :** _______________  
**Validation Rémy Goumou :** ☐ **Date :** _______________
