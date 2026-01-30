-- Add auth_email column to clients table for linking Supabase Auth users
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS auth_email TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_auth_email ON clients(auth_email);

-- Drop existing policies (will recreate them with proper access control)
DROP POLICY IF EXISTS "Authenticated users can select clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

-- Helper function to check if user is admin (users not linked to a client)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- If user's email is not linked to any client, they are an admin
  RETURN NOT EXISTS (
    SELECT 1 FROM clients WHERE auth_email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get client id for current user
CREATE OR REPLACE FUNCTION get_client_id_for_user()
RETURNS UUID AS $$
DECLARE
  client_id UUID;
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Get client id if user is linked to a client
  SELECT id INTO client_id FROM clients WHERE auth_email = user_email LIMIT 1;
  
  RETURN client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT policy: Admins can read all clients, clients can only read their own
CREATE POLICY "Admins can select all clients, clients can select own"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    is_admin_user() OR
    id = get_client_id_for_user()
  );

-- INSERT policy: Only admins can create clients
CREATE POLICY "Only admins can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_user()
  );

-- UPDATE policy: Admins can update all clients, clients cannot update
CREATE POLICY "Only admins can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    is_admin_user()
  )
  WITH CHECK (
    is_admin_user()
  );

-- DELETE policy: Only admins can delete clients
CREATE POLICY "Only admins can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    is_admin_user()
  );

-- Update storage policies for client documents
-- Clients can only read files from their own client folder
DROP POLICY IF EXISTS "Authenticated users can read client documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update client documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete client documents" ON storage.objects;

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

