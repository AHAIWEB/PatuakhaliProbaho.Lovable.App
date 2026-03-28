
-- Create a trigger function that calls social-post edge function when post is published
CREATE OR REPLACE FUNCTION public.notify_social_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  _url text;
  _anon_key text;
  _post_url text;
BEGIN
  -- Only fire when status becomes 'published' (new insert or update)
  IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published')) THEN
    
    _url := 'https://kzkkudjqtufajfqgkttf.supabase.co/functions/v1/social-post';
    _anon_key := current_setting('app.settings.service_role_key', true);
    _post_url := COALESCE(NEW.source_url, 'https://patuakhaliprobaho.lovable.app/post/' || NEW.slug);
    
    PERFORM extensions.http_post(
      url := _url,
      body := json_build_object(
        'title', NEW.title,
        'url', _post_url,
        'image_url', NEW.image_url,
        'platforms', ARRAY['telegram', 'facebook']
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _anon_key
      )::jsonb
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block post creation if social posting fails
  RETURN NEW;
END;
$$;

-- Create trigger on posts table
DROP TRIGGER IF EXISTS trg_social_post_on_publish ON public.posts;
CREATE TRIGGER trg_social_post_on_publish
  AFTER INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_social_on_publish();
