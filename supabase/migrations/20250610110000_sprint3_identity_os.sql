-- Sprint 3 — Identity OS complet
-- Profils étendus · Préférences · Notifications · Storage avatars

-- ---------------------------------------------------------------------------
-- Extension profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Conakry',
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'GN',
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500);

CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- user_preferences — 1:1 avec profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  audio_quality TEXT NOT NULL DEFAULT 'auto' CHECK (audio_quality IN ('64', '128', '256', 'auto')),
  data_saver BOOLEAN NOT NULL DEFAULT false,
  autoplay_on_wifi BOOLEAN NOT NULL DEFAULT true,
  autoplay_on_cellular BOOLEAN NOT NULL DEFAULT false,
  explicit_content_allowed BOOLEAN NOT NULL DEFAULT true,
  profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
  show_listening_activity BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  marketing_notifications BOOLEAN NOT NULL DEFAULT false,
  awards_reminders BOOLEAN NOT NULL DEFAULT true,
  new_releases_alerts BOOLEAN NOT NULL DEFAULT true,
  artist_comment_replies BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'Africa/Conakry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notifications — in-app (Identity OS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('system', 'social', 'artist', 'billing', 'security')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Auto-création préférences + notification bienvenue
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, updated_by)
  VALUES (NEW.id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notifications (user_id, category, title, body, priority)
  VALUES (
    NEW.id,
    'system',
    'Bienvenue sur SONAFRIK',
    'NOTRE BIEN COMMUN — Personnalisez votre profil dans les paramètres.',
    'normal'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_created_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- Backfill preferences pour profils Sprint 2 existants
INSERT INTO public.user_preferences (user_id, updated_by)
SELECT id, id FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_preferences up WHERE up.user_id = p.id);

-- ---------------------------------------------------------------------------
-- RPC notifications
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND read_at IS NULL
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification introuvable ou déjà lue.';
  END IF;

  PERFORM public.log_audit_event_authenticated(
    'identity.notification.read',
    'notifications',
    p_notification_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.mark_notification_read TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE user_id = auth.uid()
    AND read_at IS NULL
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  PERFORM public.log_audit_event_authenticated(
    'identity.notifications.read_all',
    'notifications',
    auth.uid(),
    jsonb_build_object('count', v_count)
  );

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket avatars (privé — URLs signées côté serveur)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
