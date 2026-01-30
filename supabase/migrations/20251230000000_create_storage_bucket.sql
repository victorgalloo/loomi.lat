-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents',
  'client-documents',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/html'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read all client documents, clients can read own" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update client documents" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete client documents" ON storage.objects;

-- SELECT policy: Admins can read all, clients can only read their own client's files
CREATE POLICY "Admins can read all client documents, clients can read own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents' AND (
      is_admin_user() OR
      (storage.foldername(name))[1] = get_client_id_for_user()::TEXT
    )
  );

-- INSERT policy: Only admins can upload files
CREATE POLICY "Only admins can upload client documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents' AND
    is_admin_user()
  );

-- UPDATE policy: Only admins can update files
CREATE POLICY "Only admins can update client documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'client-documents' AND
    is_admin_user()
  )
  WITH CHECK (
    bucket_id = 'client-documents' AND
    is_admin_user()
  );

-- DELETE policy: Only admins can delete files
CREATE POLICY "Only admins can delete client documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-documents' AND
    is_admin_user()
  );


