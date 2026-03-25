ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'business';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flutterwave_customer_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name_locked boolean NOT NULL DEFAULT false;