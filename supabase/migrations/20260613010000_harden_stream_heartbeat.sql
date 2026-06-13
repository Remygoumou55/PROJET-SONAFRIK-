-- ============================================================
-- C-5.2 — Renforcement anti-fraude : update_stream_heartbeat
-- Ajoute un clamp serveur pour bloquer les sauts de position impossibles
-- même si un client malveillant bypasse la protection client C-3.0.
--
-- Logique : la position acceptée ne peut pas dépasser
-- (position précédente) + (temps écoulé * 1.5)
-- Même ratio que MAX_PROGRESS_SPEED_RATIO dans stream-progress/index.ts
--
-- AVANT : total_listened_seconds = GREATEST(p_position_seconds, 0)
--         → Un client peut envoyer 285 dès la 1ère seconde.
--
-- APRÈS : total_listened_seconds = LEAST(GREATEST(p_position_seconds, 0), max_admissible)
--         → Un seek à 285s reçu 10s après start → max = 0 + 10*1.5 = 15 → clamped à 15
--
-- SCÉNARIO DE TEST :
--   1. Démarrer une session sur un track de 300s
--   2. Attendre 0 secondes, envoyer p_position_seconds = 285 directement
--   3. Résultat attendu : total_listened_seconds ≈ 0-2 (basé sur l'elapsed réel)
--   4. complete_stream_session : 2/300 = 0.67% < 90% → is_valid_listen = false ✓
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_stream_heartbeat(
  p_session_id UUID,
  p_position_seconds INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_session         record;
  v_elapsed         numeric;
  v_max_allowed     numeric;
  v_clamped         integer;
BEGIN
  -- Charger la session pour calculer le clamp anti-fraude
  SELECT last_heartbeat_at, total_listened_seconds
  INTO v_session
  FROM public.stream_sessions
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND completed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable.';
  END IF;

  -- Temps réel écoulé depuis le dernier heartbeat
  v_elapsed := EXTRACT(EPOCH FROM (now() - v_session.last_heartbeat_at));

  -- Position maximale physiquement possible : accumulé actuel + 1.5× temps réel
  -- Ratio identique à MAX_PROGRESS_SPEED_RATIO côté Edge Function Deno
  v_max_allowed := v_session.total_listened_seconds + GREATEST(v_elapsed * 1.5, 0);

  -- Clamp : refuse les sauts impossibles sans bloquer la session
  v_clamped := LEAST(GREATEST(p_position_seconds, 0), FLOOR(v_max_allowed)::integer);

  UPDATE public.stream_sessions
  SET last_heartbeat_at = now(),
      total_listened_seconds = v_clamped
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND completed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_stream_heartbeat TO authenticated;
