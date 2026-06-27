BEGIN;

-- Agrégats landing en 1 round-trip (évite 4 requêtes + scan client-side).
CREATE OR REPLACE FUNCTION public.get_landing_public_stats(
  p_heartbeat_since timestamptz,
  p_month_start timestamptz
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'active_streams', (
      SELECT COUNT(*)::int
      FROM public.stream_sessions
      WHERE completed_at IS NULL
        AND last_heartbeat_at >= p_heartbeat_since
    ),
    'total_artists', (
      SELECT COUNT(*)::int
      FROM public.profiles
      WHERE account_type IN ('artiste', 'auditeur_artiste')
    ),
    'royalties_paid_gnf', (
      SELECT COALESCE(SUM(net_amount_gnf), 0)::bigint
      FROM public.transactions
      WHERE type = 'royalty_payout'
        AND status = 'completed'
    ),
    'monthly_royalties_gnf', (
      SELECT COALESCE(SUM(net_amount_gnf), 0)::bigint
      FROM public.transactions
      WHERE type = 'royalty_payout'
        AND status = 'completed'
        AND created_at >= p_month_start
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_landing_public_stats(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_landing_public_stats(timestamptz, timestamptz) TO anon, authenticated;

COMMIT;
