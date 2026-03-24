-- Layout settings table for admin-controlled section post counts
CREATE TABLE public.layout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  section_label text NOT NULL,
  post_count int NOT NULL DEFAULT 5,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.layout_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read layout settings
CREATE POLICY "Anyone can read layout_settings" ON public.layout_settings FOR SELECT USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage layout_settings" ON public.layout_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default sections
INSERT INTO public.layout_settings (section_key, section_label, post_count, sort_order) VALUES
  ('national', 'জাতীয় সংবাদ', 6, 1),
  ('international', 'আন্তর্জাতিক', 4, 2),
  ('politics', 'রাজনীতি', 4, 3),
  ('technology', 'প্রযুক্তি', 3, 4),
  ('featured', 'ফিচার্ড স্লাইডার', 8, 5),
  ('highlighted', 'হাইলাইটস', 4, 6),
  ('barisal', 'বরিশাল বিভাগ', 6, 7),
  ('sports', 'খেলাধুলা', 4, 8),
  ('entertainment', 'বিনোদন', 4, 9),
  ('dhaka', 'ঢাকা বিভাগ', 3, 10),
  ('chattogram', 'চট্টগ্রাম বিভাগ', 3, 11),
  ('sylhet', 'সিলেট বিভাগ', 3, 12),
  ('rajshahi', 'রাজশাহী বিভাগ', 3, 13),
  ('khulna', 'খুলনা বিভাগ', 3, 14),
  ('rangpur', 'রংপুর বিভাগ', 3, 15),
  ('mymensingh', 'ময়মনসিংহ বিভাগ', 3, 16),
  ('popular', 'জনপ্রিয় সংবাদ', 8, 17);