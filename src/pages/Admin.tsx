import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { APP_NAME, formatNaira } from '@/lib/constants';
import {
  LayoutDashboard, Users, CreditCard, Settings, LogOut, FileText,
  TrendingUp, DollarSign, Shield, Search, Loader2, Eye
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'settings'>('overview');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [totalVolume, setTotalVolume] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState(0);

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) { navigate('/login'); return; }

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (data && data.length > 0) {
      setIsAdmin(true);
      loadAdminData();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    const [profilesRes, txRes, paymentsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('scheduled_payments').select('*'),
    ]);

    if (profilesRes.data) {
      setProfiles(profilesRes.data);
      setPendingVerifications(profilesRes.data.filter((p: any) => !p.bvn_verified).length);
    }

    if (txRes.data) {
      setAllTransactions(txRes.data);
      const volume = txRes.data.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      setTotalVolume(volume);
      // Revenue = sum of fees (0.3% capped at 1000 per tx debit)
      const debitTxs = txRes.data.filter((t: any) => t.type === 'debit');
      const revenue = debitTxs.reduce((sum: number, t: any) => sum + Math.min(Number(t.amount) * 0.003, 1000), 0);
      setPlatformRevenue(revenue);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-6 py-2.5 rounded-lg text-sm font-medium">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: profiles.length.toString(), icon: Users, color: 'text-primary' },
    { label: 'Total Volume', value: formatNaira(totalVolume), icon: TrendingUp, color: 'text-[hsl(var(--success))]' },
    { label: 'Platform Revenue', value: formatNaira(platformRevenue), icon: DollarSign, color: 'text-accent' },
    { label: 'Pending Verifications', value: pendingVerifications.toString(), icon: Shield, color: 'text-[hsl(var(--warning))]' },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'transactions', label: 'Transactions', icon: FileText },
    { key: 'settings', label: 'Platform Settings', icon: Settings },
  ] as const;

  const filteredUsers = profiles.filter(p =>
    !userSearch ||
    p.business_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.bvn?.includes(userSearch)
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-20">
        <div className="page-container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary">{APP_NAME}</span>
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Eye className="w-4 h-4" /> User View
            </button>
            <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="page-container py-8">
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2 section-reveal">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={stat.label} className={`stat-card section-reveal stagger-${i + 1}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="card-elevated p-6 section-reveal stagger-3">
              <h2 className="text-lg font-semibold mb-4">Revenue Summary</h2>
              <p className="text-muted-foreground text-sm">Total platform revenue from transaction fees (0.3% per transaction, capped at ₦1,000).</p>
              <p className="text-3xl font-bold text-primary mt-4">{formatNaira(platformRevenue)}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4 section-reveal">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users by name, business, or BVN..."
                className="input-field w-full pl-11"
              />
            </div>
            {filteredUsers.length > 0 ? (
              <div className="card-elevated overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Business</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden sm:table-cell">Name</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Account</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Balance</th>
                        <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">BVN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(p => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{p.business_name}</td>
                          <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.first_name} {p.last_name}</td>
                          <td className="p-4 text-sm font-mono hidden md:table-cell">{p.virtual_account_number || '—'}</td>
                          <td className="p-4 text-right font-medium tabular-nums">{formatNaira(p.wallet_balance || 0)}</td>
                          <td className="p-4 text-center">
                            <span className={p.bvn_verified ? 'badge-success' : 'badge-warning'}>
                              {p.bvn_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card-elevated p-12 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No users found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="card-elevated overflow-hidden section-reveal">
            {allTransactions.length > 0 ? (
              <div className="divide-y">
                {allTransactions.slice(0, 50).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {tx.reference && <span className="ml-2 font-mono">Ref: {tx.reference.slice(0, 16)}</span>}
                      </p>
                    </div>
                    <p className={`font-semibold tabular-nums shrink-0 ml-4 ${tx.type === 'credit' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No transactions yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 section-reveal">
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Platform Configuration</h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Transaction Fee (%)</label>
                    <input type="number" defaultValue={0.3} step={0.1} className="input-field w-full" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Fee Cap (₦)</label>
                    <input type="number" defaultValue={1000} className="input-field w-full" readOnly />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Fee configuration is defined in the platform code. Contact your developer to modify.</p>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Terms & Conditions</h2>
              <textarea
                rows={8}
                className="input-field w-full"
                defaultValue={`PaySwift Terms & Conditions\n\n1. PaySwift is a payment processing platform. We do not hold your funds.\n2. All payments are processed through Flutterwave's secure infrastructure.\n3. A transaction fee of 0.3% (capped at ₦1,000) applies to all transfers.\n4. Users must provide a valid BVN for identity verification.\n5. All transfers carry the registered business name.\n6. Scheduled payments are deducted from wallet balance first, then from tokenized cards.\n7. PaySwift is not a bank and does not offer banking services.`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
