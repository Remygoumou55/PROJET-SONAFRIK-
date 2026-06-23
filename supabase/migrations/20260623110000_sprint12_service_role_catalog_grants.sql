-- Sprint 1.2 — GRANTs service_role pour Edge Functions catalogue
-- ---------------------------------------------------------------------------
-- catalog-asset-signed-url utilise service_role dans persistAsset() pour :
--   • albums.cover_path (UPDATE)
--   • track_files (INSERT / UPDATE is_primary)
-- Sans ces GRANTs : "permission denied for table albums|track_files"
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE ON public.albums TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.tracks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.track_files TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.artist_profiles TO service_role;
GRANT SELECT, UPDATE ON public.profiles TO service_role;
