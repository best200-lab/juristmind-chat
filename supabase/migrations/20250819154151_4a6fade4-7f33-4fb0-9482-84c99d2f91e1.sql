-- Fix search_path security issues for functions
ALTER FUNCTION public.reset_daily_credits() SET search_path = '';
ALTER FUNCTION public.use_credit(UUID) SET search_path = '';