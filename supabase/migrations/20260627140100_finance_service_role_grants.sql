-- GRANT service_role sur tables finance (probes E2E + admin scripts)
BEGIN;

GRANT SELECT ON public.withdrawals TO service_role;
GRANT SELECT ON public.payout_accounts TO service_role;
GRANT SELECT ON public.payout_batches TO service_role;
GRANT SELECT ON public.payout_audit_logs TO service_role;

COMMIT;
