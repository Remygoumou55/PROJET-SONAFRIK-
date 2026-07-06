# SRTSP Audit Checklist

> **Référence :** `SRTSP_ENTERPRISE_ARCHITECTURE_STANDARD.md` — Chapitres 8, 10  
> **Usage :** Audit initial · Forensic 360° · Étape A/H des programmes phase  
> **Version :** 1.0 · **Date :** 2026-07-05

---

## A. Audit périmètre phase

- [ ] Liste surfaces UI auditées
- [ ] Liste hooks live inventoriés
- [ ] Liste adaptateurs consommateurs inventoriés
- [ ] Liste événements écoutés vs registry
- [ ] Patterns interdits recherchés (`router.refresh`, reload, fetch mount)

---

## B. Forensic 360° — Hooks & React

- [ ] Hooks morts identifiés
- [ ] Event listeners dupliqués identifiés
- [ ] Subscriptions non nettoyées (memory leaks)
- [ ] Re-render inutiles documentés
- [ ] `useEffect` deps correctes sur sync live

---

## C. Forensic 360° — Services & API

- [ ] Services inutilisés listés
- [ ] Appels Supabase hors couche API flaggés
- [ ] Unused queries identifiées
- [ ] Double fetch (SSR + client mount) identifié

---

## D. Forensic 360° — Code health

- [ ] Imports inutilisés
- [ ] Components inutilisés
- [ ] Dead code
- [ ] Duplication de logique
- [ ] Circular dependencies
- [ ] Zombie events (registry sans producteur ou consommateur orphelin)

---

## E. Forensic 360° — Cache & Events

- [ ] Cache obsolète · clés LDSE non migrées
- [ ] Event handlers inutilisés
- [ ] Invalidation tracking — quelle clé · quel hook · quel filtre

---

## F. Observability (Ch. 8)

- [ ] Metrics SRTSP consultables en staging
- [ ] Journal récent inspecté (`getJournalRecent`)
- [ ] Latency propagation mesurée
- [ ] Retries / timeouts documentés
- [ ] Erreurs bus classées

---

## G. Classification anomalies (obligatoire)

| ID | Fichier | Anomalie | Root cause | Remédiation | Priorité |
|---|---|---|---|---|---|
| F-001 | | | | | P0/P1/P2/P3 |
| F-002 | | | | | |
| F-003 | | | | | |

### Barème priorité (Ch. 10)

| Priorité | Exemples |
|---|---|
| **P0** | Fuite sécurité · perte événement · modification module gelé |
| **P1** | Désynchronisation identité · fuite cross-tenant · double fetch systémique |
| **P2** | Re-render excessif · cache stale · dette documentée |
| **P3** | Cosmétique · doc · optimisation future |

---

## H. Synthèse audit

| Métrique | Valeur |
|---|---|
| P0 ouverts | |
| P1 ouverts | |
| P2 ouverts | |
| P3 ouverts | |

**Audit compatible certification :** ☐ Oui (0 P0 · 0 P1) · ☐ Non

**Auditeur :** _______________ **Date :** _______________
