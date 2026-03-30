
-- Fix profiles: restrict SELECT to authenticated users only (protects phone PII)
DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Fix scrape_sources: restrict SELECT to authenticated admin/editor only
DROP POLICY IF EXISTS "Scrape sources readable by all" ON public.scrape_sources;
CREATE POLICY "Scrape sources readable by admins" ON public.scrape_sources
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
