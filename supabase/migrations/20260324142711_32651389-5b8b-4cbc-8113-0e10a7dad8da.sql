ALTER TABLE public.rss_feeds
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS upazila text,
ADD COLUMN IF NOT EXISTS source_category text;

CREATE INDEX IF NOT EXISTS idx_rss_feeds_division_district_upazila
ON public.rss_feeds (division, district, upazila);

CREATE INDEX IF NOT EXISTS idx_rss_feeds_source_category
ON public.rss_feeds (source_category);

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS upazila text,
ADD COLUMN IF NOT EXISTS source_category text;

CREATE INDEX IF NOT EXISTS idx_posts_division_district_upazila
ON public.posts (division, district, upazila);

CREATE INDEX IF NOT EXISTS idx_posts_source_category
ON public.posts (source_category);

CREATE INDEX IF NOT EXISTS idx_posts_published_at_desc
ON public.posts (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_parent_sort_order
ON public.categories (parent_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_categories_sort_order
ON public.categories (sort_order);