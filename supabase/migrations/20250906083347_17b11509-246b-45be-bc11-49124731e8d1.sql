-- Add case_suit_number column to judge_notes table
ALTER TABLE public.judge_notes 
ADD COLUMN case_suit_number TEXT;