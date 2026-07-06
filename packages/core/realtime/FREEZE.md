# SRTSP v3.9 — FREEZE (Phase 3.9 Workspace Super Admin Hub)

**Package :** `@sonafrik/realtime` v3.9.0  
**Date freeze :** 2026-07-05

| Version | Note |
|---|---|
| v3.7.0 | Artist Profile Hub consumer |
| v3.8.0 | Workspace Auditeur Hub consumer |
| v3.9.0 | Workspace Super Admin Hub consumer |

## Intégration app

- `useAdminSrtspLiveQuery.ts` → SSOT Super Admin
- `useAdminUsersSrtspLive.ts` → `/admin/users`
- `useAdminArtistsSrtspLive.ts` → `/admin/artists`
- `useAdminCatalogSrtspLive.ts` → modération catalogue
- `useAdminWithdrawalsSrtspLive.ts` → `/admin/withdrawals`
- `useAdminRevenueSrtspLive.ts` → `/admin/finance`
- `useAdminAwardsSrtspLive.ts` → `/admin/awards`
- `AdminLdseProvider.tsx` → snapshot SRTSP + LDSE bridge
- `useAdminLiveRefresh.ts` → pont DB Realtime → LDSE (0 F5)

## Gelé — ne pas modifier

- Phases 3.1 → 3.8 consumers
- Workspace Super Admin Hub (v3.9.0)
