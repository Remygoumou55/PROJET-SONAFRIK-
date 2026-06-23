-- Sprint 1.3-B — Persistance fraud_flags depuis stream-progress
-- Les clients authenticated n'ont pas GRANT UPDATE sur stream_sessions ;
-- cette RPC SECURITY DEFINER fusionne les flags anti-fraude détectés.

CREATE OR REPLACE FUNCTION public.append_stream_session_fraud_flags(
  p_session_id UUID,
  p_flags TEXT[]
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié.';
  END IF;

  IF p_flags IS NULL OR array_length(p_flags, 1) IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.stream_sessions
  SET fraud_flags = (
    SELECT COALESCE(array_agg(DISTINCT flag), '{}')
    FROM unnest(
      COALESCE(fraud_flags, '{}') || p_flags
    ) AS flag
  )
  WHERE id = p_session_id
    AND user_id = v_user_id
    AND completed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.append_stream_session_fraud_flags FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_stream_session_fraud_flags TO authenticated;
