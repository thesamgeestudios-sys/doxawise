-- CMS Pages: stores all editable content blocks for each page
CREATE TABLE public.cms_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name text NOT NULL,
  section_name text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  content_text text DEFAULT '',
  content_image_url text DEFAULT '',
  content_link text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view CMS content" ON public.cms_pages FOR SELECT USING (true);
CREATE POLICY "Admins can insert CMS content" ON public.cms_pages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update CMS content" ON public.cms_pages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete CMS content" ON public.cms_pages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_cms_pages_page ON public.cms_pages(page_name, display_order);

-- CMS Settings: global site config
CREATE TABLE public.cms_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text DEFAULT '',
  setting_type text NOT NULL DEFAULT 'text',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.cms_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.cms_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings" ON public.cms_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete settings" ON public.cms_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_settings_updated_at BEFORE UPDATE ON public.cms_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default homepage sections
INSERT INTO public.cms_pages (page_name, section_name, content_type, content_text, display_order, metadata) VALUES
('home', 'hero_title', 'text', 'Smart Payment Processing for Nigerian Businesses', 1, '{}'),
('home', 'hero_subtitle', 'text', 'Automate salary disbursement, create virtual cards, send international payments, and manage your workforce payroll — all from one secure platform.', 2, '{}'),
('home', 'hero_badge', 'text', 'Nigeria''s Smart Payment Platform', 3, '{}'),
('home', 'stats_1_value', 'text', '₦2B+', 4, '{"label": "Processed"}'),
('home', 'stats_2_value', 'text', '5,000+', 5, '{"label": "Businesses"}'),
('home', 'stats_3_value', 'text', '99.9%', 6, '{"label": "Uptime"}'),
('home', 'stats_4_value', 'text', '<3s', 7, '{"label": "Transfer Speed"}'),
('home', 'cta_title', 'text', 'Ready to streamline your payroll?', 8, '{}'),
('home', 'cta_subtitle', 'text', 'Join businesses across Nigeria using Doxawise for automated, secure batch payment processing.', 9, '{}'),
('home', 'footer_text', 'text', 'Smart payment processing platform for Nigerian businesses. We never hold your funds.', 10, '{}');