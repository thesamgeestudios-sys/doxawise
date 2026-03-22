import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { formatNaira } from '@/lib/constants';
import { Wallet, Users, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const businessName = user?.user_metadata?.business_name || 'My Business';

  // Placeholder data - will be replaced with real data from DB
  const accountNumber = '0123456789';
  const bankName = 'Wema Bank (Flutterwave)';
  const balance = 0;

  const copyAccount = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success('Account number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: 'Wallet Balance', value: formatNaira(balance), icon: Wallet, color: 'text-primary' },
    { label: 'Total Staff', value: '0', icon: Users, color: 'text-info' },
    { label: 'Pending Payments', value: '0', icon: CreditCard, color: 'text-warning' },
    { label: 'Total Disbursed', value: formatNaira(0), icon: TrendingUp, color: 'text-success' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Greeting */}
        <div className="section-reveal">
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user?.user_metadata?.first_name || 'there'}!</h1>
          <p className="text-muted-foreground mt-1">{businessName} — Here's your payment overview</p>
        </div>

        {/* Account Card */}
        <div className="section-reveal stagger-1 card-elevated p-6 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <p className="text-sm opacity-80 mb-1">Virtual Account</p>
            <p className="text-xl font-bold mb-4">{businessName}</p>
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs opacity-60 mb-1">Account Number</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-wide">{accountNumber}</span>
                  <button onClick={copyAccount} className="p-1.5 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs opacity-60 mb-1">Bank</p>
                <p className="font-medium">{bankName}</p>
              </div>
              <div className="ml-auto">
                <p className="text-xs opacity-60 mb-1">Balance</p>
                <p className="text-3xl font-bold">{formatNaira(balance)}</p>
              </div>
            </div>
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
          <div className="p-12 text-center text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No transactions yet</p>
            <p className="text-sm mt-1">Your payment history will appear here</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
