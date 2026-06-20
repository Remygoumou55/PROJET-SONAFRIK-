-- Fix: handle_new_user + handle_new_user_preferences rendus résilients
-- Cause racine : log_audit_event (REVOKE ALL FROM PUBLIC) bloquait le signup Google OAuth
-- si handle_new_user ne tournait pas comme superuser → exception → rollback → "Database error saving new user"
-- Exécuté manuellement dans Supabase SQL Editor le 2026-06-18

-- Grant explicite à postgres pour garantir l'appel depuis le trigger SECURITY DEFINER
GRANT EXECUTE ON FUNCTION public.log_audit_event TO postgres;

-- handle_new_user : ON CONFLICT idempotent + capture full_name Google + audit dans exception handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, email, full_name, created_by, updated_by)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    NEW.id,
    NEW.id
  )
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    PERFORM public.log_audit_event(
      NEW.id,
      'auth.user.created',
      'profiles',
      NEW.id,
      jsonb_build_object('phone', NEW.phone, 'email', NEW.email)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- handle_new_user_preferences : notification bienvenue dans exception handler
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, updated_by)
  VALUES (NEW.id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  BEGIN
    INSERT INTO public.notifications (user_id, category, title, body, priority)
    VALUES (
      NEW.id,
      'system',
      'Bienvenue sur SONAFRIK',
      'NOTRE BIEN COMMUN — Personnalisez votre profil dans les paramètres.',
      'normal'
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
