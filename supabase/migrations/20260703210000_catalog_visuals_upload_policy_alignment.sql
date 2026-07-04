-- Phase 2.4 — Alignement bucket catalog-visuals sur Upload Policy IMAGE (10 Mo)
BEGIN;

UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'catalog-visuals';

COMMIT;
