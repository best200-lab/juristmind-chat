-- Add description and location fields to lawyers table
ALTER TABLE public.lawyers 
ADD COLUMN description TEXT,
ADD COLUMN location TEXT;