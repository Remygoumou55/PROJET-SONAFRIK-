# SPRING 2 RUNTIME — MVP Integration Program
## Enterprise Progressive Runtime Activation

> **Date :** 2026-06-26  
> **Statut programme :** Phase A→I complétée (discovery) — **intégration code non démarrée**  
> **Runtime engines :** LOCKED (Foundation 2.1 · Session 2.2 · Playback 2.3)  
> **Source de vérité projet :** `docs/EXECUTION_LOG.md`

---

## Contexte

Le Streaming Runtime Enterprise est **construit et certifié** (258 tests API, coverage streaming ≥90 %).

| Composant | Package | Statut |
|---|---|---|
| Runtime Foundation | `packages/api/src/streaming/runtime/` | ✅ Certifié 2.1 |
| Session Engine | `packages/api/src/streaming/session/` | ✅ Certifié 2.2 LOCKED |
| Playback Runtime Engine | `packages/api/src/streaming/playback/` | ✅ Certifié 2.3 |
| Application Layer | `packages/api/src/streaming/application/` | ✅ Shell CQRS |
| Feature Flags | `integration/feature-flags.ts` + DB | ✅ 15 flags, **tous `enabled=false`** |
| Legacy player | `apps/web` + `apps/mobile` | ✅ **100 % du trafic lecture** |

**Dette d'intégration :** bridge étape 1 livré (`StreamingPlaybackBridge` + `useStreamingPlaybackBridge`). Étapes 2–8 et mobile en attente.

---

## Architecture freeze (interdit de modifier)

- `packages/api/src/streaming/runtime/` (Foundation)
- `packages/api/src/streaming/session/` (Session Engine LOCKED)
- `packages/api/src/streaming/contracts/`
- `docs/streaming/STATE_MACHINE.md`
- `docs/streaming/DOMAIN_EVENTS.md`
- `docs/streaming/SEQUENCE_DIAGRAMS.md`
- Publication Platform (`packages/api/src/publication/`)

**Seule zone autorisée pour le code d'intégration :**

```
apps/web/src/features/listener/integration/     (à créer)
apps/mobile/features/streaming/integration/     (à créer)
packages/api/src/streaming/integration/         (adapters uniquement, pas engines)
```

---

## Phase A — Discovery (audit factuel)

### A.1 Runtime Enterprise (packages/api)

| Artefact | Fichier | Rôle |
|---|---|---|
| Coordinator | `runtime/streaming-runtime-coordinator.ts` | Dispatch pipeline, `resolveExecutionMode()` |
| Factory | `runtime/streaming-runtime-factory.ts` | `createStreamingRuntimeFoundation()` |
| Config | `runtime/streaming-runtime-config.ts` | Guards par flag (`isSessionEngineActive`, etc.) |
| Context | `runtime/streaming-runtime-context.ts` | Zero Trust context |
| Session Engine | `session/session-engine.ts` | Lifecycle §5.2 STATE_MACHINE |
| Playback Engine | `playback/playback-engine.ts` | Lifecycle §5.1, signed URL cache |
| Application Service | `application/services/streaming-application.service.ts` | CQRS commands → coordinator |
| Flag resolver | `integration/feature-flags.ts` | 15 flags DB |
| Legacy port | `ports/legacy-streaming.port.ts` | `NoOpLegacyStreamingPort` — toujours `active: true` |

### A.2 Runtime Legacy (production actuelle)

| Couche | Fichier | Flux |
|---|---|---|
| Hook web | `apps/web/.../hooks/usePlayer.ts` | Orchestre heartbeat/complete/queue |
| Context web | `apps/web/.../lib/playerContext.tsx` | `HTMLAudioElement`, heartbeat 10s |
| Service | `packages/api/src/streaming/streaming.service.ts` | `functions.invoke("stream-*")` |
| Edge | `supabase/functions/stream-start|progress|complete` | Real Listen V7.2, signed URL |
| DB | RPC `start_stream_session`, `update_stream_heartbeat`, `complete_stream_session` | Source vérité écoutes |
| Mobile | `apps/mobile/features/streaming/usePlayer.ts` | Expo AV + même `StreamingService` |

### A.3 Points d'entrée UI

| Zone | Composants | Service utilisé |
|---|---|---|
| Web player | `WebPlayer`, `PlayerControls`, `StreamingLayoutClient` | `usePlayer` → `StreamingService` |
| Web discovery | `HomepageTrendingRow`, `AlbumTracksClient`, `SearchResults`, `FavoritesList` | `loadQueueAndPlay` |
| Mobile tabs | `(tabs)/index.tsx`, mini player `_layout.tsx` | `usePlayer` mobile → `StreamingService` |
| Admin flags | `/admin/flags` | `AdminConfigRepository.toggleFeatureFlag` |

### A.4 Signed URL flow (Legacy)

```
usePlayer.loadAndPlay()
  → StreamingService.startStream()
    → edge stream-start (auth JWT)
      → RPC start_stream_session + storage signed URL
  → playerContext.play(track, signedUrl, sessionId, duration)
    → new Audio().src = signedUrl
```

Runtime Enterprise possède `SignedUrlRepositoryContract` + `SignedUrlCache` mais **n'appelle pas** `stream-start` edge aujourd'hui — adapters d'intégration requis.

### A.5 Feature flags live (DB vérifiée 2026-06-26)

Tous **`enabled: false`** :

| Flag | Groupe |
|---|---|
| `streaming_runtime_enabled` | Foundation |
| `runtime_application_layer_enabled` | Foundation |
| `runtime_contracts_enabled` | Foundation |
| `runtime_ports_enabled` | Foundation |
| `runtime_events_enabled` | Foundation |
| `runtime_context_enabled` | Foundation |
| `streaming_session_engine_enabled` | Session |
| `streaming_session_heartbeat_enabled` | Session |
| `streaming_session_recovery_enabled` | Session |
| `streaming_session_expiration_enabled` | Session |
| `streaming_playback_engine_enabled` | Playback |
| `streaming_playback_buffer_enabled` | Playback |
| `streaming_playback_recovery_enabled` | Playback |
| `streaming_playback_quality_enabled` | Playback |
| `streaming_playback_signed_url_enabled` | Playback |

---

## Phase B — Mapping Legacy → Runtime

| # | Legacy | Runtime Enterprise | Mode remplacement | Rollback |
|---|---|---|---|---|
| B1 | `StreamingService.startStream()` | `PlaybackEngine` + `OpenSession` command | Adapter invoke edge OU repository Supabase | Flag OFF → legacy service |
| B2 | `StreamingService.sendHeartbeat()` | `SessionEngine` heartbeat + `RecordHeartbeat` | Bridge dans `usePlayer` callbacks | Flag OFF |
| B3 | `StreamingService.completeStream()` | `SessionEngine.close` + `CompleteSession` | Bridge post-`onended` | Flag OFF |
| B4 | `playerContext` HTMLAudioElement | `PlaybackEngine` state machine §5.1 | **UI inchangée** — adapter sous le hook | Flag OFF |
| B5 | Signed URL via edge | `SignedUrlRepository` + cache | Adapter lit même edge en prod phase 1 | Flag OFF |
| B6 | Heartbeat interval 10s | `streaming_session_heartbeat_enabled` | Conserver interval UI, changer backend | Flag OFF |
| B7 | URL retry on error | `streaming_playback_recovery_enabled` | Feature flag route recovery | Flag OFF |
| B8 | `useStreamQuality` bitrate | `streaming_playback_quality_enabled` | Pass-through qualité | Flag OFF |
| B9 | Queue next/prev | Inchangé UI | Session par track via bridge | N/A |
| B10 | Mobile Expo AV | Même bridge pattern | Phase post-web | Flag OFF |

**Couche d'intégration manquante (à implémenter) :**

```typescript
// Concept — apps/web/src/features/listener/integration/streaming-playback-bridge.ts
// 1. resolve flags via createStreamingRuntimeFoundation(client)
// 2. if legacy mode → delegate StreamingService (comportement actuel)
// 3. if runtime mode → map usePlayer events → Application commands
```

---

## Phase C — Stratégie d'activation progressive

**Règle :** un seul moteur à la fois. Jamais de big bang.

| Étape | Flags à activer (DB admin) | Périmètre | LIVE CONTROL |
|---|---|---|---|
| **1** | `streaming_runtime_enabled` + foundation flags | Coordinator dry-run observable | Status query only |
| **2** | + `streaming_session_engine_enabled` | Session open/heartbeat/close via runtime | Lecture + heartbeat |
| **3** | + `streaming_playback_engine_enabled` | Playback state machine | Play/pause |
| **4** | + `streaming_playback_signed_url_enabled` | Signed URL via runtime cache | Start stream |
| **5** | + `streaming_playback_buffer_enabled` | Buffering states | Réseau lent simulé |
| **6** | + `streaming_playback_recovery_enabled` | Recovery on error | Couper réseau |
| **7** | + `streaming_playback_quality_enabled` | Qualité adaptive | Changer bitrate |
| **8** | Session heartbeat/recovery/expiration flags | Session complète | Long listen |

**Prérequis avant étape 1 :** ~~couche bridge code + observability (Phase F)~~ ✅ livré 26 juin 2026.

---

## Phase D — Feature flags

- ✅ 15 flags indépendants en DB
- ✅ Resolver `StreamingRuntimeFeatureFlagResolver`
- ✅ Toggle admin `/admin/flags` sans redéploiement
- ✅ `requiresLegacyPath()` force legacy si `streaming_runtime_enabled=false`
- ⚠️ Pas de flag `runtime_coordinator_enabled` séparé — utiliser `streaming_runtime_enabled`

**Rollback < 30s :** désactiver le flag concerné dans `/admin/flags` → prochain `loadAndPlay` repasse legacy (après bridge implémenté).

---

## Phase E — Rollback

| Action | Délai | Redéploiement |
|---|---|---|
| Désactiver 1 flag DB | < 30s | Non |
| Tous flags OFF | Immédiat | Non |
| Legacy `StreamingService` | Toujours disponible | N/A |

---

## Phase F — Observability (pré-requis intégration)

Implémenté dans la couche bridge (engines LOCKED inchangés) :

| ID | Champ | Usage | Statut |
|---|---|---|---|
| `correlationId` | UUID par `loadAndPlay` | Lier UI → runtime → edge | ✅ |
| `playbackId` | UUID par instance audio | Debug multi-tab | ✅ |
| `mode` | `legacy` \| `runtime` \| `dry_run` | Métrique activation | ✅ |
| `traceId` | Header ou context runtime | Logs structurés | 🔵 étape 2+ |

Logs : `[StreamingBridge]` en dev (`streaming-bridge-logger.ts`) — `mode`, `trackId`, `sessionId`, `runtimeEnabled`.

---

## Phase G — Performance (méthodologie)

Comparer Legacy vs Runtime sur même track, même réseau :

| Métrique | Outil |
|---|---|
| Time to first byte | DevTools Network |
| Time to play | `performance.now()` dans bridge |
| Buffer events | PlaybackEngine events vs audio `waiting` |
| Re-renders | React Profiler sur `WebPlayer` |
| Heartbeat count | Network tab `stream-progress` |

**Gate :** Runtime ≤ Legacy + 10 % sur time-to-play (tolérance intégration).

---

## Phase H — Compatibilité

| Cible | Priorité MVP |
|---|---|
| Chrome desktop | P0 |
| Firefox desktop | P1 |
| Edge desktop | P1 |
| Mobile Chrome | P1 |
| Safari desktop/iOS | P2 |
| Expo iOS/Android | Phase post-web |

---

## Phase I — État d'intégration (26 juin 2026)

| Composant activé en prod | Statut |
|---|---|
| Bridge web (`StreamingPlaybackBridge`) | ✅ Étapes 1 — observe-only |
| Runtime Coordinator (UI) | 🟡 Branché bridge, flags OFF en prod |
| Session Engine | ❌ |
| Playback Engine | ❌ |
| Buffer / Recovery / Quality / Signed URL | ❌ |
| Legacy StreamingService | ✅ 100 % lecture audio |

### Dette restante

1. ~~Créer couche bridge web (`listener/integration/`)~~ ✅
2. ~~Créer hook `useStreamingPlaybackBridge` dans `usePlayer`~~ ✅
3. ~~Observability logs (Phase F)~~ ✅ (dev)
4. LIVE CONTROL exécuté par Rémy
5. Mobile bridge (post-web)
6. Étapes 2–8 activation flag par flag

---

## Auto-review (26 juin 2026)

| Critère | Statut |
|---|---|
| Aucun contrat modifié | ✅ |
| Aucun moteur réécrit | ✅ |
| Aucune duplication engine | ✅ |
| Impact Wallet / Royalties / Ledger / Analytics / Publication / Metadata | ✅ Aucun |
| Code intégration ajouté | ✅ Bridge étape 1 (observe-only) |

---

## Validations (26 juin 2026)

| Commande | Résultat |
|---|---|
| `pnpm typecheck` | ✅ 15/15 |
| `pnpm lint` | ✅ 15/15 |
| `pnpm build` | ✅ 9/9 |
| `pnpm --filter @sonafrik/api test` | ✅ **262/262** |
| Legacy player (prod) | ✅ Inchangé |
| `pnpm probe:certification` | ✅ 129/129 |

---

## LIVE CONTROL

Checklist détaillée : [`LIVE_CONTROL_SPRING2.md`](./LIVE_CONTROL_SPRING2.md)

**Statut :** 🟢 **LIVE CONTROL PRÊT** — en attente validation Rémy Goumou.

Aucune activation runtime ne sera effectuée avant signature LIVE CONTROL.

---

## Décision finale

```
🟡 SPRING 2 RUNTIME — MVP INTEGRATION PARTIEL (étape 1 / 8)
```

**Motif :** bridge observe-only livré ; LIVE CONTROL non exécuté par le fondateur ; étapes 2–8 en attente.

**Prochaine étape :** LIVE CONTROL Rémy sur `/listen` → activation flag par flag (session engine étape 2).

---

*Programme aligné sur `docs/streaming/SPRING_2_PROGRAM.md` · Engines LOCKED · Real Listen V7.2 préservé.*
