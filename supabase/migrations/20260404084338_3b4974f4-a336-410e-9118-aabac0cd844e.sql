-- Create virtual_cards table
CREATE TABLE public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id TEXT NOT NULL,
  card_pan TEXT DEFAULT '',
  masked_pan TEXT DEFAULT '',
  cvv TEXT DEFAULT '',
  expiration TEXT DEFAULT '',
  card_type TEXT DEFAULT 'virtual',
  name_on_card TEXT DEFAULT '',
  currency TEXT DEFAULT 'NGN',
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  flutterwave_ref TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own virtual cards"
ON public.virtual_cards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own virtual cards"
ON public.virtual_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own virtual cards"
ON public.virtual_cards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all virtual cards"
ON public.virtual_cards FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete virtual cards"
ON public.virtual_cards FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage virtual cards"
ON public.virtual_cards FOR ALL
USING (true)
WITH CHECK (true);

-- Add delete policies for admin cleanup
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scheduled payments"
ON public.scheduled_payments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete transactions"
ON public.transactions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tokenized cards"
ON public.tokenized_cards FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_virtual_cards_updated_at
BEFORE UPDATE ON public.virtual_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();