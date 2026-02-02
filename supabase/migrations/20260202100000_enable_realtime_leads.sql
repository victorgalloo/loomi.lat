-- Enable Realtime for all dashboard tables
-- This allows pages to update automatically when data changes

DO $$
DECLARE
  tables_to_add TEXT[] := ARRAY['leads', 'conversations', 'messages', 'appointments', 'clients', 'pipeline_stages'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_to_add
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
      RAISE NOTICE 'Added table % to supabase_realtime', t;
    ELSE
      RAISE NOTICE 'Table % already in supabase_realtime', t;
    END IF;
  END LOOP;
END $$;
