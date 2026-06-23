-- Sprint 1.3-C — Fermer les sessions concurrentes au démarrage d'une nouvelle lecture
-- Évite le spam multi-play et prépare la détection fraude Sprint 1.4.

CREATE OR REPLACE FUNCTION public.start_stream_session(
  p_track_id UUID,
  p_platform TEXT DEFAULT 'web',
  p_quality_kbps INTEGER DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL,
  p_total_duration_seconds INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non authentifié.'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tracks
    WHERE id = p_track_id
      AND publication_status = 'published'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Morceau introuvable ou non publié.';
  END IF;

  -- Fermer toutes les sessions incomplètes : orpheline (>5 min) ou multi-session (spam)
  UPDATE public.stream_sessions
  SET completed_at = now(),
      is_valid_listen = false,
      fraud_flags = array_append(
        COALESCE(fraud_flags, '{}'),
        CASE
          WHEN last_heartbeat_at < now() - INTERVAL '5 minutes' THEN 'orphaned_session'
          ELSE 'multi_session_start'
        END
      )
  WHERE user_id = v_user_id
    AND completed_at IS NULL;

  INSERT INTO public.stream_sessions (
    user_id, track_id, platform, quality_kbps, device_id, total_duration_seconds
  ) VALUES (
    v_user_id, p_track_id, p_platform, p_quality_kbps, p_device_id, p_total_duration_seconds
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.start_stream_session TO authenticated;
