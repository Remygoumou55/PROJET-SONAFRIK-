-- Admin Live Control — GRANT SELECT service_role
-- ---------------------------------------------------------------------------
-- Le client service_role bypass RLS mais PostgreSQL exige quand même les
-- privilèges table-level. Sans GRANT SELECT → erreur 42501 sur le panneau
-- admin (stream_sessions, wallet_ledger, royalty_cycles, etc.).
-- ---------------------------------------------------------------------------

BEGIN;

GRANT SELECT ON public.stream_sessions TO service_role;
GRANT SELECT ON public.royalty_cycles TO service_role;
GRANT SELECT ON public.wallet_ledger TO service_role;
GRANT SELECT ON public.wallets TO service_role;
GRANT SELECT ON public.withdrawals TO service_role;
GRANT SELECT ON public.payment_intents TO service_role;
GRANT SELECT ON public.admin_notifications TO service_role;
GRANT SELECT ON public.feature_flags TO service_role;
GRANT SELECT ON public.system_settings TO service_role;
GRANT SELECT ON public.rights_claims TO service_role;

COMMIT;
