-- Phase A : complete_stream_session utilise max(position client, heartbeats clampés)

BEGIN;

CREATE OR REPLACE FUNCTION public.complete_stream_session(
  p_session_id UUID,
  p_position_seconds INTEGER,
  p_total_duration_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_listen_percentage NUMERIC(5,2);
  v_is_valid BOOLEAN;
  v_existing RECORD;
  v_effective_position INTEGER;
BEGIN
  SELECT is_valid_listen, completed_at, total_listened_seconds
  INTO v_existing
  FROM public.stream_sessions
  WHERE id = p_session_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable.';
  END IF;

  IF v_existing.completed_at IS NOT NULL THEN
    RETURN COALESCE(v_existing.is_valid_listen, false);
  END IF;

  v_effective_position := GREATEST(
    GREATEST(p_position_seconds, 0),
    COALESCE(v_existing.total_listened_seconds, 0)
  );

  IF p_total_duration_seconds <= 0 THEN
    v_listen_percentage := 0;
  ELSE
    v_listen_percentage := LEAST(
      (v_effective_position::NUMERIC / p_total_duration_seconds::NUMERIC) * 100,
      100
    );
  END IF;

  v_is_valid := v_listen_percentage >= 90.0;

  UPDATE public.stream_sessions
  SET completed_at = now(),
      total_listened_seconds = v_effective_position,
      total_duration_seconds = GREATEST(p_total_duration_seconds, total_duration_seconds),
      listen_percentage = v_listen_percentage,
      is_valid_listen = v_is_valid
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND completed_at IS NULL;

  IF NOT FOUND THEN
    SELECT is_valid_listen INTO v_is_valid
    FROM public.stream_sessions
    WHERE id = p_session_id
      AND user_id = auth.uid()
      AND completed_at IS NOT NULL;
    RETURN COALESCE(v_is_valid, false);
  END IF;

  RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.complete_stream_session TO authenticated;

COMMIT;
