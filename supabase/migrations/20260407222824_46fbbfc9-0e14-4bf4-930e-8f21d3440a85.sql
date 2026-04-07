
-- Add position and is_protected columns
ALTER TABLE public.layout_settings 
  ADD COLUMN IF NOT EXISTS position text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS is_protected boolean NOT NULL DEFAULT false;

-- Update existing sections with correct positions
UPDATE public.layout_settings SET position = 'left' WHERE section_key IN ('national', 'international', 'politics', 'technology');
UPDATE public.layout_settings SET position = 'right' WHERE section_key IN ('popular', 'dhaka', 'chattogram', 'sylhet', 'rajshahi', 'khulna', 'rangpur', 'mymensingh');
UPDATE public.layout_settings SET position = 'center' WHERE section_key NOT IN ('national', 'international', 'politics', 'technology', 'popular', 'dhaka', 'chattogram', 'sylhet', 'rajshahi', 'khulna', 'rangpur', 'mymensingh');

-- Protect core sections from accidental deletion
UPDATE public.layout_settings SET is_protected = true WHERE section_key IN ('national', 'popular', 'highlighted', 'barisal');
