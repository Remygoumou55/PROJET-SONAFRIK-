# Streaming Runtime — Risk Register

| ID | Risque | Catégorie | P | I | Score | Mitigation | Owner |
|---|---|---|---|---|---|---|---|
| R1 | Régression Real Listen 90 % | Produit | M | C | **9** | Probes A/B, flags, certification P1-P2 | Runtime |
| R2 | Double entrée ledger | Financier | L | C | **6** | UNIQUE idempotency_key, tests concurrence | Ledger |
| R3 | Latence heartbeat | Performance | M | H | **6** | Runtime stateless, monitor p95 | DevOps |
| R4 | Faux positifs anti-fraude | Produit | M | H | **6** | Seuils `system_settings`, review admin | Anti-Fraud |
| R5 | `node:crypto` bundle web | Technique | L | H | **4** | `crypto.randomUUID` isomorphe | API |
| R6 | SSR Supabase direct listener | Sécurité | H | M | **6** | 2.8 API route — dette F4 | Web |
| R7 | Scope creep wallet/royalties | Gouvernance | M | H | **6** | ADR-002, MVP Scope Lock | Architect |
| R8 | Mobile player désaligné | Plateforme | M | M | **4** | Même bridge `@sonafrik/api` | Mobile |
| R9 | Coverage <95 % bloque merge | Qualité | L | H | **4** | vitest thresholds dès 2.1 | QA |
| R10 | Scale millions sans partition | Performance | L | H | **4** | Roadmap partition post-MVP | DevOps |
| R11 | ~~CORS `*` edge functions~~ | Sécurité | — | — | **0** | ✅ Résolu 26/06 — `_shared/cors.ts` | DevOps |
| R12 | Signed URL 7200s | Sécurité | M | L | **3** | Playback Engine TTL 1800s (2.3) | Playback |
| R13 | Concurrence sessions | Intégrité | M | M | **4** | RPC Sprint 13c + Session Engine | Session |
| R14 | Dette analytics duplicate | Architecture | M | L | **3** | Frontière `analytics/` vs `streaming/analytics/` | Architect |
| R15 | Flag partiel état incohérent | Ops | M | H | **6** | Matrice flags documentée, validation resolver | Integration |

**Légende :** P=Probabilité (L/M/H), I=Impact (L/M/H/C=Critical), Score=P×I heuristique

## Plans de contingence

### R1 — Real Listen cassé en prod
1. `streaming_mvp_integration_enabled = false`
2. Redeploy edge functions version N-1 si nécessaire
3. Probe P1/P2 hourly jusqu'à green
4. Post-mortem obligatoire

### R2 — Double ledger
1. `stream_ledger_enabled = false` immédiat
2. Script réconciliation `COUNT(*) GROUP BY idempotency_key HAVING COUNT>1`
3. Correction manuelle admin — **jamais DELETE ledger** (compensation entry)

### R7 — Tentative modification royalty engine
1. Rejeter PR — hors scope SPRING 2
2. Créer ticket post-SPRING 2.8 "Royalty reads ledger"

## Revue des risques

- **Avant chaque sous-phase :** revue top 5 applicables
- **Après 2.7 :** revue complète avant 2.8 canary
- **Responsable :** Principal Architect (gouvernance IA)
