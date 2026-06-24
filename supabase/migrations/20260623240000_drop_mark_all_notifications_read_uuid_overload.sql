-- Vague A++ — supprime la surcharge ambiguë mark_all_notifications_read(uuid)

DROP FUNCTION IF EXISTS public.mark_all_notifications_read(UUID);

REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
