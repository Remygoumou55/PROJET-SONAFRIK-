-- Admin Realtime — publication supabase_realtime pour KPIs instantanés
-- Inscription, streams, revenus, modération → refresh admin < 1 s

BEGIN;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'artist_profiles',
    'creators',
    'stream_sessions',
    'wallet_ledger',
    'albums',
    'tracks',
    'withdrawals',
    'rights_claims',
    'creator_verifications',
    'audit_logs'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

COMMIT;
