
CREATE TABLE public.scrape_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  name text NOT NULL,
  selector_config jsonb DEFAULT '{}'::jsonb,
  division text,
  district text,
  upazila text,
  category text DEFAULT 'general',
  source_category text,
  is_active boolean DEFAULT true,
  scrape_interval_minutes integer DEFAULT 30,
  last_scraped_at timestamptz,
  last_error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.scrape_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scrape sources readable by all" ON public.scrape_sources FOR SELECT TO public USING (true);
CREATE POLICY "Scrape sources insertable by admins" ON public.scrape_sources FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Scrape sources updatable by admins" ON public.scrape_sources FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Scrape sources deletable by admins" ON public.scrape_sources FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
