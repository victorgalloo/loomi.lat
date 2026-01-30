-- Improve security: Make storage bucket private
-- Note: This migration updates the bucket to be private while maintaining authenticated access through RLS policies

UPDATE storage.buckets
SET public = false
WHERE id = 'client-documents';

-- Verify no anonymous policies exist (these should already be removed, but adding explicit check)
-- Drop any potential anonymous policies (if they exist)
DROP POLICY IF EXISTS "Anonymous users can read client documents" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update client documents" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete client documents" ON storage.objects;

-- Verify authenticated-only policies exist (these should already be in place)
-- Re-create them if needed for clarity (they should already exist from previous migration)
DO $$
BEGIN
  -- Check if SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can read client documents'
  ) THEN
    CREATE POLICY "Authenticated users can read client documents"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'client-documents');
  END IF;

  -- Check if INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload client documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload client documents"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'client-documents');
  END IF;

  -- Check if UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update client documents'
  ) THEN
    CREATE POLICY "Authenticated users can update client documents"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'client-documents')
      WITH CHECK (bucket_id = 'client-documents');
  END IF;

  -- Check if DELETE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete client documents'
  ) THEN
    CREATE POLICY "Authenticated users can delete client documents"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'client-documents');
  END IF;
END $$;

