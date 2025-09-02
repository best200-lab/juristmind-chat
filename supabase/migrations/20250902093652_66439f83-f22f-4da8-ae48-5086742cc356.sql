-- Add social media and website fields to lawyers table
ALTER TABLE public.lawyers ADD COLUMN social_media TEXT;
ALTER TABLE public.lawyers ADD COLUMN website TEXT;

-- Add next_adjourn_date to diary_entries table  
ALTER TABLE public.diary_entries ADD COLUMN next_adjourn_date DATE;

-- Update search-lawyers edge function to handle the new fields
-- This will be handled in the edge function update