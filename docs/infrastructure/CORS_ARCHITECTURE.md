# Architecture CORS — Edge Functions SONAFRIK

> Référence officielle · Infrastructure Enterprise · Juin 2026

## Problème résolu

Les Edge Functions renvoyaient une origine **statique** (`ALLOWED_ORIGIN` ou fallback production), bloquant `http://localhost:3000` lors du Live Control MVP (upload audio via `catalog-asset-signed-url`).

## Principe

| Règle | Implémentation |
|---|---|
| **Source unique** | `supabase/functions/_shared/cors-policy.ts` + `cors.ts` |
| **Zero Trust** | Refléter uniquement les origines whitelistées |
| **Jamais `*`** | Interdit sur fonctions financières / upload / streaming |
| **Dynamique** | `buildCorsHeaders(req)` lit le header `Origin` |
| **Preflight** | `handleCorsPreflightIfNeeded(req)` → 204 |
| **Webhooks** | `handleWebhookPreflightIfNeeded(req)` — pas de CORS navigateur |

## Origines autorisées par défaut

```
http://localhost:3000
http://127.0.0.1:3000
https://sonafrik.vercel.app
*.vercel.app (preview, si ALLOW_VERCEL_PREVIEW !== false)
```

## Variables d'environnement (Supabase Secrets)

| Variable | Rôle |
|---|---|
| `ALLOWED_ORIGINS` | Origines supplémentaires (séparées par virgules) |
| `ALLOWED_ORIGIN` | **Déprécié** — rétrocompat, ajouté à la whitelist |
| `ALLOW_VERCEL_PREVIEW` | `false` pour désactiver `*.vercel.app` |

> **Note :** `ALLOWED_ORIGIN=https://sonafrik.vercel.app` seul ne bloque plus localhost — la résolution est dynamique.

## Matrice Edge Functions

| Fonction | Catégorie | Handler CORS |
|---|---|---|
| `catalog-asset-signed-url` | Catalog / Upload | `corsJsonResponse` + preflight |
| `creator-asset-signed-url` | Catalog / Upload | `corsJsonResponse` + preflight |
| `avatar-signed-url` | Storage | `corsJsonResponse` + preflight |
| `stream-start` | Streaming | `buildCorsHeaders` + preflight |
| `stream-progress` | Streaming | `buildCorsHeaders` + preflight |
| `stream-complete` | Streaming | `buildCorsHeaders` + preflight |
| `payment-initiate` | Payments | `corsJsonResponse` + preflight |
| `wallet-topup` | Wallet | `corsJsonResponse` + preflight |
| `wallet-request-withdrawal` | Wallet | `buildCorsHeaders` + preflight |
| `audit-log` | Admin | `buildCorsHeaders` + preflight |
| `payment-*-callback` (×4) | Webhook | `handleWebhookPreflightIfNeeded` |

## Usage dans une nouvelle Edge Function

```typescript
import {
  buildCorsHeaders,
  corsJsonResponse,
  handleCorsPreflightIfNeeded,
} from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const json = (body: unknown, status = 200) => corsJsonResponse(req, body, status);
  // ...
});
```

## Tests & certification

```bash
pnpm test:cors          # unitaires cors-policy (vitest)
pnpm probe:cors         # probe statique + preflight live
pnpm build && pnpm lint && pnpm typecheck
```

## Déploiement

Après modification du module CORS :

```bash
supabase functions deploy
```

## LIVE CONTROL — validation attendue

- [ ] Upload audio depuis `localhost:3000` — pas d'erreur CORS
- [ ] Upload cover / avatar
- [ ] Streaming (stream-start/progress/complete)
- [ ] Wallet / payment-initiate OPTIONS
- [ ] Console navigateur sans blocage CORS

---

*Dernière mise à jour : programme CORS Infrastructure Hardening — Juin 2026*
