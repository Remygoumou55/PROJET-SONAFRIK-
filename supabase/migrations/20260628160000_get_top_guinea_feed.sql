-- Top Guinée : une seule RPC avec fallback 7j → 30j → all-time (perf homepage)

BEGIN;

CREATE OR REPLACE FUNCTION public.get_top_guinea_feed(p_limit INTEGER DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lim    INTEGER;
  v_tracks JSONB;
  v_rec    RECORD;
BEGIN
  v_lim := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);

  FOR v_rec IN
    SELECT * FROM (VALUES
      ('7d'::text,  '7 derniers jours'),
      ('30d'::text, '30 derniers jours'),
      ('all'::text, 'Toutes périodes')
    ) AS w(period, label)
  LOOP
    v_tracks := public.get_trending_tracks(v_rec.period, v_lim);
    IF jsonb_array_length(COALESCE(v_tracks, '[]'::jsonb)) > 0 THEN
      RETURN jsonb_build_object(
        'period', v_rec.period,
        'period_label', v_rec.label,
        'tracks', v_tracks
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'period', 'all',
    'period_label', 'Nouveautés',
    'tracks', '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_top_guinea_feed FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_guinea_feed TO authenticated, anon;

COMMIT;
