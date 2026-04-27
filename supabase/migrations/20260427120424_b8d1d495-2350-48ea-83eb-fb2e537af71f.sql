ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_mode text NOT NULL DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_platform_mode_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_platform_mode_check CHECK (platform_mode IN ('company', 'school'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.platform_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_creators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_creator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_creators pc
    JOIN public.profiles p ON p.user_id = _user_id
    WHERE pc.email = (SELECT email FROM auth.users WHERE id = _user_id)
  ) OR public.has_role(_user_id, 'admin'::public.app_role)
$$;

DROP POLICY IF EXISTS "Creators can view creator records" ON public.platform_creators;
CREATE POLICY "Creators can view creator records" ON public.platform_creators FOR SELECT TO authenticated
USING (public.is_platform_creator(auth.uid()));

CREATE TABLE IF NOT EXISTS public.organization_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id uuid NOT NULL,
  user_id uuid NOT NULL,
  platform_mode text NOT NULL DEFAULT 'company',
  role text NOT NULL,
  department text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (organization_user_id, user_id, role)
);

ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _organization_user_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_roles
    WHERE user_id = _user_id
      AND organization_user_id = _organization_user_id
      AND role = ANY(_roles)
      AND is_active = true
  ) OR public.is_platform_creator(_user_id)
$$;

DROP POLICY IF EXISTS "Users can view their organisation roles" ON public.organization_roles;
CREATE POLICY "Users can view their organisation roles" ON public.organization_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR organization_user_id = auth.uid() OR public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor']));
DROP POLICY IF EXISTS "Directors can create organisation roles" ON public.organization_roles;
CREATE POLICY "Directors can create organisation roles" ON public.organization_roles FOR INSERT TO authenticated
WITH CHECK (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor']));
DROP POLICY IF EXISTS "Directors can update organisation roles" ON public.organization_roles;
CREATE POLICY "Directors can update organisation roles" ON public.organization_roles FOR UPDATE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor']));
DROP POLICY IF EXISTS "Directors can delete organisation roles" ON public.organization_roles;
CREATE POLICY "Directors can delete organisation roles" ON public.organization_roles FOR DELETE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor']));

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS department text DEFAULT '',
  ADD COLUMN IF NOT EXISTS job_title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS staff_role text DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS employment_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

DROP POLICY IF EXISTS "HR managers can view organisation staff" ON public.staff;
CREATE POLICY "HR managers can view organisation staff" ON public.staff FOR SELECT TO authenticated
USING (public.has_org_role(auth.uid(), user_id, ARRAY['director','proprietor','hr_manager']));
DROP POLICY IF EXISTS "HR managers can create organisation staff" ON public.staff;
CREATE POLICY "HR managers can create organisation staff" ON public.staff FOR INSERT TO authenticated
WITH CHECK (public.has_org_role(auth.uid(), user_id, ARRAY['director','proprietor','hr_manager']));
DROP POLICY IF EXISTS "HR managers can update organisation staff" ON public.staff;
CREATE POLICY "HR managers can update organisation staff" ON public.staff FOR UPDATE TO authenticated
USING (public.has_org_role(auth.uid(), user_id, ARRAY['director','proprietor','hr_manager']));
DROP POLICY IF EXISTS "HR managers can delete organisation staff" ON public.staff;
CREATE POLICY "HR managers can delete organisation staff" ON public.staff FOR DELETE TO authenticated
USING (public.has_org_role(auth.uid(), user_id, ARRAY['director','proprietor','hr_manager']));

CREATE TABLE IF NOT EXISTS public.hr_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organisation members can view announcements" ON public.hr_announcements;
CREATE POLICY "Organisation members can view announcements" ON public.hr_announcements FOR SELECT TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager','secretary_bursar','teacher','staff']));
DROP POLICY IF EXISTS "HR can create announcements" ON public.hr_announcements;
CREATE POLICY "HR can create announcements" ON public.hr_announcements FOR INSERT TO authenticated
WITH CHECK (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));
DROP POLICY IF EXISTS "HR can update announcements" ON public.hr_announcements;
CREATE POLICY "HR can update announcements" ON public.hr_announcements FOR UPDATE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));
DROP POLICY IF EXISTS "HR can delete announcements" ON public.hr_announcements;
CREATE POLICY "HR can delete announcements" ON public.hr_announcements FOR DELETE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));

CREATE TABLE IF NOT EXISTS public.hr_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  recipient_user_id uuid,
  staff_id uuid,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view HR messages" ON public.hr_messages;
CREATE POLICY "Participants can view HR messages" ON public.hr_messages FOR SELECT TO authenticated
USING (sender_user_id = auth.uid() OR recipient_user_id = auth.uid() OR public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));
DROP POLICY IF EXISTS "Organisation members can send HR messages" ON public.hr_messages;
CREATE POLICY "Organisation members can send HR messages" ON public.hr_messages FOR INSERT TO authenticated
WITH CHECK (sender_user_id = auth.uid() AND public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager','teacher','staff']));
DROP POLICY IF EXISTS "Recipients can update read status" ON public.hr_messages;
CREATE POLICY "Recipients can update read status" ON public.hr_messages FOR UPDATE TO authenticated
USING (recipient_user_id = auth.uid() OR public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));
DROP POLICY IF EXISTS "HR can delete HR messages" ON public.hr_messages;
CREATE POLICY "HR can delete HR messages" ON public.hr_messages FOR DELETE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));

CREATE TABLE IF NOT EXISTS public.staff_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  issued_by uuid NOT NULL,
  title text NOT NULL,
  details text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  response text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_queries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HR can manage staff queries" ON public.staff_queries;
CREATE POLICY "HR can manage staff queries" ON public.staff_queries FOR ALL TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']))
WITH CHECK (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id uuid NOT NULL,
  staff_id uuid,
  requester_user_id uuid NOT NULL,
  leave_type text NOT NULL DEFAULT 'annual',
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view their leave requests" ON public.leave_requests;
CREATE POLICY "Staff can view their leave requests" ON public.leave_requests FOR SELECT TO authenticated
USING (requester_user_id = auth.uid() OR public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));
DROP POLICY IF EXISTS "Staff can create leave requests" ON public.leave_requests;
CREATE POLICY "Staff can create leave requests" ON public.leave_requests FOR INSERT TO authenticated
WITH CHECK (requester_user_id = auth.uid() AND public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager','teacher','staff']));
DROP POLICY IF EXISTS "HR can update leave requests" ON public.leave_requests;
CREATE POLICY "HR can update leave requests" ON public.leave_requests FOR UPDATE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));
DROP POLICY IF EXISTS "HR can delete leave requests" ON public.leave_requests;
CREATE POLICY "HR can delete leave requests" ON public.leave_requests FOR DELETE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','hr_manager']));

CREATE TABLE IF NOT EXISTS public.school_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id uuid NOT NULL,
  class_name text NOT NULL,
  level text DEFAULT '',
  teacher_user_id uuid,
  teacher_name text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (organization_user_id, class_name)
);
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School managers can view classes" ON public.school_classes;
CREATE POLICY "School managers can view classes" ON public.school_classes FOR SELECT TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','secretary_bursar','teacher']));
DROP POLICY IF EXISTS "School managers can create classes" ON public.school_classes;
CREATE POLICY "School managers can create classes" ON public.school_classes FOR INSERT TO authenticated
WITH CHECK (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','secretary_bursar']));
DROP POLICY IF EXISTS "School managers can update classes" ON public.school_classes;
CREATE POLICY "School managers can update classes" ON public.school_classes FOR UPDATE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','secretary_bursar']));
DROP POLICY IF EXISTS "School managers can delete classes" ON public.school_classes;
CREATE POLICY "School managers can delete classes" ON public.school_classes FOR DELETE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor']));

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id uuid NOT NULL,
  class_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  admission_number text DEFAULT '',
  guardian_name text DEFAULT '',
  guardian_phone text DEFAULT '',
  guardian_email text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  fee_status text NOT NULL DEFAULT 'unpaid',
  outstanding_balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School managers can view students" ON public.students;
CREATE POLICY "School managers can view students" ON public.students FOR SELECT TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','secretary_bursar','teacher']));
DROP POLICY IF EXISTS "School managers can create students" ON public.students;
CREATE POLICY "School managers can create students" ON public.students FOR INSERT TO authenticated
WITH CHECK (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','secretary_bursar']));
DROP POLICY IF EXISTS "School managers can update students" ON public.students;
CREATE POLICY "School managers can update students" ON public.students FOR UPDATE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','secretary_bursar']));
DROP POLICY IF EXISTS "School directors can delete students" ON public.students;
CREATE POLICY "School directors can delete students" ON public.students FOR DELETE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor']));

CREATE TABLE IF NOT EXISTS public.student_fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_user_id uuid NOT NULL,
  student_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'paid',
  payment_method text DEFAULT 'manual',
  term text DEFAULT '',
  session_year text DEFAULT '',
  notes text DEFAULT '',
  recorded_by uuid NOT NULL,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.student_fee_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School managers can view fee payments" ON public.student_fee_payments;
CREATE POLICY "School managers can view fee payments" ON public.student_fee_payments FOR SELECT TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','secretary_bursar']));
DROP POLICY IF EXISTS "School managers can create fee payments" ON public.student_fee_payments;
CREATE POLICY "School managers can create fee payments" ON public.student_fee_payments FOR INSERT TO authenticated
WITH CHECK (recorded_by = auth.uid() AND public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','secretary_bursar']));
DROP POLICY IF EXISTS "School managers can update fee payments" ON public.student_fee_payments;
CREATE POLICY "School managers can update fee payments" ON public.student_fee_payments FOR UPDATE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor','secretary_bursar']));
DROP POLICY IF EXISTS "School directors can delete fee payments" ON public.student_fee_payments;
CREATE POLICY "School directors can delete fee payments" ON public.student_fee_payments FOR DELETE TO authenticated
USING (public.has_org_role(auth.uid(), organization_user_id, ARRAY['director','proprietor']));

DROP POLICY IF EXISTS "Directors can view organisation payments" ON public.scheduled_payments;
CREATE POLICY "Directors can view organisation payments" ON public.scheduled_payments FOR SELECT TO authenticated
USING (public.has_org_role(auth.uid(), user_id, ARRAY['director','proprietor']));
DROP POLICY IF EXISTS "Directors can update organisation payments" ON public.scheduled_payments;
CREATE POLICY "Directors can update organisation payments" ON public.scheduled_payments FOR UPDATE TO authenticated
USING (public.has_org_role(auth.uid(), user_id, ARRAY['director','proprietor']));
DROP POLICY IF EXISTS "Directors can create organisation payments" ON public.scheduled_payments;
CREATE POLICY "Directors can create organisation payments" ON public.scheduled_payments FOR INSERT TO authenticated
WITH CHECK (public.has_org_role(auth.uid(), user_id, ARRAY['director','proprietor']));
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE TO authenticated
USING (public.is_platform_creator(auth.uid()));

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
  INSERT INTO public.profiles (user_id, business_name, first_name, last_name, phone, bvn, platform_mode, onboarding_completed)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'business_name', ''), COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''), COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''), COALESCE(NEW.raw_user_meta_data ->> 'phone', ''), COALESCE(NEW.raw_user_meta_data ->> 'bvn', ''), selected_mode, true);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.organization_roles (organization_user_id, user_id, platform_mode, role) VALUES (NEW.id, NEW.id, selected_mode, owner_role);
  RETURN NEW;
END;
$$;