import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type PlatformMode = 'company' | 'school';

type OrgRole = {
  role: string;
  organization_user_id: string;
  platform_mode: PlatformMode;
  department?: string | null;
};

export const roleLabels: Record<string, string> = {
  director: 'Director',
  proprietor: 'Director / Proprietor',
  hr_manager: 'HR Manager',
  secretary_bursar: 'Secretary / Bursar',
  teacher: 'Staff / Teacher',
  staff: 'Staff',
};

export const usePlatformAccess = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      setLoading(true);
      const [profileRes, rolesRes, creatorRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('organization_roles').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.rpc('is_platform_creator' as any, { _user_id: user.id } as any),
      ]);

      if (!mounted) return;
      setProfile(profileRes.data || null);
      setRoles((rolesRes.data || []) as OrgRole[]);
      setIsCreator(Boolean(creatorRes.data));
      setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, [user]);

  const primaryRole = roles[0]?.role || (profile?.platform_mode === 'school' ? 'proprietor' : 'director');
  const organizationId = roles[0]?.organization_user_id || user?.id || '';
  const mode: PlatformMode = (profile?.platform_mode || roles[0]?.platform_mode || 'company') as PlatformMode;

  const access = useMemo(() => ({
    isCompany: mode === 'company',
    isSchool: mode === 'school',
    isDirector: ['director', 'proprietor'].includes(primaryRole) || isCreator,
    isHr: ['director', 'proprietor', 'hr_manager'].includes(primaryRole) || isCreator,
    isFinance: ['director', 'proprietor'].includes(primaryRole) || isCreator,
    isBursar: ['proprietor', 'secretary_bursar'].includes(primaryRole) || isCreator,
    isLimitedStaff: ['staff', 'teacher'].includes(primaryRole) && !isCreator,
  }), [mode, primaryRole, isCreator]);

  return { user, profile, roles, primaryRole, roleLabel: roleLabels[primaryRole] || primaryRole, organizationId, mode, access, isCreator, loading };
};
