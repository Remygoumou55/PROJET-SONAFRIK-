# SRTSP Review Checklist

> **Référence :** `SRTSP_ENTERPRISE_ARCHITECTURE_STANDARD.md` — Chapitres 1–14  
> **Usage :** Peer review · re-audit · revue pré-certification  
> **Version :** 1.0 · **Date :** 2026-07-05

---

## A. Cohérence Constitution

- [ ] Implémentation alignée Ch. 1 (principes EDA · idempotence · sécurité)
- [ ] Domain ownership respecté (Ch. 2) · `DOMAIN_MAP.md`
- [ ] SSOT respectée (Ch. 3) — pas de recalcul · pas de duplication
- [ ] Event governance respectée (Ch. 4) — registry · version · nommage
- [ ] Future compatibility (Ch. 12) — extension sans refonte gelés

---

## B. Code review SRTSP (sans modifier gelés)

- [ ] Adaptateur : filtre événements complet · ignored · prepared documentés
- [ ] Hook : `useLiveQuery` + `useEventSubscription` · cleanup auto
- [ ] Pas d'appel Supabase direct dans composant React
- [ ] Pas d'import `listener/` ↔ `creator/` interdit
- [ ] Types depuis `@sonafrik/types` / packages/api — pas de redéfinition locale

---

## C. Event mapping review

- [ ] Chaque événement consommé existe dans registry
- [ ] Payload scope présent (`creatorId` / `userId` / etc.)
- [ ] Événements ignorés explicitement listés (wizard · upload progress · etc.)
- [ ] Alias LDSE documentés dans EVENT-MAP
- [ ] Pas d'événement sauvage

---

## D. UX / comportement

- [ ] Mise à jour visible sans F5
- [ ] Formulaire sync via `liveData` — pas de stale state
- [ ] Pas de flash contenu (SSR → live transition fluide)
- [ ] Erreurs bus gérées sans crash UI

---

## E. Performance review (Ch. 9)

- [ ] Pas de `router.refresh()` introduit
- [ ] Query keys stables et scoped
- [ ] `skipInitialFetch: true` quand SSR fournit initialData
- [ ] Re-render subtree limité (DevTools vérifié)

---

## F. Documentation review

- [ ] Programme phase cohérent avec Constitution
- [ ] EVENT-MAP complet
- [ ] Écarts et risques documentés (pas de surprise en certification)
- [ ] Dette P2+ entrée EXECUTION_LOG si applicable

---

## G. Verdict review

| Finding | Priorité | Bloquant certification ? |
|---|---|---|
| | P0/P1/P2/P3 | ☐ Oui ☐ Non |

**Verdict :** ☐ Approuvé · ☐ Corrections requises · ☐ Rejet

**Reviewer :** _______________ **Date :** _______________
