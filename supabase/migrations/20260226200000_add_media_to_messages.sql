-- Add media attachment columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type TEXT; -- 'image', 'document', 'audio', 'video'
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_filename TEXT;
