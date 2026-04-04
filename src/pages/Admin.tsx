import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { APP_NAME, formatNaira } from '@/lib/constants';
import {
  LayoutDashboard, Users, CreditCard, Settings, LogOut, FileText,
  TrendingUp, DollarSign, Shield, Search, Loader2, Eye, Edit2, Save, X, Ban, CheckCircle,
  Wallet, AlertTriangle, Trash2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'payments' | 'settings'>('overview');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [totalVolume, setTotalVolume] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState(0);

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ wallet_balance: '', bvn_verified: false, bvn: '', business_name: '', first_name: '', last_name: '', account_type: 'business' });
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  useEffect(() => { checkAdmin(); }, [user]);

  const checkAdmin = async () => {
    if (!user) { navigate('/login'); return; }
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin');
    if (data && data.length > 0) { setIsAdmin(true); loadAdminData(); }
    else { setIsAdmin(false); setLoading(false); }
  };

  const loadAdminData = async () => {
    const [profilesRes, txRes, paymentsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('scheduled_payments').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (profilesRes.data) {
      setProfiles(profilesRes.data);
      setPendingVerifications(profilesRes.data.filter((p: any) => !p.bvn_verified).length);
    }
    if (txRes.data) {
      setAllTransactions(txRes.data);
      const volume = txRes.data.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      setTotalVolume(volume);
      const debitTxs = txRes.data.filter((t: any) => t.type === 'debit');
      const revenue = debitTxs.reduce((sum: number, t: any) => sum + Math.min(Number(t.amount) * 0.003, 1000), 0);
      setPlatformRevenue(revenue);
    }
    if (paymentsRes.data) setAllPayments(paymentsRes.data);
    setLoading(false);
  };

  const startEditUser = (profile: any) => {
    setEditingUser(profile);
    setEditForm({
      wallet_balance: (profile.wallet_balance || 0).toString(),
      bvn_verified: profile.bvn_verified || false,
      bvn: profile.bvn || '',
      business_name: profile.business_name || '',
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      account_type: profile.account_type || 'business',
    });
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const result = await flutterwaveApi.adminUpdateUser(editingUser.user_id, {
        wallet_balance: parseFloat(editForm.wallet_balance) || 0,
        bvn_verified: editForm.bvn_verified,
        bvn: editForm.bvn,
        business_name: editForm.business_name,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        account_type: editForm.account_type,
      });
      if (result.success) {
        toast.success(`Updated ${editForm.business_name || editForm.first_name}`);
        setEditingUser(null);
        loadAdminData();
      } else {
        toast.error(result.error || 'Update failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingUser(false);
  };

  const handleDeleteUser = async (userId: string, businessName: string) => {
    if (!confirm(`Permanently delete "${businessName}" and all associated data? This cannot be undone.`)) return;
    setDeletingUser(userId);
    try {
      const result = await flutterwaveApi.adminDeleteUser(userId);
      if (result.success) {
        toast.success('User account fully deleted');
        loadAdminData();
      } else {
        toast.error(result.error || 'Deletion failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setDeletingUser(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
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
    { label: 'Pending BVN', value: pendingVerifications.toString(), icon: Shield, color: 'text-[hsl(var(--warning))]' },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'transactions', label: 'Transactions', icon: FileText },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const filteredUsers = profiles.filter(p =>
    !userSearch ||
    p.business_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.bvn?.includes(userSearch)
  );

  const pendingPayments = allPayments.filter((p: any) => p.status === 'pending').length;
  const completedPayments = allPayments.filter((p: any) => p.status === 'completed').length;
  const failedPayments = allPayments.filter((p: any) => p.status === 'failed').length;

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
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
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
            <div className="grid sm:grid-cols-3 gap-4 section-reveal stagger-3">
              <div className="stat-card border-l-4 border-l-[hsl(var(--warning))]">
                <p className="text-2xl font-bold">{pendingPayments}</p>
                <p className="text-sm text-muted-foreground mt-1">Pending Payments</p>
              </div>
              <div className="stat-card border-l-4 border-l-[hsl(var(--success))]">
                <p className="text-2xl font-bold">{completedPayments}</p>
                <p className="text-sm text-muted-foreground mt-1">Completed Payments</p>
              </div>
              <div className="stat-card border-l-4 border-l-destructive">
                <p className="text-2xl font-bold">{failedPayments}</p>
                <p className="text-sm text-muted-foreground mt-1">Failed Payments</p>
              </div>
            </div>
            <div className="card-elevated p-6 section-reveal stagger-4">
              <h2 className="text-lg font-semibold mb-4">Revenue Summary</h2>
              <p className="text-muted-foreground text-sm">Total platform revenue from transaction fees (0.3% per transaction, capped at ₦1,000).</p>
              <p className="text-3xl font-bold text-primary mt-4">{formatNaira(platformRevenue)}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4 section-reveal">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users by name, business, or BVN..." className="input-field w-full pl-11" />
              </div>
              <button onClick={loadAdminData} className="p-2.5 rounded-lg border hover:bg-muted transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {filteredUsers.length > 0 ? (
              <div className="card-elevated overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Business</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden sm:table-cell">Name</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Type</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Account</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Balance</th>
                        <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">BVN</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(p => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{p.business_name}</td>
                          <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.first_name} {p.last_name}</td>
                          <td className="p-4 hidden md:table-cell"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{p.account_type}</span></td>
                          <td className="p-4 text-sm font-mono hidden md:table-cell">{p.virtual_account_number || '—'}</td>
                          <td className="p-4 text-right font-medium tabular-nums">{formatNaira(p.wallet_balance || 0)}</td>
                          <td className="p-4 text-center">
                            <span className={p.bvn_verified ? 'badge-success' : 'badge-warning'}>{p.bvn_verified ? 'Verified' : 'Pending'}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => startEditUser(p)} className="p-2 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(p.user_id, p.business_name)}
                                disabled={deletingUser === p.user_id}
                                className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                {deletingUser === p.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
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

            {editingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setEditingUser(null)}>
                <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg p-6 section-reveal max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Edit User</h2>
                    <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">First Name</label>
                        <input value={editForm.first_name} onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))} className="input-field w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Last Name</label>
                        <input value={editForm.last_name} onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))} className="input-field w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Business Name</label>
                      <input value={editForm.business_name} onChange={e => setEditForm(p => ({ ...p, business_name: e.target.value }))} className="input-field w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Account Type</label>
                        <select value={editForm.account_type} onChange={e => setEditForm(p => ({ ...p, account_type: e.target.value }))} className="input-field w-full">
                          <option value="personal">Personal</option>
                          <option value="business">Business</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Wallet Balance (₦)</label>
                        <input type="number" value={editForm.wallet_balance} onChange={e => setEditForm(p => ({ ...p, wallet_balance: e.target.value }))} className="input-field w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">BVN</label>
                      <input value={editForm.bvn} onChange={e => setEditForm(p => ({ ...p, bvn: e.target.value }))} className="input-field w-full" maxLength={11} />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={editForm.bvn_verified} onChange={e => setEditForm(p => ({ ...p, bvn_verified: e.target.checked }))} className="w-4 h-4 rounded border-input accent-primary" />
                      <span className="text-sm font-medium">BVN Verified</span>
                    </label>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                      <button onClick={saveUserEdit} disabled={savingUser} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                        {savingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="card-elevated overflow-hidden section-reveal">
            {allTransactions.length > 0 ? (
              <div className="divide-y">
                {allTransactions.slice(0, 100).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {tx.reference && <span className="ml-2 font-mono">Ref: {tx.reference.slice(0, 20)}</span>}
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

        {activeTab === 'payments' && (
          <div className="card-elevated overflow-hidden section-reveal">
            {allPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Recipient</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden sm:table-cell">Bank</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Amount</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayments.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{p.recipient_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.account_number}</p>
                        </td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.bank_name}</td>
                        <td className="p-4 text-right font-medium tabular-nums">{formatNaira(p.amount)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            p.status === 'completed' ? 'badge-success' :
                            p.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'badge-warning'
                          }`}>
                            {p.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                             p.status === 'failed' ? <Ban className="w-3 h-3" /> :
                             <AlertTriangle className="w-3 h-3" />}
                            {p.status}
                          </span>
                          {p.failure_reason && <p className="text-xs text-destructive mt-1">{p.failure_reason}</p>}
                        </td>
                        <td className="p-4 text-sm hidden md:table-cell">{p.scheduled_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No payments yet</p>
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
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Non-BVN Transfer Limit (₦)</label>
                    <input type="number" defaultValue={50000} className="input-field w-full" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Platform Name</label>
                    <input defaultValue={APP_NAME} className="input-field w-full" readOnly />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Platform settings are defined in the code. Contact your developer to modify these values.</p>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Webhook URL</h2>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-mono break-all">https://rqyomobgjedzqjbxdzbw.supabase.co/functions/v1/flutterwave-webhook</p>
                <p className="text-xs text-muted-foreground mt-2">Set this URL in your Flutterwave dashboard under Settings → Webhooks.</p>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Terms & Conditions</h2>
              <textarea rows={8} className="input-field w-full"
                defaultValue={`${APP_NAME} Terms & Conditions\n\n1. ${APP_NAME} is a payment processing platform. We do not hold your funds.\n2. All payments are processed through Flutterwave's secure infrastructure.\n3. A transaction fee of 0.3% (capped at ₦1,000) applies to all transfers.\n4. Users without BVN verification have a ₦50,000 transfer limit.\n5. All transfers carry the registered business name.\n6. Once a virtual account is created, your business name cannot be changed.\n7. ${APP_NAME} is not a bank and does not offer banking services.`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
