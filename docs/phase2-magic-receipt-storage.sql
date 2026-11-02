-- ==============================================================================
-- FINORA MOBILE APP - PHASE 2 MAGIC RECEIPT & CLOUD STORAGE MIGRATION
-- Target: Supabase PostgreSQL & Storage (ophepwhbraswwuizyssv)
-- Includes:
--   1. Audit columns on public.scan_results (kategori_extracted, metode_extracted, processing_time_ms)
--   2. Supabase Storage Buckets:
--      - 'receipts' (Private, <= 5 MB, JPEG/PNG only per SRS ER-1.1)
--      - 'avatars'  (Public read, <= 5 MB, JPEG/PNG/WebP)
--   3. Complete RLS Policies on storage.objects (SELECT + INSERT + UPDATE + DELETE per user folder)
-- ==============================================================================

BEGIN;

-- 1. ENHANCE SCAN_RESULTS FOR AI ORCHESTRATION AUDIT & LATENCY BENCHMARKING
ALTER TABLE public.scan_results
  ADD COLUMN IF NOT EXISTS kategori_extracted VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metode_extracted VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS processing_time_ms INT DEFAULT NULL;

-- 2. PROVISION SUPABASE STORAGE BUCKETS IDEMPOTENTLY
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('receipts', 'receipts', false, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. STORAGE OBJECTS RLS POLICIES (PRIVATE RECEIPTS BUCKET)
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;

CREATE POLICY "Users can view own receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "Users can upload own receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "Users can update own receipts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "Users can delete own receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 4. STORAGE OBJECTS RLS POLICIES (AVATARS BUCKET)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
