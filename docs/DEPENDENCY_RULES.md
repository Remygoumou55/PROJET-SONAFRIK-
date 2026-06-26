# DEPENDENCY RULES — SONAFRIK

> Règles de couplage et d'import — obligatoires pour toute IA et tout contributeur.  
> Dernière mise à jour : 2026-06-25 (SPRING 2 programme)

---

## 1. Règles Web (`apps/web`)

### 1.1 Isolation domaines features

```
❌ features/listener/**  →  features/creator/**
❌ features/creator/**   →  features/listener/**
✅ features/*/           →  features/shared/**
```

### 1.2 Couche données

```
❌ Composant React       →  @supabase/supabase-js direct
✅ Composant React       →  hook feature  →  @sonafrik/api/<domain>
✅ Server Component      →  packages/api service (pas de .from() direct — gap connu SSR listener)
```

**Dette documentée :** pages SSR listener appellent encore Supabase direct (`MASTER_PLAN` R1).  
**SPRING 2.8** doit router via Application Services sans changer les écrans.

### 1.3 Player

```
❌ URL audio directe / barre player cliquable (CDC)
✅ startStream() → signedUrl éphémère serveur uniquement
```

---

## 2. Règles API (`packages/api`)

### 2.1 Hiérarchie des couches (SPRING 2)

```
UI / Edge Function (transport)
        ↓
streaming/application     ← seule porte d'entrée publique (post 2.8)
        ↓
streaming/runtime         ← orchestration, pas de logique métier inline
        ↓
session | playback | analytics | antifraud | ledger  ← engines
        ↓
streaming.repository / persistence adapters
        ↓
Supabase (RLS)
```

### 2.2 Imports interdits

| Import | Raison |
|---|---|
| `streaming/**` → `wallet/**` | Couplage financier — passer par ledger events |
| `streaming/**` → `creator/**` | Isolation listener/creator |
| `ledger/**` → `wallet/**` (écriture) | Wallet reste domaine séparé jusqu'à intégration post-SPRING 2 |
| `listener hooks` → `packages/api` internals | Uniquement exports publics `@sonafrik/api/streaming` |
| `engines/**` → `apps/web/**` | API pure |

### 2.3 Imports autorisés (SPRING 2)

| Module | Peut importer |
|---|---|
| `streaming/application` | `runtime`, `dto`, `errors`, `@sonafrik/types` |
| `streaming/runtime` | tous engines, `transactions`, `events` |
| `streaming/session` | `persistence`, `@sonafrik/types`, `errors` |
| `streaming/playback` | `session`, `catalog` (read track_files), `errors` |
| `streaming/analytics` | `session`, `ledger` (read), `errors` |
| `streaming/antifraud` | `session`, `errors` |
| `streaming/ledger` | `session`, `@sonafrik/types`, `errors` — **pas wallet** |
| `streaming/integration` | `application`, `feature-flags`, legacy `streaming.service` |

### 2.4 Legacy coexistence (2.1 → 2.8)

```
StreamingService (legacy)     ← reste actif, flags OFF
StreamingApplicationService   ← nouveau, flags ON progressif
```

**Règle :** aucune suppression du legacy avant certification 2.7 + rollout 2.8 validé.

---

## 3. Règles Types (`packages/types`)

```
✅ Tous domaines  →  packages/types (source unique)
❌ Redéfinir StreamSession, LedgerEntry localement dans features/
```

Nouveaux types SPRING 2 : `StreamLedgerEntry`, `FraudScore`, `PlaybackSessionState`, `StreamingRuntimeConfig`.

---

## 4. Règles Persistence

```
❌ UPDATE / DELETE sur stream_events
❌ UPDATE / DELETE sur wallet_ledger
❌ UPDATE / DELETE sur stream_ledger_entries (proposé — append-only)
✅ INSERT stream_ledger_entries avec idempotency_key unique
✅ RLS sur toute nouvelle table
```

---

## 5. Règles Edge Functions

```
✅ Auth JWT obligatoire
✅ CORS ALLOWED_ORIGIN strict (`_shared/cors.ts` — fermé 26 juin 2026)
✅ Edge = transport fin — logique métier migre vers packages/api engines
❌ Calcul Real Listen côté client
❌ service_role key exposée
```

---

## 6. Règles Tests

| Module | Seuil couverture cible |
|---|---|
| `streaming/application` | ≥95 % |
| `streaming/session` | ≥95 % |
| `streaming/ledger` | ≥98 % (financier) |
| `streaming/antifraud` | ≥90 % |
| Engines combinés | probes live + certification script |

---

## 7. Règles MVP Scope Lock (non négociables SPRING 2)

| Interdit pendant SPRING 2 | Raison |
|---|---|
| Modifier écrans listener/creator/wallet | Programme 2.8 = intégration invisible |
| Modifier royalty engine SQL | Hors périmètre — consomme ledger plus tard |
| Modifier wallet / retraits | Hors périmètre |
| Beat Store / Marketplace | MVP Scope Lock |
| HLS / transcoding | Post-MVP (E1 PLAN_CORRECTION) |

---

## 8. Ordre de dépendance build (monorepo)

```
@sonafrik/types
        ↓
@sonafrik/persistence
        ↓
@sonafrik/api (streaming engines)
        ↓
@sonafrik/web / @sonafrik/mobile
```

Aucun package `apps/*` ne doit être importé par `packages/api`.
