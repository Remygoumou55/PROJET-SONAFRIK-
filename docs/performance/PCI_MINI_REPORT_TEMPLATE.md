# PCI Mini Report — [NOM FEATURE]

**Date :** YYYY-MM-DD  
**Auteur :**  
**Feature / PR :**  
**Pages touchées :** `/listen` · `/creator` · …

---

## 1. Contexte

[Description courte de la fonctionnalité et pourquoi une revue PCI est déclenchée.]

---

## 2. Validation technique

| Check | Résultat |
|---|---|
| `pnpm build` | ✅ / ❌ |
| `pnpm typecheck` | ✅ / ❌ |
| `pnpm lint` | ✅ / ❌ |
| test:web-navigation | /13 |
| test:srtsp | /100 |
| test:player | /15 |

---

## 3. Mesures performance (avant → après)

| Métrique | Avant | Après | Budget PCI | Verdict |
|---|---:|---:|---:|---|
| LCP | | | ≤ 3,5 s | |
| CLS | | | ≤ 0,10 | |
| INP | | | ≤ 200 ms | |
| TBT | | | ≤ 300 ms | |
| FCP | | | ≤ 1,8 s | |
| TTFB | | | ≤ 800 ms | |
| First Load JS | | | — | |

**Méthode :** Lighthouse 12.x · mobile · 4G simulé · 3 runs · médiane  
**Rapports JSON :** `docs/performance/reports/pci/<date>/`

---

## 4. Bundle / CPU (si applicable)

| Signal | Avant | Après |
|---|---|---|
| Route bundle delta | | |
| chunk 2060 scripting | | |
| Long tasks | | |

---

## 5. Classification régression

| Niveau | Justification |
|---|---|
| P0 / P1 / P2 / P3 / Aucune | |

---

## 6. Décision PCI

- [ ] **Approuvé** — dans les budgets, pas de régression P0/P1
- [ ] **Conditionnel** — P2 backlog, merge autorisé avec ticket
- [ ] **Bloqué** — P0, correction requise avant merge

---

## 7. Notes

[Incidents, variance lab, dette créée.]
