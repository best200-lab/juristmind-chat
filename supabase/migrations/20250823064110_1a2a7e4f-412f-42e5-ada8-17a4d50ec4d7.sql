-- Create function to increment job applications count
CREATE OR REPLACE FUNCTION public.increment_application_count(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.jobs 
  SET applications_count = applications_count + 1
  WHERE id = job_id;
END;
$$;

-- Add file_url column to products table for marketplace uploads
ALTER TABLE public.products 
ADD COLUMN file_url text;

-- Add phone and user_type to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone text,
ADD COLUMN user_type text;