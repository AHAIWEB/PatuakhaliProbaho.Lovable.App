
-- Enable realtime for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
