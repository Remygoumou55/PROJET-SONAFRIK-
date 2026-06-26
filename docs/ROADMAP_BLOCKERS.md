# Roadmap — Bloqueurs externes (hors code)

> Items reportés volontairement — ne pas implémenter sans action fondateur / opérateurs.

## A1 — Credentials opérateurs prod

| Opérateur | Statut | Référence |
|---|---|---|
| Wave GN | Staging OK · prod = credentials Rémy | `docs/PAIEMENTS.md` |
| Orange Money GN | HMAC webhook prêt · prod = credentials | `docs/P0-2-PHASE-2-ORANGE-MONEY.md` |
| MTN MoMo GN | Callback API key · prod = credentials | `docs/PAIEMENTS.md` |
| Soutra Money | Webhook prêt · prod = credentials | `docs/PAIEMENTS.md` |

**Déblocage :** variables `WAVE_*`, `ORANGE_*`, `MTN_*`, `SOUTRA_*` en secrets Vercel + Supabase Edge.

## A2 — LIVE CONTROL A5 (signature fondateur)

Checklist performance/UX à valider manuellement avant lancement public.

| Document | Rôle |
|---|---|
| `docs/streaming/LIVE_CONTROL_SPRING2.md` | Go/no-go streaming |
| `docs/performance/LIVE_CONTROL_PERFORMANCE.md` | Go/no-go perf UX |

**Déblocage :** signature Rémy Goumou sur checklist LIVE CONTROL.

---

*War Plan exécuté côté code — ces deux items restent la seule dette bloquante revenu/lancement.*
