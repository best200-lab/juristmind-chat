-- Fix RLS policy for lawyer registration from edge functions
-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can create their lawyer profile" ON public.lawyers;

-- Create a new policy that allows both authenticated users and service role to insert
CREATE POLICY "Users can register as lawyers" 
ON public.lawyers 
FOR INSERT 
WITH CHECK (
  -- Allow if user_id matches the authenticated user (for direct inserts)
  (auth.uid() = user_id) 
  OR 
  -- Allow service role (for edge function inserts)
  (auth.role() = 'service_role')
);