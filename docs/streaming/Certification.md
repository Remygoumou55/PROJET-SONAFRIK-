# Streaming Runtime — Certification Strategy

## Niveaux de certification

| Niveau | Quand | Gate |
|---|---|---|
| **C-SUB** | Fin chaque sous-phase 2.1–2.6 | Tests + coverage + build |
| **C-RUNTIME** | SPRING 2.7 | Probe suite complète |
| **C-MVP** | SPRING 2.8 | Integration + flags OFF prod |
| **C-ENTERPRISE** | Post-MVP scale | Load 1M sessions/jour |

---

## C-SUB — par sous-phase

### 2.1 Foundation
- Coverage `streaming/application` + `streaming/runtime` ≥ **95 %**
- 0 régression `packages/api` exports existants
- Lint 0 error

### 2.2 Session Engine
- 100 % transitions state machine testées
- Property test : `complete` idempotent
- Alignement RPC legacy `complete_stream_session`

### 2.3 Playback Engine
- signedUrl non vide, expiresAt futur
- Formats mp3/m4a/aac uniquement web
- Position save/load roundtrip

### 2.4 Analytics Engine
- Parité ±1 % vs `get_creator_stream_analytics` legacy
- Toute query a `LIMIT ≤ 1000`
- p95 < 200ms (dataset test 100k)

### 2.5 Anti-Fraud
- 0 faux négatif sur bot vitesse 3×
- Faux positif < 0.1 % sur dataset humain simulé
- Session invalidée → `is_valid_listen = false`

### 2.6 Stream Ledger
- Coverage ≥ **98 %**
- Test concurrence : 100 completes simultanés → 1 entrée
- Trigger INSERT ONLY vérifié
- RLS : anon/authenticated policies testées

---

## C-RUNTIME — probe suite (2.7)

Script : `scripts/streaming-runtime-certification.ts`

| ID | Scénario | Assertion |
|---|---|---|
| P1 | Happy path 95 % listen | `is_valid_listen = true`, ledger entry |
| P2 | Skip 50 % | `is_valid_listen = false`, 0 ledger |
| P3 | Pause 30s + resume | position cohérente |
| P4 | Double complete | idempotent 200 |
| P5 | Fraud speed 2× | invalidated |
| P6 | Orphan session | nouvelle session après 5min |
| P7 | Concurrent 2 sessions | 1 fermée (Sprint 13c) |
| P8 | Flag OFF | legacy byte-identical response shape |
| P9 | Heartbeat 10s × duration | `last_heartbeat_at` updated |
| P10 | Unauthorized session | 403 |

**Gate :** 10/10 PASS + `pnpm probe:certification` global inchangé ou étendu.

---

## C-MVP — integration (2.8)

- [ ] `apps/web` build PASS — pas de `node:*` dans bundle streaming
- [ ] Hooks `useStreaming`, `usePlayer` signatures inchangées
- [ ] Edge functions déployées — proxy mode
- [ ] 7 flags `enabled=false` en prod vérifié SQL
- [ ] Rapport `CERTIFICATION_REPORT.md` signé

---

## Auto-critique checklist (chaque sous-phase)

```
□ Couleurs tokens CSS (si UI touchée — normalement NON)
□ Composant bon domaine (listener/)
□ Pas duplication existant
□ Types packages/types uniquement
□ Pas import cross-feature interdit
□ Pas Supabase direct dans React
□ Nouvelle table = RLS
□ pnpm build + lint + typecheck = 0
□ EXECUTION_LOG entrée ajoutée
```

---

## Rollback certification

Si C-RUNTIME échoue en canary :
1. Désactiver flag concerné
2. Re-run probe legacy path (P8)
3. Post-mortem dans `EXECUTION_LOG`
4. Fix avant re-canary
