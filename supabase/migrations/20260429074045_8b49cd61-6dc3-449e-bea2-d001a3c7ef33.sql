CREATE OR REPLACE FUNCTION public.ensure_user_onboarding_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  metadata jsonb := COALESCE(auth.jwt() -> 'user_metadata', '{}'::jsonb);
  selected_mode text := COALESCE(metadata ->> 'platform_mode', 'company');
  owner_role text;
  profile_row public.profiles;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

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
    current_user_id,
    COALESCE(metadata ->> 'business_name', ''),
    COALESCE(metadata ->> 'first_name', ''),
    COALESCE(metadata ->> 'last_name', ''),
    COALESCE(metadata ->> 'phone', ''),
    COALESCE(metadata ->> 'bvn', ''),
    selected_mode,
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    business_name = CASE WHEN public.profiles.business_name_locked THEN public.profiles.business_name ELSE COALESCE(NULLIF(EXCLUDED.business_name, ''), public.profiles.business_name) END,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    bvn = COALESCE(NULLIF(EXCLUDED.bvn, ''), public.profiles.bvn),
    platform_mode = selected_mode,
    onboarding_completed = true,
    updated_at = now()
  RETURNING * INTO profile_row;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.organization_roles (organization_user_id, user_id, platform_mode, role)
  VALUES (current_user_id, current_user_id, selected_mode, owner_role)
  ON CONFLICT DO NOTHING;

  UPDATE public.organization_roles
  SET platform_mode = selected_mode,
      role = CASE WHEN user_id = current_user_id AND organization_user_id = current_user_id THEN owner_role ELSE role END,
      updated_at = now()
  WHERE user_id = current_user_id
    AND organization_user_id = current_user_id;

  RETURN profile_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_onboarding_profile() TO authenticated;