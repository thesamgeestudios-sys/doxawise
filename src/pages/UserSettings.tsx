import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Building2, User, Shield } from 'lucide-react';
import { toast } from 'sonner';

const UserSettings = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="section-reveal">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and business details</p>
        </div>

        {/* Business Info */}
        <div className="card-elevated p-6 section-reveal stagger-1">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Business Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Business Name</label>
              <input defaultValue={user?.user_metadata?.business_name || ''} className="input-field w-full" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input defaultValue={user?.email || ''} className="input-field w-full" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input defaultValue={user?.user_metadata?.phone || ''} className="input-field w-full" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">BVN Status</label>
              <div className="input-field w-full flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                <span className="text-sm">Verification pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Info */}
        <div className="card-elevated p-6 section-reveal stagger-2">
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
