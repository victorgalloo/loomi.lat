-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  notes TEXT
);

-- Enable Row Level Security on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
-- SELECT policy: authenticated users can read all clients
CREATE POLICY "Authenticated users can select clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policy: authenticated users can create clients
CREATE POLICY "Authenticated users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE policy: authenticated users can update all clients
CREATE POLICY "Authenticated users can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE policy: authenticated users can delete clients
CREATE POLICY "Authenticated users can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents',
  'client-documents',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for client-documents bucket
-- SELECT policy: authenticated users can read files
CREATE POLICY "Authenticated users can read client documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'client-documents');

-- INSERT policy: authenticated users can upload files
CREATE POLICY "Authenticated users can upload client documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'client-documents');

-- UPDATE policy: authenticated users can update files
CREATE POLICY "Authenticated users can update client documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'client-documents')
  WITH CHECK (bucket_id = 'client-documents');

-- DELETE policy: authenticated users can delete files
CREATE POLICY "Authenticated users can delete client documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'client-documents');

