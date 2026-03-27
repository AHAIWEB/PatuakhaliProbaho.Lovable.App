
-- Create site_assets storage bucket for logo uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users with admin role to upload
CREATE POLICY "Admins can upload site assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to update/delete
CREATE POLICY "Admins can update site assets" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-assets' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete site assets" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'site-assets' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow public read access
CREATE POLICY "Public can read site assets" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'site-assets');

-- Create site_settings table for storing logo URL etc.
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings" ON public.site_settings
FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
