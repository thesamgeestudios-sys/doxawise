import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { formatNaira } from '@/lib/constants';
import { flutterwaveApi } from '@/lib/flutterwave';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Users, CreditCard, TrendingUp, Copy, CheckCircle2, Loader2, Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Profile {
  business_name: string;
  first_name: string;
  last_name: string;
  virtual_account_number: string | null;
  virtual_account_bank: string | null;
  wallet_balance: number | null;
  bvn_verified: boolean | null;
  bvn: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
  balance_after: number | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [totalDisbursed, setTotalDisbursed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [verifyingBvn, setVerifyingBvn] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [profileRes, txRes, staffRes, paymentsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
      supabase.from('transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('staff').select('id', { count: 'exact' }).eq('user_id', user!.id),
      supabase.from('scheduled_payments').select('*').eq('user_id', user!.id),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    setStaffCount(staffRes.count || 0);

    if (paymentsRes.data) {
      setPendingPayments(paymentsRes.data.filter((p: any) => p.status === 'pending').length);
      setTotalDisbursed(paymentsRes.data.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + Number(p.amount), 0));
    }
    setLoading(false);
  };

  const handleCreateVirtualAccount = async () => {
    setCreatingAccount(true);
    try {
      const result = await flutterwaveApi.createVirtualAccount();
      if (result.success) {
        toast.success('Virtual account created!');
        loadData();
      } else {
        toast.error(result.message || 'Failed to create virtual account');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setCreatingAccount(false);
  };

  const handleVerifyBvn = async () => {
    if (!profile?.bvn) {
      toast.error('No BVN on file');
      return;
    }
    setVerifyingBvn(true);
    try {
      const result = await flutterwaveApi.verifyBvn(profile.bvn);
      if (result.success) {
        toast.success('BVN verified!');
        loadData();
      } else {
        toast.error(result.message || 'BVN verification failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setVerifyingBvn(false);
  };

  const copyAccount = () => {
    if (profile?.virtual_account_number) {
      navigator.clipboard.writeText(profile.virtual_account_number);
      setCopied(true);
      toast.success('Account number copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const businessName = profile?.business_name || user?.user_metadata?.business_name || 'My Business';
  const balance = profile?.wallet_balance || 0;

  const stats = [
    { label: 'Wallet Balance', value: formatNaira(balance), icon: Wallet, color: 'text-primary' },
    { label: 'Total Staff', value: staffCount.toString(), icon: Users, color: 'text-[hsl(var(--info))]' },
    { label: 'Pending Payments', value: pendingPayments.toString(), icon: CreditCard, color: 'text-[hsl(var(--warning))]' },
    { label: 'Total Disbursed', value: formatNaira(totalDisbursed), icon: TrendingUp, color: 'text-[hsl(var(--success))]' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Greeting */}
        <div className="section-reveal">
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {profile?.first_name || user?.user_metadata?.first_name || 'there'}!</h1>
          <p className="text-muted-foreground mt-1">{businessName} — Here's your payment overview</p>
        </div>

        {/* BVN Verification Banner */}
        {!profile?.bvn_verified && (
          <div className="bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 section-reveal">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[hsl(var(--warning))] shrink-0" />
              <div>
                <p className="font-medium text-sm">BVN Not Verified</p>
                <p className="text-xs text-muted-foreground">Verify your BVN to enable transfers and virtual account creation</p>
              </div>
            </div>
            <button onClick={handleVerifyBvn} disabled={verifyingBvn} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shrink-0">
              {verifyingBvn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Verify BVN
            </button>
          </div>
        )}

        {/* Account Card */}
        <div className="section-reveal stagger-1 card-elevated p-6 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <p className="text-sm opacity-80 mb-1">Virtual Account</p>
            <p className="text-xl font-bold mb-4">{businessName}</p>

            {profile?.virtual_account_number ? (
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-xs opacity-60 mb-1">Account Number</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tracking-wide">{profile.virtual_account_number}</span>
                    <button onClick={copyAccount} className="p-1.5 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs opacity-60 mb-1">Bank</p>
                  <p className="font-medium">{profile.virtual_account_bank}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-xs opacity-60 mb-1">Balance</p>
                  <p className="text-3xl font-bold">{formatNaira(balance)}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <p className="text-sm opacity-80">No virtual account yet. Create one to start receiving payments.</p>
                <button
                  onClick={handleCreateVirtualAccount}
                  disabled={creatingAccount}
                  className="bg-primary-foreground/20 hover:bg-primary-foreground/30 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
                >
                  {creatingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Virtual Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`stat-card section-reveal stagger-${i + 1}`}>
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="card-elevated section-reveal stagger-3">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>
          {transactions.length > 0 ? (
            <div className="divide-y">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-[hsl(var(--success))]/10' : 'bg-destructive/10'}`}>
                      {tx.type === 'credit' ? (
                        <ArrowDownRight className="w-4 h-4 text-[hsl(var(--success))]" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold tabular-nums ${tx.type === 'credit' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                    </p>
                    {tx.balance_after !== null && (
                      <p className="text-xs text-muted-foreground">Bal: {formatNaira(tx.balance_after)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm mt-1">Your payment history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
