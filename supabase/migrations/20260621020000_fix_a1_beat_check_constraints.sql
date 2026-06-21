-- FIX LOT A1 — Correction CHECK constraints pour purchase_beat RPC
-- Bug: 'beat_sale' absent de transactions.type CHECK
--      'beat_purchase' et 'beat_sale' absents de wallet_ledger.reason CHECK
-- Context: Beat Store désactivé (feature_flag = false) → 0 ligne existante violée
-- Fixes: purchase_beat RPC lignes 238, 251, 260

BEGIN;

-- ─── 1. transactions.type — ajouter 'beat_sale' ─────────────────────────────
ALTER TABLE public.transactions DROP CONSTRAINT transactions_type_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type = ANY (ARRAY[
    'topup'::text, 'subscription'::text, 'tip'::text,
    'beat_purchase'::text, 'beat_sale'::text,
    'withdrawal'::text, 'royalty_payout'::text, 'refund'::text
  ]));

-- ─── 2. wallet_ledger.reason — ajouter 'beat_purchase' et 'beat_sale' ────────
ALTER TABLE public.wallet_ledger DROP CONSTRAINT wallet_ledger_reason_check;

ALTER TABLE public.wallet_ledger
  ADD CONSTRAINT wallet_ledger_reason_check
  CHECK (reason = ANY (ARRAY[
    'topup'::text, 'subscription'::text, 'royalty'::text, 'tip'::text,
    'beat_purchase'::text, 'beat_sale'::text,
    'refund'::text, 'withdrawal'::text, 'commission'::text
  ]));

COMMIT;
