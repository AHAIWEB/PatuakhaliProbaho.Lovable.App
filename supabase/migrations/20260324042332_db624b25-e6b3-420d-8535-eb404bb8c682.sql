
-- App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'reporter');

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User roles table (must exist before has_role function)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Roles viewable by self or admins" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Roles insertable by admins" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Roles updatable by admins" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Roles deletable by admins" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories readable by all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories manageable by admins" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RSS Feeds table
CREATE TABLE public.rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  division TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSS feeds readable by all" ON public.rss_feeds FOR SELECT USING (true);
CREATE POLICY "RSS feeds insertable by admins" ON public.rss_feeds FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "RSS feeds updatable by admins" ON public.rss_feeds FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "RSS feeds deletable by admins" ON public.rss_feeds FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  image_url TEXT,
  source_url TEXT,
  source_name TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_highlighted BOOLEAN DEFAULT false,
  highlight_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rss_feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE SET NULL,
  division TEXT,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts readable by all" ON public.posts FOR SELECT
  USING (status = 'published' OR (auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR author_id = auth.uid())));
CREATE POLICY "Posts insertable by staff" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'reporter'));
CREATE POLICY "Posts updatable by staff" ON public.posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR author_id = auth.uid());
CREATE POLICY "Posts deletable by admins" ON public.posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_posts_category ON public.posts(category_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_featured ON public.posts(is_featured) WHERE is_featured = true;
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX idx_posts_division ON public.posts(division);

-- Ad spaces table
CREATE TABLE public.ad_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('header','sidebar','banner','leaderboard','footer')),
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ad_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ads readable by all" ON public.ad_spaces FOR SELECT USING (true);
CREATE POLICY "Ads insertable by admins" ON public.ad_spaces FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ads updatable by admins" ON public.ad_spaces FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Ads deletable by admins" ON public.ad_spaces FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Default categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('জাতীয়', 'national', 1),
  ('রাজনীতি', 'politics', 2),
  ('বিশ্ব', 'world', 3),
  ('আলোচিত', 'trending', 4),
  ('শিক্ষা', 'education', 5),
  ('ধর্ম', 'religion', 6),
  ('অর্থনীতি', 'economy', 7),
  ('বিনোদন', 'entertainment', 8),
  ('খেলা', 'sports', 9),
  ('লাইফস্টাইল', 'lifestyle', 10),
  ('ভ্রমন', 'travel', 11),
  ('বরিশাল', 'barisal', 20),
  ('ঢাকা', 'dhaka', 21),
  ('চট্টগ্রাম', 'chattogram', 22),
  ('সিলেট', 'sylhet', 23),
  ('রাজশাহী', 'rajshahi', 24),
  ('রংপুর', 'rangpur', 25),
  ('খুলনা', 'khulna', 26),
  ('ময়মনসিংহ', 'mymensingh', 27);

INSERT INTO public.categories (name, slug, parent_id, sort_order)
SELECT sub.name, sub.slug, c.id, sub.sort_order
FROM public.categories c,
(VALUES ('হলিউড','hollywood',1),('বলিউড','bollywood',2),('টলিউড','tollywood',3),('ঢালিউড','dhallywood',4),('মিডিয়া','media',5)) AS sub(name, slug, sort_order)
WHERE c.slug = 'entertainment';

INSERT INTO public.categories (name, slug, parent_id, sort_order)
SELECT sub.name, sub.slug, c.id, sub.sort_order
FROM public.categories c,
(VALUES ('জীবনযাপন','living',1),('নারী','women',2),('ফ্যাশন','fashion',3),('শরীর','body',4),('রান্না-বান্না','cooking',5),('শখ','hobby',6),('স্বাস্থ্যসেবা','healthcare',7)) AS sub(name, slug, sort_order)
WHERE c.slug = 'lifestyle';
