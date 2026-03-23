import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { Settings, Building2, Shield, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const UserSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleVerifyBvn = async () => {
    if (!profile?.bvn) {
      toast.error('No BVN on file');
      return;
    }
    setVerifying(true);
    try {
      const result = await flutterwaveApi.verifyBvn(profile.bvn);
      if (result.success) {
        toast.success('BVN verified!');
        loadProfile();
      } else {
        toast.error(result.message || 'Verification failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setVerifying(false);
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="section-reveal">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and business details</p>
        </div>

        <div className="card-elevated p-6 section-reveal stagger-1">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Business Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Business Name</label>
              <input defaultValue={profile?.business_name || ''} className="input-field w-full" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input defaultValue={user?.email || ''} className="input-field w-full" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input defaultValue={profile?.phone || ''} className="input-field w-full" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">BVN Status</label>
              <div className="input-field w-full flex items-center gap-2">
                {profile?.bvn_verified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                    <span className="text-sm font-medium text-[hsl(var(--success))]">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
                    <span className="text-sm">Not verified</span>
                    <button
                      onClick={handleVerifyBvn}
                      disabled={verifying}
                      className="ml-auto text-xs btn-primary px-3 py-1 rounded-md font-medium flex items-center gap-1"
                    >
                      {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify Now'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Virtual Account Info */}
        {profile?.virtual_account_number && (
          <div className="card-elevated p-6 section-reveal stagger-2">
            <h2 className="text-lg font-semibold mb-4">Virtual Account</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Account Number</label>
                <input defaultValue={profile.virtual_account_number} className="input-field w-full font-mono" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Bank</label>
                <input defaultValue={profile.virtual_account_bank || ''} className="input-field w-full" readOnly />
              </div>
            </div>
          </div>
        )}

        <div className="card-elevated p-6 section-reveal stagger-3">
          <h2 className="text-lg font-semibold mb-4">Fee Structure</h2>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <p><span className="font-medium">Transfer Fee:</span> 0.3% of transaction amount</p>
            <p><span className="font-medium">Fee Cap:</span> ₦1,000 maximum per transaction</p>
            <p className="text-muted-foreground mt-2">PaySwift does not hold your funds. All payments are processed through Flutterwave's secure infrastructure.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserSettings;
