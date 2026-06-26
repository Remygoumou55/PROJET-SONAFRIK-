# Audit maître — Vagues A → E (juin 2026)

> Certification senior ordonnée : sécurité → stabilisation → architecture → design/typage → paiements.

## Commande unique

```bash
pnpm probe:certification-a-e
```

Exécute dans l'ordre strict A → B → C → D → E (+ Global SCS hex/Tailwind).

---

## Scorecard (dernier audit)

| Vague | Probe historique | Probe stabilisation | Total | Statut |
|---|---|---|---|---|
| **A** Sécurité + finance | 15/15 (`probe:vague-a`) | 15/15 (`probe:vague-a-launch`) | **30/30** | ✅ |
| **B** Types + middleware | 19/19 (`probe:vague-b`) | 11/11 (`probe:vague-b-stabilisation`) | **30/30** | ✅ |
| **C** Admin + nettoyage | 19/19 (`probe:vague-c`) | 16/16 (`probe:vague-c-stabilisation`) | **35/35** | ✅ |
| **D** Tokens + typage | 23/23 (`probe:vague-d`) | 23/23 (`probe:vague-d-stabilisation`) | **46/46** | ✅ |
| **E** Paiements mobiles | 22/22 (`probe:vague-e`) | 26/26 (`probe:vague-e-stabilisation`) | **48/48** | ✅ |
| **SCS** Design system | — | 4/4 (`probe:hex-colors`) | **4/4** | ✅ |
| **TOTAL A→E** | | | **193/193** | ✅ |

### CI complémentaire (hors A→E strict)

| Probe | Score | Rôle |
|---|---|---|
| `probe:certification` (A→F) | 130/130 | Certification globale monorepo |
| `probe:vague-g-stabilisation` | 17/17 | Chaîne MVP royalties/payout |
| `pnpm build` | 9/9 packages | Next.js 47 routes |
| `pnpm lint` | 15/15 | ESLint monorepo |
| `pnpm typecheck` | 15/15 | TypeScript strict |
| Tests API | 283/283 | Vitest `packages/api` |

---

## Par vague — ce qui est vérifié

### A — Sécurité financière
- `topup_wallet` / `confirm_payment_intent` refusés côté client
- `wallet-topup` edge → `topup_disabled`
- Admin guard middleware + `requireAdmin`
- BYPASS_AUTH bloqué sur Vercel
- Subscription plans DB (4 slugs, prix live)

### B — Stabilisation
- `subscription_plans` typée + `gen-types`
- Middleware session + timeout admin SSR-safe
- CSP prod sans `unsafe-eval`
- Feature flags : 3 MVP ON, expérimentaux OFF

### C — Nettoyage
- Like ≠ Favorite (`likes` + `toggle_like`)
- Discovery/analytics sur table `likes`
- Beat store gated (`beat_store=false`)
- 0 hex mobile

### D — Design + typage
- 0 hex web (allowlist tokens + Google brand)
- 0 palette Tailwind brute (`text-red-500`, etc.)
- 0 `as never` / `as any` en prod API
- Repositories stricts (erreurs propagées)
- Caps perf analytics

### E — Paiements
- 4 opérateurs intégrés (`_shared/payments.ts`)
- Webhooks HMAC (Wave/Soutra/Orange) + MTN API key
- `payment-initiate` sandbox + vérif updates DB
- `confirm_payment_intent` service_role only
- UI wallet gated + historique erreurs

---

## DB live validée (audit)

| Table | RLS |
|---|---|
| `likes` | ✅ |
| `subscription_plans` | ✅ |
| `payment_intents` | ✅ |
| `payout_audit_logs` | ✅ |

Plans : `gratuit` 0 · `premium` 50 000 · `premium-annual` 480 000 · `artiste` 100 000 GNF

---

## Dette documentée (non bloquante beta)

| ID | Item | Priorité | Action |
|---|---|---|---|
| EXT-1 | Credentials opérateurs prod (Rémy) | Bloquant revenu réel | `P0-2-PHASE-2-ORANGE-MONEY.md` |
| EXT-2 | A5 LIVE CONTROL signature fondateur | Bloquant lancement | `streaming/LIVE_CONTROL_SPRING2.md` |
| P2-1 | `rgba()` résiduels (~30 fichiers web) | Basse | Migrer vers tokens opacity (post-beta) |
| P2-2 | `as never` dans tests API (37) | Basse | Accepté — hors prod |
| P2-3 | Mobile auth guard tabs | Haute mobile | Roadmap post-beta web |

---

## Prochaine étape

**A5 LIVE CONTROL** puis activation prod paiements (EXT-1).
