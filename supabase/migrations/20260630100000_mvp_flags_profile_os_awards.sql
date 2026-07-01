-- MVP flags : Profile OS + admin Awards gelés par défaut
BEGIN;

INSERT INTO public.feature_flags (name, enabled, description) VALUES
  ('profile_os', false, 'Profile OS (Goals, Rewards, DNA, Journey, Story) — post-MVP'),
  ('awards_admin', false, 'Module admin Awards — post-MVP'),
  ('beat_store_admin', false, 'Module admin Beat Store — post-MVP (beat_store listener déjà OFF)')
ON CONFLICT (name) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description,
  updated_at = now()
WHERE public.feature_flags.enabled IS DISTINCT FROM EXCLUDED.enabled;

COMMIT;
