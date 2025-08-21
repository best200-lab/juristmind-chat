-- Create judge_notes table for storing judge notes
CREATE TABLE public.judge_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  judge_name TEXT NOT NULL,
  court TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.judge_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view judge notes" 
ON public.judge_notes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create judge notes" 
ON public.judge_notes 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own judge notes" 
ON public.judge_notes 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own judge notes" 
ON public.judge_notes 
FOR DELETE 
USING (auth.uid() = author_id);

-- Add phone and user_type columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT,
ADD COLUMN user_type TEXT CHECK (user_type IN ('lawyer', 'student'));

-- Add suit_number column to diary_entries table
ALTER TABLE public.diary_entries 
ADD COLUMN suit_number TEXT;

-- Create trigger for updating updated_at on judge_notes
CREATE TRIGGER update_judge_notes_updated_at
BEFORE UPDATE ON public.judge_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Make ogunseun7@gmail.com a premium user
INSERT INTO public.user_credits (user_id, is_premium, premium_expires_at, credits_remaining)
SELECT 
  u.id, 
  true, 
  NOW() + INTERVAL '1 year', 
  999
FROM auth.users u 
WHERE u.email = 'ogunseun7@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  is_premium = true,
  premium_expires_at = NOW() + INTERVAL '1 year',
  credits_remaining = 999;