# SRTSP Certification Checklist

> **Référence :** `SRTSP_ENTERPRISE_ARCHITECTURE_STANDARD.md` — Chapitres 11, 13  
> **Usage :** Gate **final** avant décision CERTIFIÉ / NON CERTIFIÉ et freeze  
> **Version :** 1.0 · **Date :** 2026-07-05

---

## A. Workflow complet (Ch. 13)

- [ ] Audit initial produit et archivé
- [ ] Root Cause documenté pour chaque écart P0/P1
- [ ] Architecture Review passée (`SRTSP_ARCHITECTURE_CHECKLIST.md`)
- [ ] Plan de Remédiation exécuté
- [ ] Corrections ciblées — périmètre phase respecté
- [ ] Re-audit post-corrections
- [ ] Rapport certification rédigé (`PHASE-N-CERTIFICATION.md`)

---

## B. Identity Synchronization (Ch. 5 — si applicable)

- [ ] SSOT identité = Profil Artiste
- [ ] Tous champs obligatoires propagés (avatar · bannière · nom · badge · bio · réseaux · ville · pays · genres · niveau)
- [ ] Aucune ancienne version visible post-propagation
- [ ] Matrice champs validée manuellement

---

## C. Cross Module Validation (Ch. 6)

- [ ] Dashboard vérifié (si consommateur identité)
- [ ] Catalogue vérifié (si applicable)
- [ ] Analytics vérifié (si applicable)
- [ ] Wallet vérifié (si applicable)
- [ ] Workspace Auditeur vérifié (si applicable)
- [ ] Workspace Super Admin vérifié (si applicable)
- [ ] Zéro désynchronisation · zéro divergence · zéro donnée obsolète

---

## D. Propagation Validation (Ch. 7)

- [ ] Matrice propagation module × attribut produite
- [ ] Scénarios chaîne documentés (format officiel)
- [ ] Toutes propagations automatiques — 0 F5 · 0 reload manuel
- [ ] Filtre scope validé — pas de fuite cross-tenant

---

## E. Performance Standard (Ch. 9)

- [ ] Aucun `router.refresh()` sur surfaces phase
- [ ] Aucun `window.location.reload()`
- [ ] Invalidations ciblées uniquement
- [ ] Métriques mesurées : propagation · refresh · re-render · requêtes
- [ ] Seuils Enterprise respectés (ou écarts P2 documentés)

---

## F. Forensic 360° (Ch. 10)

- [ ] Inspection complète exécutée (`SRTSP_AUDIT_CHECKLIST.md`)
- [ ] Anomalies classées P0 · P1 · P2 · P3
- [ ] **Aucun P0 ouvert**
- [ ] **Aucun P1 ouvert**

---

## G. Non Regression (Ch. 11)

- [ ] Modules gelés v3.1 → v3.7 — diff = 0 modification non autorisée
- [ ] Session Engine non modifié
- [ ] `pnpm build` ✅
- [ ] `pnpm lint` ✅
- [ ] `pnpm typecheck` ✅
- [ ] Tests `@sonafrik/realtime` ≥ minimum version précédente
- [ ] CI probes 130/130 ✅
- [ ] Event Registry / contrats certifiés intacts (ou ADR validé)

---

## H. Livrables freeze

- [ ] `PHASE-N-OFFICIAL-PROGRAM.md` à jour
- [ ] `*-EVENT-MAP.md` publié
- [ ] `PHASE-N-CERTIFICATION.md` avec score multi-axes
- [ ] `packages/core/realtime/FREEZE.md` version incrémentée
- [ ] Version `@sonafrik/realtime` bumpée

---

## I. Décision certification

| Axe | Score (/10) |
|---|---|
| UX/UI | |
| Frontend | |
| Backend | |
| Database | |
| Performance | |
| Sécurité | |
| Architecture | |
| Maintenabilité | |

**Décision :** ☐ 🟢 CERTIFIÉ · ☐ 🔴 NON CERTIFIÉ

**Version freeze :** v____.__.__

**Validateur technique :** _______________ **Validation Rémy Goumou :** ☐
