# SRTSP Future Extension Checklist

> **Référence :** `SRTSP_ENTERPRISE_ARCHITECTURE_STANDARD.md` — Chapitres 4, 12, 13  
> **Usage :** Planification Phase N+1 · nouveau hub · nouveau consommateur  
> **Version :** 1.0 · **Date :** 2026-07-05

---

## A. Faisabilité extension (Ch. 12)

- [ ] Extension **sans refonte** modules gelés v3.1 → v3.7
- [ ] Extension **sans modification** Session Engine (LOCKED)
- [ ] Nouveau périmètre clairement borné (programme phase)
- [ ] Pas de feature hors `MVP_SCOPE_LOCK.md` sans validation Rémy

---

## B. Design extension

- [ ] Domaine propriétaire SSOT identifié
- [ ] Événements registry existants réutilisés en priorité
- [ ] Nouveaux événements : gouvernance Ch. 4 (`SRTSP_GOVERNANCE_CHECKLIST.md`)
- [ ] Nouvel adaptateur `*-consumer.ts` — pas de modification adaptateur gelé
- [ ] Nouveaux hooks dans domaine feature correct
- [ ] `SRTSP_ARCHITECTURE_CHECKLIST.md` passée

---

## C. Compatibilité arrière

- [ ] Consommateurs existants non impactés (tests régression)
- [ ] Alias LDSE si bridge requis — pas de toucher UI gelée
- [ ] Version package `@sonafrik/realtime` bump semver planifiée
- [ ] FREEZE incrémental documenté

---

## D. Plan certification future phase

- [ ] `PHASE-N-OFFICIAL-PROGRAM.md` rédigé
- [ ] `*-EVENT-MAP.md` planifié
- [ ] Matrice propagation définie (Ch. 7)
- [ ] Seuils performance définis (Ch. 9)
- [ ] Modules gelés listés dans périmètre INTERDIT
- [ ] Workflow Ch. 13 accepté sans exception

---

## E. Risques extension

| Risque | Mitigation | Priorité |
|---|---|---|
| Impact module gelé | Périmètre strict · diff gate | |
| Événement sans producteur | ADR + stub staging | |
| Cross-tenant leak | Filtre scope tests | |
| Performance regression | Métriques pré/post | |

---

## F. Extension autorisée — pattern certifié

```
Phase N+1 — [Nom Module] Live Integration
  ↓
Audit (SRTSP_AUDIT_CHECKLIST.md)
  ↓
Nouveau consumer adapter
  ↓
Nouveaux hooks live (module autorisé uniquement)
  ↓
Propagation + Performance + Forensic + Non Regression
  ↓
Certification (SRTSP_CERTIFICATION_CHECKLIST.md)
  ↓
Freeze vN+1
```

---

## G. Décision extension

- [ ] Extension approuvée pour implémentation
- [ ] Numéro phase assigné : **Phase _____**
- [ ] Version freeze cible : **v_____.0**

**Architecte :** _______________ **Date :** _______________
