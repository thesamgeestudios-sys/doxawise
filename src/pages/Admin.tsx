import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME, formatNaira } from '@/lib/constants';
import {
  LayoutDashboard, Users, CreditCard, Settings, LogOut, FileText,
  TrendingUp, DollarSign, Shield, ChevronRight, Search
} from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'settings'>('overview');

  const stats = [
    { label: 'Total Users', value: '0', icon: Users, color: 'text-primary' },
    { label: 'Total Volume', value: formatNaira(0), icon: TrendingUp, color: 'text-success' },
    { label: 'Platform Revenue', value: formatNaira(0), icon: DollarSign, color: 'text-accent' },
    { label: 'Pending Verifications', value: '0', icon: Shield, color: 'text-warning' },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'transactions', label: 'Transactions', icon: FileText },
    { key: 'settings', label: 'Platform Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-card border-b sticky top-0 z-20">
        <div className="page-container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary">{APP_NAME}</span>
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">ADMIN</span>
          </div>
          <button onClick={() => navigate('/login')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Exit Admin
          </button>
        </div>
      </header>

      <div className="page-container py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2 section-reveal">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
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
              <p className="text-muted-foreground text-sm">Revenue data will appear here as transactions are processed. Revenue = 0.3% of each transaction, capped at ₦1,000.</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4 section-reveal">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Search users by name, email, or BVN..." className="input-field w-full pl-11" />
            </div>
            <div className="card-elevated p-12 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No users registered yet</p>
              <p className="text-sm mt-1">Registered users and their details will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="card-elevated p-12 text-center text-muted-foreground section-reveal">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No transactions yet</p>
            <p className="text-sm mt-1">All platform transactions will appear here for admin review</p>
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
                    <input type="number" defaultValue={0.3} step={0.1} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Fee Cap (₦)</label>
                    <input type="number" defaultValue={1000} className="input-field w-full" />
                  </div>
                </div>
                <button className="btn-primary px-6 py-2.5 rounded-lg text-sm font-medium">Save Changes</button>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Terms & Conditions</h2>
              <textarea rows={8} className="input-field w-full" defaultValue={`PaySwift Terms & Conditions\n\n1. PaySwift is a payment processing platform. We do not hold your funds.\n2. All payments are processed through Flutterwave's secure infrastructure.\n3. A transaction fee of 0.3% (capped at ₦1,000) applies to all transfers.\n4. Users must provide a valid BVN for identity verification.\n5. All transfers carry the registered business name.\n6. Scheduled payments are deducted from wallet balance first, then from tokenized cards.\n7. PaySwift is not a bank and does not offer banking services.`} />
              <button className="btn-primary px-6 py-2.5 rounded-lg text-sm font-medium mt-4">Update Terms</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
