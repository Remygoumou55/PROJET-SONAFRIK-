# SRTSP — React Hooks

Import : `@sonafrik/realtime/react`

## Provider

```tsx
<SrtspProvider trackBrowserOnline>
  {children}
</SrtspProvider>
```

## Hooks

| Hook | Alias | Usage |
|---|---|---|
| `useSrtsp()` | — | Contexte complet |
| `useRealtime()` | officiel | Alias useSrtsp |
| `useSynchronization()` | — | Alias useSrtsp |
| `useEventSubscription(name, handler)` | — | Abonnement événement |
| `useLiveQuery(key, fetcher, invalidateOn)` | — | Query + invalidation auto |

## useLiveQuery

```typescript
const { data, loading, refresh } = useLiveQuery(
  "creator:tracks",
  () => catalog.listTracks(),
  ["catalog.invalidate", "catalog.track.updated"],
);
```

## Intégration app

`RootSrtspShell` + `useLdseSrtspBridge` dans `apps/web/src/features/shared/srtsp/`
