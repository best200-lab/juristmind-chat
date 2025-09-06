-- Create the notifications table
CREATE TABLE public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Enable RLS on the table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get admin UID
CREATE OR REPLACE FUNCTION public.get_admin_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$ 
  SELECT id FROM auth.users WHERE email = 'ogunseun7@gmail.com' LIMIT 1;
$$;

-- Revoke execution from normal users
REVOKE EXECUTE ON FUNCTION public.get_admin_uid() FROM anon, authenticated;

-- RLS Policies
-- SELECT: everyone can read
CREATE POLICY "All users can read notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (true);

-- INSERT: only admin
CREATE POLICY "Admin can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = public.get_admin_uid());

-- DELETE: only admin
CREATE POLICY "Admin can delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = public.get_admin_uid());