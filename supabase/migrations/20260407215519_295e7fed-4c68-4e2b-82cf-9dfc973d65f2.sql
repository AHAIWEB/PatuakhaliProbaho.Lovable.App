
-- Archived articles table
CREATE TABLE public.archived_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  content TEXT,
  html_content TEXT,
  author TEXT,
  category TEXT,
  featured_image TEXT,
  published_date TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.archived_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Archived articles readable by all"
  ON public.archived_articles FOR SELECT
  TO public USING (true);

CREATE POLICY "Archived articles manageable by admins"
  ON public.archived_articles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_archived_articles_category ON public.archived_articles(category);
CREATE INDEX idx_archived_articles_scraped_at ON public.archived_articles(scraped_at DESC);

-- Scrape schedules table
CREATE TABLE public.scrape_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  interval TEXT DEFAULT '24h',
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scrape_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedules readable by admins"
  ON public.scrape_schedules FOR SELECT
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Schedules manageable by admins"
  ON public.scrape_schedules FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_archived_articles_updated_at
  BEFORE UPDATE ON public.archived_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scrape_schedules_updated_at
  BEFORE UPDATE ON public.scrape_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
