-- Create credits table to track daily user credits
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER DEFAULT 5,
  last_credit_reset DATE DEFAULT CURRENT_DATE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  case_number TEXT UNIQUE,
  client_name TEXT NOT NULL,
  case_type TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  priority TEXT DEFAULT 'Medium',
  description TEXT,
  next_hearing TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create diary entries table (premium only)
CREATE TABLE public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  entry_date DATE NOT NULL,
  entry_time TIME,
  entry_type TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL,
  salary_range TEXT,
  description TEXT NOT NULL,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT DEFAULT 'Applied',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Create marketplace products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shopping cart table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create orders table for marketplace
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  delivery_status TEXT DEFAULT 'processing',
  seller_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lawyers table
CREATE TABLE public.lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  state TEXT NOT NULL,
  city TEXT,
  specialization TEXT[] DEFAULT ARRAY[]::TEXT[],
  years_experience INTEGER DEFAULT 0,
  bar_number TEXT,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_type TEXT NOT NULL, -- 'premium', 'marketplace'
  status TEXT DEFAULT 'pending',
  paystack_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User credits policies
CREATE POLICY "Users can view their own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON public.user_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits" ON public.user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cases policies
CREATE POLICY "Users can view their own cases" ON public.cases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cases" ON public.cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases" ON public.cases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases" ON public.cases
  FOR DELETE USING (auth.uid() = user_id);

-- Diary entries policies (premium only)
CREATE POLICY "Premium users can view their own diary entries" ON public.diary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Premium users can create their own diary entries" ON public.diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Premium users can update their own diary entries" ON public.diary_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Premium users can delete their own diary entries" ON public.diary_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Everyone can view jobs" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Users can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can update their own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = posted_by);

CREATE POLICY "Users can delete their own jobs" ON public.jobs
  FOR DELETE USING (auth.uid() = posted_by);

-- Job applications policies
CREATE POLICY "Users can view applications for their jobs" ON public.job_applications
  FOR SELECT USING (
    auth.uid() = applicant_id OR 
    auth.uid() IN (SELECT posted_by FROM public.jobs WHERE id = job_id)
  );

CREATE POLICY "Users can apply for jobs" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Products policies
CREATE POLICY "Everyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Users can create products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = seller_id);

-- Cart items policies
CREATE POLICY "Users can view their own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view their orders" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Lawyers policies
CREATE POLICY "Everyone can view verified lawyers" ON public.lawyers
  FOR SELECT USING (verified = true);

CREATE POLICY "Users can create their lawyer profile" ON public.lawyers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lawyer profile" ON public.lawyers
  FOR UPDATE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_cases_user_id ON public.cases(user_id);
CREATE INDEX idx_diary_entries_user_id ON public.diary_entries(user_id);
CREATE INDEX idx_jobs_posted_by ON public.jobs(posted_by);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX idx_products_seller_id ON public.products(seller_id);
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_lawyers_state ON public.lawyers(state);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lawyers_updated_at
  BEFORE UPDATE ON public.lawyers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to reset daily credits
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    credits_remaining = CASE 
      WHEN is_premium AND premium_expires_at > now() THEN 999
      ELSE 5
    END,
    last_credit_reset = CURRENT_DATE
  WHERE last_credit_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and deduct credits
CREATE OR REPLACE FUNCTION public.use_credit(user_uuid UUID)
RETURNS boolean AS $$
DECLARE
  current_credits INTEGER;
  is_premium_user BOOLEAN;
  premium_valid BOOLEAN;
BEGIN
  -- Get current credit status
  SELECT 
    credits_remaining, 
    is_premium,
    (is_premium AND premium_expires_at > now()) as premium_valid
  INTO current_credits, is_premium_user, premium_valid
  FROM public.user_credits 
  WHERE user_id = user_uuid;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, credits_remaining)
    VALUES (user_uuid, 5);
    current_credits := 5;
    premium_valid := FALSE;
  END IF;
  
  -- Reset credits if needed
  PERFORM public.reset_daily_credits();
  
  -- Refresh credit count after reset
  SELECT credits_remaining INTO current_credits
  FROM public.user_credits 
  WHERE user_id = user_uuid;
  
  -- Check if user has credits (premium users have unlimited)
  IF premium_valid OR current_credits > 0 THEN
    -- Deduct credit only for non-premium users
    IF NOT premium_valid THEN
      UPDATE public.user_credits 
      SET credits_remaining = credits_remaining - 1
      WHERE user_id = user_uuid;
    END IF;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample lawyers
INSERT INTO public.lawyers (name, email, phone, state, city, specialization, years_experience, bar_number, verified) VALUES
('Barrister Adewale Ogundimu', 'adewale.ogundimu@example.com', '+234-801-234-5678', 'Lagos', 'Lagos', ARRAY['Corporate Law', 'Commercial Law'], 15, 'LBN/2008/001', true),
('Mrs. Folake Adebayo', 'folake.adebayo@example.com', '+234-802-345-6789', 'Lagos', 'Ikeja', ARRAY['Family Law', 'Property Law'], 12, 'LBN/2011/045', true),
('Barrister Chukwuma Nwosu', 'chukwuma.nwosu@example.com', '+234-803-456-7890', 'Anambra', 'Awka', ARRAY['Criminal Law', 'Human Rights'], 8, 'ABN/2015/023', true),
('Dr. Amina Hassan', 'amina.hassan@example.com', '+234-804-567-8901', 'Kano', 'Kano', ARRAY['Constitutional Law', 'Public Law'], 20, 'KBN/2003/012', true),
('Barrister Emeka Okechukwu', 'emeka.okechukwu@example.com', '+234-805-678-9012', 'Enugu', 'Enugu', ARRAY['Labor Law', 'Employment Law'], 10, 'EBN/2013/067', true),
('Mrs. Blessing Udoh', 'blessing.udoh@example.com', '+234-806-789-0123', 'Cross River', 'Calabar', ARRAY['Immigration Law', 'International Law'], 14, 'CBN/2009/089', true),
('Barrister Yakubu Ibrahim', 'yakubu.ibrahim@example.com', '+234-807-890-1234', 'Kaduna', 'Kaduna', ARRAY['Tax Law', 'Revenue Law'], 18, 'KDN/2005/034', true),
('Mrs. Funmi Adeleke', 'funmi.adeleke@example.com', '+234-808-901-2345', 'Oyo', 'Ibadan', ARRAY['Intellectual Property', 'Technology Law'], 7, 'OBN/2016/156', true),
('Barrister Daniel Okafor', 'daniel.okafor@example.com', '+234-809-012-3456', 'Rivers', 'Port Harcourt', ARRAY['Oil and Gas Law', 'Environmental Law'], 16, 'RBN/2007/078', true),
('Dr. Kemi Adeyemi', 'kemi.adeyemi@example.com', '+234-810-123-4567', 'Ogun', 'Abeokuta', ARRAY['Medical Law', 'Healthcare Law'], 11, 'OGN/2012/234', true);