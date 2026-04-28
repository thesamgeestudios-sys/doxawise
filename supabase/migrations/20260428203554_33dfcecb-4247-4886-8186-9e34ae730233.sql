CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_mode text := COALESCE(NEW.raw_user_meta_data ->> 'platform_mode', 'company');
  owner_role text;
BEGIN
  IF selected_mode NOT IN ('company', 'school') THEN
    selected_mode := 'company';
  END IF;

  owner_role := CASE WHEN selected_mode = 'school' THEN 'proprietor' ELSE 'director' END;

  INSERT INTO public.profiles (
    user_id,
    business_name,
    first_name,
    last_name,
    phone,
    bvn,
    platform_mode,
    onboarding_completed
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'bvn', ''),
    selected_mode,
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    business_name = CASE WHEN public.profiles.business_name_locked THEN public.profiles.business_name ELSE EXCLUDED.business_name END,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    bvn = EXCLUDED.bvn,
    platform_mode = EXCLUDED.platform_mode,
    onboarding_completed = true,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.organization_roles (organization_user_id, user_id, platform_mode, role)
  VALUES (NEW.id, NEW.id, selected_mode, owner_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_transaction_receipt_fields_trigger ON public.transactions;
CREATE TRIGGER set_transaction_receipt_fields_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_transaction_receipt_fields();

INSERT INTO public.profiles (
  user_id,
  business_name,
  first_name,
  last_name,
  phone,
  bvn,
  platform_mode,
  onboarding_completed
)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'business_name', ''),
  COALESCE(u.raw_user_meta_data ->> 'first_name', ''),
  COALESCE(u.raw_user_meta_data ->> 'last_name', ''),
  COALESCE(u.raw_user_meta_data ->> 'phone', ''),
  COALESCE(u.raw_user_meta_data ->> 'bvn', ''),
  CASE WHEN COALESCE(u.raw_user_meta_data ->> 'platform_mode', 'company') IN ('company', 'school')
    THEN COALESCE(u.raw_user_meta_data ->> 'platform_mode', 'company')
    ELSE 'company'
  END,
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'user'::public.app_role
);

INSERT INTO public.organization_roles (organization_user_id, user_id, platform_mode, role)
SELECT
  u.id,
  u.id,
  CASE WHEN COALESCE(u.raw_user_meta_data ->> 'platform_mode', 'company') IN ('company', 'school')
    THEN COALESCE(u.raw_user_meta_data ->> 'platform_mode', 'company')
    ELSE 'company'
  END,
  CASE WHEN COALESCE(u.raw_user_meta_data ->> 'platform_mode', 'company') = 'school' THEN 'proprietor' ELSE 'director' END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_roles org
  WHERE org.organization_user_id = u.id AND org.user_id = u.id AND org.is_active = true
);