
-- Enable realtime for the meeting_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_participants;
ALTER TABLE meeting_participants REPLICA IDENTITY FULL;

-- Add function to enable realtime for specific tables
CREATE OR REPLACE FUNCTION public.enable_realtime(table_name text)
RETURNS void AS $$
DECLARE
  statement text;
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
    RAISE EXCEPTION 'Table % does not exist', table_name;
  END IF;
  
  -- Add table to supabase_realtime publication
  statement := FORMAT('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
  EXECUTE statement;
  
  -- Set replica identity to full
  statement := FORMAT('ALTER TABLE %I REPLICA IDENTITY FULL', table_name);
  EXECUTE statement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
