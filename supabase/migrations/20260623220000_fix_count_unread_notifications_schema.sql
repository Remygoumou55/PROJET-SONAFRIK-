-- Vague A++ — count_unread_notifications alignée sur le schéma réel (pas de deleted_at)

CREATE OR REPLACE FUNCTION public.count_unread_notifications()
RETURNS INTEGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  RETURN (
    SELECT count(*)::INTEGER
    FROM public.notifications
    WHERE user_id = auth.uid()
      AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.count_unread_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_unread_notifications() TO authenticated;
