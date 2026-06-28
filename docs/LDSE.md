# Live Data Synchronization Engine (LDSE)

> Architecture enterprise de synchronisation temps réel — SONAFRIK v1.0

## Objectif

Une seule vérité par métier. Tous les composants lisent la même source, invalidée intelligemment après chaque mutation.

## Couches

```
┌─────────────────────────────────────────────────────────┐
│  UI (Sidebar, Dashboard, Tables, Badges)                │
├─────────────────────────────────────────────────────────┤
│  LDSE Client — Event Bus + Cache + Providers            │
│  apps/web/src/features/shared/ldse/                     │
├─────────────────────────────────────────────────────────┤
│  Server Actions — refreshAdminLiveSnapshotAction        │
├─────────────────────────────────────────────────────────┤
│  SSOT API — packages/api (AdminMetricsRepository, …)    │
├─────────────────────────────────────────────────────────┤
│  Supabase — Realtime postgres_changes + RLS             │
└─────────────────────────────────────────────────────────┘
```

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `ldse/event-bus.ts` | Pub/sub événements métier |
| `ldse/cache.ts` | Cache TTL partagé + invalidation |
| `ldse/LdseProvider.tsx` | Context React global |
| `ldse/admin/AdminLdseProvider.tsx` | Snapshot admin synchronisé |
| `admin/admin-ldse-config.ts` | Clés cache + mapping Realtime |
| `admin/actions/admin-ldse.actions.ts` | Refresh serveur |
| `packages/api/.../admin.metrics.repository.ts` | SSOT comptages fraude |

## Cycle de vie d'une donnée

1. **SSR** : layout admin appelle `getAdminLiveSnapshot()`.
2. **Hydratation** : `AdminLdseProvider` seed le cache LDSE.
3. **Realtime** : changement DB → `useAdminLiveRefresh` → Event Bus.
4. **Invalidation** : règles `registerLdseInvalidationRule` effacent clés cache.
5. **Refresh ciblé** : `refreshAdminLiveSnapshotAction()` met à jour badges/metrics.
6. **RSC** : `router.refresh()` conserve cohérence pages serveur.

## Event Bus — conventions

Format : `domaine.entité.action`

Exemples admin :

- `admin.snapshot.invalidate`
- `admin.snapshot.refreshed`
- `fraud.updated`
- `admin.catalog.updated`

Publication après mutation :

```typescript
import { publishAdminLdseEvent, ADMIN_LDSE_EVENTS } from "@/features/shared/ldse";

publishAdminLdseEvent(ADMIN_LDSE_EVENTS.catalogUpdated, { trackId });
```

## Cache — clés admin

```typescript
ADMIN_LDSE_KEYS.liveSnapshot  // "admin:live-snapshot"
ADMIN_LDSE_KEYS.navBadges     // "admin:nav-badges"
ADMIN_LDSE_KEYS.fraudMetrics  // "admin:fraud-metrics"
```

TTL par défaut : 30 s (cache global), 60 s (snapshot admin).

## SSOT Fraude

Définition canonique : sessions `stream_sessions` où `fraud_flags != '{}'`.

| Champ | Usage |
|---|---|
| `totalFlagged` | Sidebar, KPI dashboard, total page fraude |
| `flaggedThisMonth` | Alertes cockpit (libellé « ce mois ») |
| `flaggedToday` | KPI supervision jour |

## Optimistic UI

```typescript
const { applyOptimistic } = useLdse();
const rollback = applyOptimistic({
  key: ADMIN_LDSE_KEYS.navBadges,
  apply: (current) => ({ ...current, content: current.content - 1 }),
});
try {
  await reviewCatalogAction(...);
} catch {
  rollback();
}
```

## Background refresh

`useLdseBackgroundRefresh` : focus fenêtre, `online`, `visibilitychange` — pas de polling aveugle.

## Observabilité (dev)

```javascript
window.__SONAFRIK_LDSE__() // cache hits, events, subscriptions Realtime
```

## Règles d'utilisation

1. ❌ Pas de requête métier ad hoc dans un composant React.
2. ✅ Ajouter métrique dans `packages/api` repository dédié.
3. ✅ Publier événement LDSE après toute mutation.
4. ✅ Enregistrer règle d'invalidation si nouvelle clé cache.
5. ❌ Ne pas modifier Session Engine (`packages/api/src/streaming/session/` — LOCKED).

## LDSE v2 (28 juin 2026)

- `AdminModerationMetrics` + `AdminUserMetrics` — SSOT catalog / retraits / droits / users
- `getAdminLiveSnapshot()` inclut moderation + user metrics
- Invalidation ciblée catalog / withdrawals / rights / users
- `useAdminActionRunner({ ldseEvent })` — sync après mutations admin
- `useNotificationsLdseCount` — cloche + liste notifications
- `RootLdseShell` — provider global Event Bus + cache

## Migration progressive

1. Admin (v1 — fait)
2. Notifications + social
3. Creator catalog
4. Listener library
5. Wallet (tests obligatoires)
