-- Founder admin — comptes Rémy Goumou actifs (Live Control MVP)
BEGIN;

SELECT public.assign_admin_role('36dac3f8-c58e-4a95-a93a-521f70109b35'::uuid); -- remygoumou55@gmail.com
SELECT public.assign_admin_role('6c24f563-f325-405e-9c14-58eeff18248a'::uuid); -- +2230546508020
SELECT public.assign_admin_role('1d6a93f2-48ed-4532-9779-e78c564887dd'::uuid); -- REMY (session courante)

COMMIT;
