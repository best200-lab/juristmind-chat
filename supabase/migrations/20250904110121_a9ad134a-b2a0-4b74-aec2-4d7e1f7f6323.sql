-- Add user_data column to email_verification_codes table to store signup data temporarily
ALTER TABLE public.email_verification_codes 
ADD COLUMN user_data TEXT;