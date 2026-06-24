-- Vague A++ — supprime la surcharge ambiguë count_unread_notifications(uuid)
-- PostgREST ne peut pas choisir entre () et (uuid) sans argument explicite.

DROP FUNCTION IF EXISTS public.count_unread_notifications(UUID);

REVOKE ALL ON FUNCTION public.count_unread_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_unread_notifications() TO authenticated;
