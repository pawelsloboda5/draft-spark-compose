
-- Add the 'favorited' column to generated_posts
ALTER TABLE public.generated_posts
ADD COLUMN favorited boolean NOT NULL DEFAULT false;
