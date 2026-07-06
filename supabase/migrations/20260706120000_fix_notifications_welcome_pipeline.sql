-- Fix pipeline notifications : trigger aligné schéma type/data + backfill profils existants
BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, updated_by)
  VALUES (NEW.id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.id,
      'system'::public.notification_type,
      'Bienvenue sur SONAFRIK',
      'NOTRE BIEN COMMUN — Personnalisez votre profil dans les paramètres.',
      jsonb_build_object('source', 'welcome', 'priority', 'normal')
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill : profils sans aucune notification (trigger cassé avant migration)
INSERT INTO public.notifications (user_id, type, title, body, data)
SELECT
  p.id,
  'system'::public.notification_type,
  'Bienvenue sur SONAFRIK',
  'NOTRE BIEN COMMUN — Personnalisez votre profil dans les paramètres.',
  jsonb_build_object('source', 'welcome_backfill', 'priority', 'normal')
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n WHERE n.user_id = p.id
);

COMMIT;
