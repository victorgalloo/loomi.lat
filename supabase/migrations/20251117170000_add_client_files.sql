-- Add files column to clients table to store JSON array of file metadata
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;

