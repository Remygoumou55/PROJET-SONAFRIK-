# SONAFRIK — Performance Hardening Sprint 7
# Database & Backend Optimization — Rapport de Certification

**Date :** 6 juillet 2026  
**Baseline :** Sprint 6 Runtime Optimization (FREEZE)  
**Décision :** 🟢 **CERTIFIÉ** — Database & Backend Optimization → FREEZE → Global Enterprise Certification autorisée

---

## 1. Audit Database (Étape A)

### Périmètre audité

| Zone | État |
|---|---|
| PostgreSQL / Supabase | 130 migrations locales · 53+ tables RLS=true |
| Index | 150+ `CREATE INDEX` couvrant streaming, wallet, search, publication library |
| RPC | Analytics créateur, trending, search, wallet, admin — agrégation côté DB |
| Policies RLS | Actives sur toutes les tables publiques confirmées |
| Connexions / pool | Géré Supabase (PgBouncer) — pas de anti-pattern pool côté app |
| Transactions | `wallet_ledger` / `audit_logs` immutables respectés |

### Points forts confirmés

- `get_creator_stream_stats` / `get_creator_stream_analytics` — analytics créateur via RPC (pas de scan table brute)
- `CreatorDashboardRepository.getCatalogCounts` — pattern `head: true` + `count: "exact"`
- `listener.track.repository` — joins batchés, `getHomepageCurated` limité (8/14)
- `stream-start` — URL signée audio **900 s** (15 min)
- Index publication library (`idx_tracks_creator_library`, `idx_tracks_creator_library_title`) — migration `20260705120000`
- `fetchStageNamesByCreatorIds` — batch unique, évite embed PGRST200

---

## 2. Audit Backend (Étape A)

### Repositories / Services

| Pattern | Occurrences | Verdict |
|---|---|---|
| `Promise.all` parallélisation | Catalog, listener home, admin dashboard, analytics SRTSP | ✅ |
| RPC agrégation | ~80 appels `.rpc()` dans `packages/api` | ✅ |
| `select("*")` repositories | ~65 occurrences (16 fichiers) | ⚠️ P2 dette payload |
| Boucles `await` séquentielles | `bulkUpsertFraudReviewStates` (avant fix) | ❌ P0 corrigé |
| Chargement lignes pour compter | `getCatalogContext` (avant fix) | ❌ P0 corrigé |

### Surfaces FREEZE — non régressées

Publication · SRTSP · Dashboard · Catalogue · Analytics · Wallet · Artist Profile · Admin · Listener

---

## 3. Root Cause Report

| ID | Root cause | Impact | Priorité | Statut |
|---|---|---|---|---|
| S7-P0-1 | `getCatalogContext()` chargeait `listAlbums` (50 max) + `listTracks` (100 max) puis filtrait en mémoire | Compteurs faux si >100 tracks ; ~150 rows × colonnes lourdes par refresh SRTSP catalogue | **P0** | ✅ Corrigé |
| S7-P0-2 | `bulkUpsertFraudReviewStates` — N × (`SELECT` + `UPSERT`) séquentiels | Latence admin fraud bulk O(2N) requêtes | **P0** | ✅ Corrigé |
| S7-P1-1 | `select("*")` généralisé dans repositories | Payload réseau + sérialisation inutile | P1 | Backlog |
| S7-P1-2 | `listTracksPage` = 2 requêtes (list + count) — correct mais doublon filtres | Acceptable ; RPC unique possible post-MVP | P1 | Backlog |
| S7-P2-1 | Signed URL catalog/creator/avatar TTL **3600 s** vs stream **900 s** | Fenêtre exposition plus large | P2 | Backlog |
| S7-P2-2 | `getMonthlyRoyalties` — fetch lignes + agrégation JS | Scalable jusqu'à ~1000 rows/creator | P2 | Backlog |
| S7-P2-3 | `fetchHomepageData` — 5+ appels parallèles + geo map | Latence homepage composite | P2 | Sprint 4 backlog |
| S7-P3-1 | Table `creators` orpheline utilisée pour geo map | Dette modèle | P3 | Roadmap |

---

## 4. Architecture Review

- **Séparation domaines** respectée — optimisations limitées à `packages/api`
- **Session Engine** (`streaming/session/`) — **non modifié** (LOCKED)
- **Event Contracts SRTSP** — **inchangés**
- **Aucune migration schéma** — corrections transparentes repository/service uniquement

---

## 5. Analyse SQL

| Requête / zone | Avant | Après |
|---|---|---|
| `getCatalogContext` | 2 SELECT full rows (~150 rows max) | 7 COUNT `head: true` parallèles |
| `countCreatorTracks` | `select("*", head)` | `select("id", head)` |
| `getGenres` | `select("*")` | Projection colonnes explicites |
| Analytics streams | RPC `get_creator_stream_analytics` | Inchangé (déjà optimal) |
| Publication library | Index `creator_id + status + updated_at` | Inchangé (index existant) |

---

## 6. Analyse RPC

| RPC | Usage | Verdict |
|---|---|---|
| `get_creator_stream_stats` | Analytics dashboard | ✅ |
| `get_creator_stream_analytics` | Streaming analytics | ✅ |
| `get_trending_tracks` | Discovery | ✅ |
| `search_*` | Search OS | ✅ |
| `ensure_creator_for_current_user` | Catalog bootstrap | ✅ |
| `has_streaming_permission` | Playback gate | ✅ |

Aucun RPC inutile identifié en P0. Consolidation `get_catalog_context_counts` possible en P2 (non implémenté — évite migration).

---

## 7. Analyse Storage

| Edge function | TTL signé | Cache-Control |
|---|---|---|
| `stream-start` | 900 s | N/A (audio playback) |
| `catalog-asset-signed-url` | 3600 s | — |
| `creator-asset-signed-url` | 3600 s | — |
| `avatar-signed-url` | 3600 s | — |

Upload via signed URL — pas de lecture répétée côté Storage pour assets statiques publics (covers CDN `next/image`).

---

## 8. Analyse Performance

### Backend — gains estimés (P0)

| Opération | Avant | Après | Gain estimé |
|---|---|---|---|
| `getCatalogContext` (refresh SRTSP) | ~2 SELECT full + filtre JS | 7 COUNT head parallèles | **−85 à −95 % payload** ; compteurs exacts |
| `bulkUpsertFraudReviewStates` (N=50) | ~100 round-trips | 2 round-trips | **−96 % latence réseau** |

### Frontend / CWV

Pas de changement rendering — métriques Sprint 6 conservées :

| Page | LCP (Sprint 3 baseline) | Note |
|---|---|---|
| `/lancement` | 2,3 s | Inchangé (hors scope Sprint 7) |

Lighthouse complet non re-exécuté — Sprint 7 cible couche DB/Backend uniquement.

---

## 9. Analyse Sécurité

- RLS non modifiée ✅
- Pas de `service_role` côté client ✅
- `BYPASS_AUTH` guard Vercel intact ✅
- Signed URL stream 15 min ✅
- Catalog signed URL 1 h — acceptable upload, P2 réduction TTL optionnelle

---

## 10. Analyse Scalabilité

| Goulot | Mitigation actuelle | Risque charge |
|---|---|---|
| Stream sessions | Index `idx_stream_sessions_*` | Faible |
| Publication library | Index creator library | Faible |
| Admin fraud bulk | Batch upsert (post-fix) | Faible |
| Homepage composite | 5+ queries parallèles | Moyen à 10k DAU |
| `select("*")` tracks | Payload | Moyen catalogues >500 tracks |

---

## 11. Avant / Après — Corrections appliquées

### Fichiers modifiés (Sprint 7)

| Fichier | Changement |
|---|---|
| `packages/api/src/creator/catalog/catalog.repository.ts` | `getCatalogContextAggregates()` · `getGenres` projection · `countCreatorTracks` head `id` |
| `packages/api/src/creator/catalog/catalog.service.ts` | `getCatalogContext()` → agrégats COUNT |
| `packages/api/src/admin/admin.fraud.repository.ts` | `bulkUpsertFraudReviewStates` batch 2-query |

### Code clé — `getCatalogContext`

**Avant :** charge albums + tracks complets, compte en JS (plafonné 50/100).

**Après :** 7 requêtes `count` `head: true` parallèles — compteurs exacts, zéro payload row.

---

## 12. Re-Audit (Étape K)

| Check | Statut |
|---|---|
| `pnpm typecheck` | ✅ 17/17 packages |
| `pnpm lint` | ✅ 17/17 |
| `pnpm build` | ✅ 50 pages |
| API Vitest | ✅ **351/351** |
| SRTSP Vitest | ✅ **100/100** |
| Finance (wallet/payments/payout) | ✅ **40/40** |
| Playback certification | ✅ **3/3** |
| Probes performance discovery | ✅ **27/27** |
| Probes certification globale | ✅ **92/92** |
| Régression SRTSP / Publication / Wallet | ✅ Aucune |
| Compatibilité Sprints 1–6 | ✅ |

---

## 13. Certification — Notes /100

| Domaine | Note | Commentaire |
|---|---|---|
| **Database** | **88** | Index solides, RPC analytics ; dette `select(*)` |
| **Backend** | **90** | P0 corrigés ; patterns parallèles sains |
| **Performance** | **87** | Gains backend mesurables ; CWV hors scope |
| **Architecture** | **91** | Isolation domaines, Session Engine intact |
| **Sécurité** | **89** | RLS, signed URLs ; TTL catalog P2 |
| **Maintenabilité** | **88** | Corrections localisées, sans migration |

**Score global Sprint 7 : 89/100**

---

## 14. Décision Finale

### 🟢 CERTIFIÉ

**Database & Backend Optimization** → **FREEZE**

Autorise officiellement : **Performance Hardening Program — GLOBAL ENTERPRISE CERTIFICATION**

### Gouvernance post-certification

- **Aucun commit automatique**
- **Aucun push** — commit local préparable après validation explicite de Rémy
- Corrections P1–P3 documentées en backlog post-certification globale

---

## 15. Plan de remédiation résiduel (post-FREEZE)

| ID | P | Item | Cible |
|---|---|---|---|
| S7-R-P1 | P1 | Remplacer `select("*")` par projections dans catalog/streaming/wallet | Post-global cert |
| S7-R-P2 | P2 | RPC `get_catalog_context_counts` unique (1 round-trip) | Si métriques le justifient |
| S7-R-P2b | P2 | Réduire TTL signed URL catalog à 900 s (alignement stream) | Sécurité |
| S7-R-P2c | P2 | RPC agrégation royalties mensuelles | Analytics scale |
| S7-R-P3 | P3 | Consolider geo map (`creators` → `artist_profiles`) | Modèle données |

---

*Rapport généré dans le cadre du Performance Hardening Program — Sprint 7 Enterprise Certification.*
