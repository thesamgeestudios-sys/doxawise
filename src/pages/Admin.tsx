import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { APP_NAME, formatNaira } from '@/lib/constants';
import {
  LayoutDashboard, Users, CreditCard, Settings, LogOut, FileText,
  TrendingUp, DollarSign, Shield, Search, Loader2, Eye, Edit2, Save, X, Ban, CheckCircle,
  Wallet, AlertTriangle, Trash2, RefreshCw, MessageSquare, Send, Bell, HelpCircle, Mail,
  Calendar, BarChart3, Globe, Activity, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

// Helper to filter by date range
function filterByDateRange(items: any[], field: string, days: number | null) {
  if (days === null) return items;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return items.filter(item => new Date(item[field]) >= cutoff);
}

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'payments' | 'tickets' | 'messages' | 'cms' | 'settings'>('overview');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual' | 'all'>('all');

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ bvn_verified: false, bvn: '', business_name: '', first_name: '', last_name: '', account_type: 'business', phone: '' });
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  const [replyingTicket, setReplyingTicket] = useState<any>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketStatus, setTicketStatus] = useState('open');
  const [savingReply, setSavingReply] = useState(false);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({ recipient_user_id: '', subject: '', message: '', is_broadcast: false });
  const [sendingMessage, setSendingMessage] = useState(false);

  const [viewingUser, setViewingUser] = useState<any>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);

  // CMS state (must be before early returns)
  const [cmsPages, setCmsPages] = useState<any[]>([]);
  const [cmsEditItem, setCmsEditItem] = useState<any>(null);
  const [cmsForm, setCmsForm] = useState({ content_text: '', content_image_url: '', is_visible: true, display_order: 0 });
  const [savingCms, setSavingCms] = useState(false);
  const [newCmsForm, setNewCmsForm] = useState({ page_name: 'home', section_name: '', content_type: 'text', content_text: '', content_image_url: '', display_order: 0 });
  const [showNewCmsModal, setShowNewCmsModal] = useState(false);

  useEffect(() => { checkAdmin(); }, [user]);

  const loadCmsData = async () => {
    const { data } = await supabase.from('cms_pages').select('*').order('page_name').order('display_order');
    if (data) setCmsPages(data);
  };

  useEffect(() => { if (isAdmin) loadCmsData(); }, [isAdmin]);

  const checkAdmin = async () => {
    if (!user) { navigate('/login'); return; }
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin');
    if (data && data.length > 0) { setIsAdmin(true); loadAdminData(); }
    else { setIsAdmin(false); setLoading(false); }
  };

  const loadAdminData = async () => {
    const [profilesRes, txRes, paymentsRes, ticketsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('scheduled_payments').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (txRes.data) setAllTransactions(txRes.data);
    if (paymentsRes.data) setAllPayments(paymentsRes.data);
    if (ticketsRes.data) setTickets(ticketsRes.data);
    setLoading(false);
  };

  // Computed analytics
  const periodDays = useMemo(() => {
    switch (statsPeriod) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'annual': return 365;
      default: return null;
    }
  }, [statsPeriod]);

  const analytics = useMemo(() => {
    const filteredTx = filterByDateRange(allTransactions, 'created_at', periodDays);
    const filteredUsers = filterByDateRange(profiles, 'created_at', periodDays);
    const filteredPayments = filterByDateRange(allPayments, 'created_at', periodDays);

    const totalVolume = filteredTx.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const debitTxs = filteredTx.filter((t: any) => t.type === 'debit');
    const creditTxs = filteredTx.filter((t: any) => t.type === 'credit');
    const revenue = debitTxs.reduce((sum: number, t: any) => sum + Math.min(Number(t.amount) * 0.003, 1000), 0);
    const completedPayments = filteredPayments.filter((p: any) => p.status === 'completed');
    const failedPayments = filteredPayments.filter((p: any) => p.status === 'failed');
    const pendingPayments = filteredPayments.filter((p: any) => p.status === 'pending');

    // Daily new users (always today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyNewUsers = profiles.filter(p => new Date(p.created_at) >= today).length;

    // Users with verified BVN
    const verifiedUsers = profiles.filter(p => p.bvn_verified).length;
    const unverifiedUsers = profiles.length - verifiedUsers;

    return {
      totalUsers: profiles.length,
      newUsers: filteredUsers.length,
      dailyNewUsers,
      totalVolume,
      totalDebit: debitTxs.reduce((s: number, t: any) => s + Number(t.amount), 0),
      totalCredit: creditTxs.reduce((s: number, t: any) => s + Number(t.amount), 0),
      revenue,
      transactionCount: filteredTx.length,
      completedPayments: completedPayments.length,
      failedPayments: failedPayments.length,
      pendingPayments: pendingPayments.length,
      paymentVolume: completedPayments.reduce((s: number, p: any) => s + Number(p.amount), 0),
      verifiedUsers,
      unverifiedUsers,
    };
  }, [allTransactions, profiles, allPayments, periodDays]);

  const startEditUser = (profile: any) => {
    setEditingUser(profile);
    setEditForm({
      bvn_verified: profile.bvn_verified || false,
      bvn: profile.bvn || '',
      business_name: profile.business_name || '',
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      account_type: profile.account_type || 'business',
      phone: profile.phone || '',
    });
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const result = await flutterwaveApi.adminUpdateUser(editingUser.user_id, editForm);
      if (result.success) { toast.success(`Updated ${editForm.first_name} ${editForm.last_name}`); setEditingUser(null); loadAdminData(); }
      else toast.error(result.error || 'Update failed');
    } catch (err: any) { toast.error(err.message); }
    setSavingUser(false);
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Permanently delete "${name}" and all associated data? This cannot be undone.`)) return;
    setDeletingUser(userId);
    try {
      const result = await flutterwaveApi.adminDeleteUser(userId);
      if (result.success) { toast.success('User account fully deleted'); loadAdminData(); }
      else toast.error(result.error || 'Deletion failed');
    } catch (err: any) { toast.error(err.message); }
    setDeletingUser(null);
  };

  const viewUserDetails = async (profile: any) => {
    setViewingUser(profile);
    const { data } = await supabase.from('transactions').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(50);
    if (data) setUserTransactions(data);
  };

  const handleReplyTicket = async () => {
    if (!replyingTicket) return;
    setSavingReply(true);
    try {
      const result = await flutterwaveApi.replySupportTicket(replyingTicket.id, ticketReply, ticketStatus);
      if (result.success) { toast.success('Reply sent'); setReplyingTicket(null); setTicketReply(''); loadAdminData(); }
      else toast.error(result.error || 'Failed');
    } catch (err: any) { toast.error(err.message); }
    setSavingReply(false);
  };

  const handleSendMessage = async () => {
    setSendingMessage(true);
    try {
      const result = await flutterwaveApi.sendMessage({
        recipient_user_id: messageForm.is_broadcast ? undefined : messageForm.recipient_user_id,
        subject: messageForm.subject,
        message: messageForm.message,
        is_broadcast: messageForm.is_broadcast,
      });
      if (result.success) {
        toast.success(messageForm.is_broadcast ? 'Broadcast sent' : 'Message sent');
        setShowMessageModal(false);
        setMessageForm({ recipient_user_id: '', subject: '', message: '', is_broadcast: false });
      } else toast.error(result.error || 'Failed');
    } catch (err: any) { toast.error(err.message); }
    setSendingMessage(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

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

  const loadCmsData = async () => {
    const { data } = await supabase.from('cms_pages').select('*').order('page_name').order('display_order');
    if (data) setCmsPages(data);
  };

  useEffect(() => { if (isAdmin) loadCmsData(); }, [isAdmin]);

  const saveCmsEdit = async () => {
    if (!cmsEditItem) return;
    setSavingCms(true);
    const { error } = await supabase.from('cms_pages').update({
      content_text: cmsForm.content_text,
      content_image_url: cmsForm.content_image_url,
      is_visible: cmsForm.is_visible,
      display_order: cmsForm.display_order,
    }).eq('id', cmsEditItem.id);
    if (error) toast.error(error.message);
    else { toast.success('Content updated'); setCmsEditItem(null); loadCmsData(); }
    setSavingCms(false);
  };

  const deleteCmsItem = async (id: string) => {
    if (!confirm('Delete this content block?')) return;
    await supabase.from('cms_pages').delete().eq('id', id);
    toast.success('Deleted');
    loadCmsData();
  };

  const createCmsItem = async () => {
    if (!newCmsForm.section_name) { toast.error('Section name required'); return; }
    setSavingCms(true);
    const { error } = await supabase.from('cms_pages').insert(newCmsForm);
    if (error) toast.error(error.message);
    else { toast.success('Content block added'); setShowNewCmsModal(false); setNewCmsForm({ page_name: 'home', section_name: '', content_type: 'text', content_text: '', content_image_url: '', display_order: 0 }); loadCmsData(); }
    setSavingCms(false);
  };

  const moveCmsItem = async (item: any, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? item.display_order - 1 : item.display_order + 1;
    await supabase.from('cms_pages').update({ display_order: newOrder }).eq('id', item.id);
    loadCmsData();
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'transactions', label: 'Transactions', icon: FileText },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'tickets', label: 'Support', icon: HelpCircle },
    { key: 'messages', label: 'Messages', icon: Mail },
    { key: 'cms', label: 'CMS', icon: Globe },
    { key: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const filteredUsers = profiles.filter(p =>
    !userSearch ||
    p.business_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.bvn?.includes(userSearch) ||
    p.virtual_account_number?.includes(userSearch) ||
    p.phone?.includes(userSearch)
  );

  const openTickets = tickets.filter(t => t.status === 'open').length;

  const periodLabels: Record<string, string> = { daily: 'Today', weekly: 'This Week', monthly: 'This Month', annual: 'This Year', all: 'All Time' };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-20">
        <div className="page-container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary">{APP_NAME}</span>
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><Eye className="w-4 h-4" /> User View</button>
            <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><LogOut className="w-4 h-4" /> Sign Out</button>
          </div>
        </div>
      </header>

      <div className="page-container py-8">
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2 section-reveal">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
              {tab.key === 'tickets' && openTickets > 0 && (
                <span className="w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">{openTickets}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Period Selector */}
            <div className="flex items-center gap-2 flex-wrap section-reveal">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {(['daily', 'weekly', 'monthly', 'annual', 'all'] as const).map(p => (
                <button key={p} onClick={() => setStatsPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statsPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {periodLabels[p]}
                </button>
              ))}
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 section-reveal stagger-1">
              <div className="stat-card border-l-4 border-l-primary">
                <Users className="w-5 h-5 text-primary mb-3" />
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Users</p>
              </div>
              <div className="stat-card border-l-4 border-l-[hsl(var(--success))]">
                <UserPlus className="w-5 h-5 text-[hsl(var(--success))] mb-3" />
                <p className="text-2xl font-bold">{analytics.dailyNewUsers}</p>
                <p className="text-sm text-muted-foreground mt-1">New Today</p>
              </div>
              <div className="stat-card border-l-4 border-l-[hsl(var(--info))]">
                <TrendingUp className="w-5 h-5 text-[hsl(var(--info))] mb-3" />
                <p className="text-2xl font-bold">{formatNaira(analytics.totalVolume)}</p>
                <p className="text-sm text-muted-foreground mt-1">Volume ({periodLabels[statsPeriod]})</p>
              </div>
              <div className="stat-card border-l-4 border-l-accent">
                <DollarSign className="w-5 h-5 text-accent mb-3" />
                <p className="text-2xl font-bold">{formatNaira(analytics.revenue)}</p>
                <p className="text-sm text-muted-foreground mt-1">Revenue ({periodLabels[statsPeriod]})</p>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 section-reveal stagger-2">
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-[hsl(var(--teal))]" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transactions</p>
                </div>
                <p className="text-xl font-bold">{analytics.transactionCount}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[hsl(var(--success))]" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</p>
                </div>
                <p className="text-xl font-bold">{formatNaira(analytics.totalCredit)}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="w-4 h-4 text-destructive" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Debits</p>
                </div>
                <p className="text-xl font-bold">{formatNaira(analytics.totalDebit)}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-[hsl(var(--purple))]" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Volume</p>
                </div>
                <p className="text-xl font-bold">{formatNaira(analytics.paymentVolume)}</p>
              </div>
            </div>

            {/* Payment & User Stats */}
            <div className="grid sm:grid-cols-3 gap-4 section-reveal stagger-3">
              <div className="stat-card border-l-4 border-l-[hsl(var(--warning))]">
                <p className="text-2xl font-bold">{analytics.pendingPayments}</p>
                <p className="text-sm text-muted-foreground mt-1">Pending Payments</p>
              </div>
              <div className="stat-card border-l-4 border-l-[hsl(var(--success))]">
                <p className="text-2xl font-bold">{analytics.completedPayments}</p>
                <p className="text-sm text-muted-foreground mt-1">Completed Payments</p>
              </div>
              <div className="stat-card border-l-4 border-l-destructive">
                <p className="text-2xl font-bold">{analytics.failedPayments}</p>
                <p className="text-sm text-muted-foreground mt-1">Failed Payments</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 section-reveal stagger-4">
              <div className="stat-card">
                <Shield className="w-5 h-5 text-[hsl(var(--success))] mb-2" />
                <p className="text-xl font-bold">{analytics.verifiedUsers}</p>
                <p className="text-sm text-muted-foreground mt-1">BVN Verified</p>
              </div>
              <div className="stat-card">
                <AlertTriangle className="w-5 h-5 text-[hsl(var(--warning))] mb-2" />
                <p className="text-xl font-bold">{analytics.unverifiedUsers}</p>
                <p className="text-sm text-muted-foreground mt-1">Unverified Users</p>
              </div>
              <div className="stat-card">
                <HelpCircle className="w-5 h-5 text-destructive mb-2" />
                <p className="text-xl font-bold">{openTickets}</p>
                <p className="text-sm text-muted-foreground mt-1">Open Tickets</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4 section-reveal">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name, business, BVN, phone, or account number..." className="input-field w-full pl-11" />
              </div>
              <button onClick={() => setShowMessageModal(true)} className="btn-primary px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shrink-0">
                <Send className="w-4 h-4" /> Message
              </button>
              <button onClick={loadAdminData} className="p-2.5 rounded-lg border hover:bg-muted transition-colors"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found</p>
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Name</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden sm:table-cell">Business</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Account</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Balance</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">BVN</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden lg:table-cell">Joined</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(p => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{p.first_name} {p.last_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{p.account_type}</p>
                        </td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.business_name}</td>
                        <td className="p-4 text-sm font-mono hidden md:table-cell">{p.virtual_account_number || '—'}</td>
                        <td className="p-4 text-right font-medium tabular-nums">{formatNaira(p.wallet_balance || 0)}</td>
                        <td className="p-4 text-center">
                          <span className={p.bvn_verified ? 'badge-success' : 'badge-warning'}>{p.bvn_verified ? 'Verified' : 'Pending'}</span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">{new Date(p.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => viewUserDetails(p)} className="p-2 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => startEditUser(p)} className="p-2 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { setMessageForm(f => ({ ...f, recipient_user_id: p.user_id, is_broadcast: false })); setShowMessageModal(true); }}
                              className="p-2 rounded-md hover:bg-[hsl(var(--info))]/10 text-muted-foreground hover:text-[hsl(var(--info))] transition-colors" title="Message"><MessageSquare className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteUser(p.user_id, `${p.first_name} ${p.last_name}`)} disabled={deletingUser === p.user_id}
                              className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
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
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="card-elevated overflow-hidden section-reveal">
            {allTransactions.length > 0 ? (
              <div className="divide-y">
                {allTransactions.slice(0, 100).map(tx => {
                  const txProfile = profiles.find(p => p.user_id === tx.user_id);
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {txProfile ? `${txProfile.first_name} ${txProfile.last_name}` : 'Unknown'} • {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <p className={`font-semibold tabular-nums shrink-0 ml-4 ${tx.type === 'credit' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No transactions yet</p></div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="card-elevated overflow-hidden section-reveal">
            {allPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Recipient</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden sm:table-cell">Bank</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Amount</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Date</th>
                  </tr></thead>
                  <tbody>
                    {allPayments.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4"><p className="font-medium">{p.recipient_name}</p><p className="text-xs text-muted-foreground font-mono">{p.account_number}</p></td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.bank_name}</td>
                        <td className="p-4 text-right font-medium tabular-nums">{formatNaira(p.amount)}</td>
                        <td className="p-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.status === 'completed' ? 'badge-success' : p.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'badge-warning'}`}>{p.status}</span>
                          {p.failure_reason && <p className="text-xs text-destructive mt-1">{p.failure_reason}</p>}
                        </td>
                        <td className="p-4 text-sm hidden md:table-cell">{p.scheduled_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No payments yet</p></div>
            )}
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-4 section-reveal">
            <h2 className="text-lg font-semibold">Support Tickets ({openTickets} open)</h2>
            {tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map(ticket => {
                  const ticketUser = profiles.find(p => p.user_id === ticket.user_id);
                  return (
                    <div key={ticket.id} className="card-elevated p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{ticket.subject}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'badge-warning' : ticket.status === 'resolved' ? 'badge-success' : 'badge-info'}`}>{ticket.status}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">From: {ticketUser ? `${ticketUser.first_name} ${ticketUser.last_name}` : 'Unknown'} • {new Date(ticket.created_at).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">{ticket.message}</p>
                          {ticket.admin_reply && (
                            <div className="mt-2 bg-primary/5 rounded-lg p-3 border-l-2 border-primary">
                              <p className="text-xs font-medium text-primary mb-1">Your Reply:</p>
                              <p className="text-sm">{ticket.admin_reply}</p>
                            </div>
                          )}
                        </div>
                        <button onClick={() => { setReplyingTicket(ticket); setTicketReply(ticket.admin_reply || ''); setTicketStatus(ticket.status); }}
                          className="btn-primary px-3 py-1.5 rounded-md text-xs font-medium shrink-0">Reply</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card-elevated p-12 text-center text-muted-foreground"><HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No support tickets</p></div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4 section-reveal">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Messages</h2>
              <button onClick={() => setShowMessageModal(true)} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Send className="w-4 h-4" /> New Message</button>
            </div>
            <div className="bg-[hsl(var(--info))]/5 border border-[hsl(var(--info))]/20 rounded-xl p-4 text-sm">
              <p className="font-medium">Messaging</p>
              <p className="text-muted-foreground mt-1">Send personal messages to individual users or broadcast announcements to all users.</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 section-reveal">
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Webhook Configuration</h2>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Webhook URL</p>
                  <p className="text-sm font-mono break-all bg-card p-2 rounded border">https://rqyomobgjedzqjbxdzbw.supabase.co/functions/v1/flutterwave-webhook</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Secret Hash</p>
                  <p className="text-xs text-muted-foreground">Set the same hash value you entered as FLW_WEBHOOK_HASH in your Flutterwave dashboard.</p>
                </div>
              </div>
            </div>
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">IP Whitelisting</h2>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm">Add these IP addresses to your Flutterwave IP whitelist:</p>
                <p className="text-sm font-mono bg-card p-2 rounded border">35.195.187.50</p>
                <p className="text-xs text-muted-foreground">Go to Flutterwave Dashboard → Settings → API → IP Whitelisting</p>
              </div>
            </div>
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Platform Configuration</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1.5">Transaction Fee (%)</label><input type="number" defaultValue={0.3} className="input-field w-full" readOnly /></div>
                <div><label className="block text-sm font-medium mb-1.5">Fee Cap (₦)</label><input type="number" defaultValue={1000} className="input-field w-full" readOnly /></div>
                <div><label className="block text-sm font-medium mb-1.5">Non-BVN Transfer Limit (₦)</label><input type="number" defaultValue={50000} className="input-field w-full" readOnly /></div>
                <div><label className="block text-sm font-medium mb-1.5">Platform Name</label><input defaultValue={APP_NAME} className="input-field w-full" readOnly /></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setEditingUser(null)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg p-6 section-reveal max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1.5">First Name</label><input value={editForm.first_name} onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))} className="input-field w-full" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Last Name</label><input value={editForm.last_name} onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))} className="input-field w-full" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Business Name</label><input value={editForm.business_name} onChange={e => setEditForm(p => ({ ...p, business_name: e.target.value }))} className="input-field w-full" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1.5">Account Type</label>
                  <select value={editForm.account_type} onChange={e => setEditForm(p => ({ ...p, account_type: e.target.value }))} className="input-field w-full">
                    <option value="personal">Personal</option><option value="business">Business</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1.5">Phone</label><input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="input-field w-full" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1.5">BVN</label><input value={editForm.bvn} onChange={e => setEditForm(p => ({ ...p, bvn: e.target.value }))} className="input-field w-full" maxLength={11} /></div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p><strong>Wallet Balance:</strong> {formatNaira(editingUser.wallet_balance || 0)} — <em>Cannot be modified by admin</em></p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={editForm.bvn_verified} onChange={e => setEditForm(p => ({ ...p, bvn_verified: e.target.checked }))} className="w-4 h-4 rounded border-input accent-primary" />
                <span className="text-sm font-medium">BVN Verified</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted">Cancel</button>
                <button onClick={saveUserEdit} disabled={savingUser} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  {savingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setViewingUser(null)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl p-6 section-reveal max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{viewingUser.first_name} {viewingUser.last_name}</h2>
              <button onClick={() => setViewingUser(null)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Business</p><p className="font-medium">{viewingUser.business_name}</p></div>
              <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Balance</p><p className="font-medium">{formatNaira(viewingUser.wallet_balance || 0)}</p></div>
              <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Account</p><p className="font-medium font-mono">{viewingUser.virtual_account_number || 'None'}</p></div>
              <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">BVN</p><p className="font-medium">{viewingUser.bvn || 'Not set'} {viewingUser.bvn_verified ? '✓' : '✗'}</p></div>
              <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{viewingUser.phone || 'Not set'}</p></div>
              <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">Joined</p><p className="font-medium">{new Date(viewingUser.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
            </div>
            <h3 className="font-semibold mb-3">Recent Transactions</h3>
            {userTransactions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className={`font-semibold text-sm ${tx.type === 'credit' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>{tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No transactions</p>}
          </div>
        </div>
      )}

      {/* Reply Ticket Modal */}
      {replyingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setReplyingTicket(null)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Reply to Ticket</h2>
            <p className="text-sm text-muted-foreground mb-4">"{replyingTicket.subject}"</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Status</label>
                <select value={ticketStatus} onChange={e => setTicketStatus(e.target.value)} className="input-field w-full">
                  <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Reply</label>
                <textarea value={ticketReply} onChange={e => setTicketReply(e.target.value)} className="input-field w-full" rows={4} placeholder="Type your reply..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setReplyingTicket(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted">Cancel</button>
                <button onClick={handleReplyTicket} disabled={savingReply} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  {savingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowMessageModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Send Message</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={messageForm.is_broadcast} onChange={e => setMessageForm(p => ({ ...p, is_broadcast: e.target.checked }))} className="w-4 h-4 rounded border-input accent-primary" />
                <span className="text-sm font-medium">Broadcast to all users</span>
              </label>
              {!messageForm.is_broadcast && (
                <div><label className="block text-sm font-medium mb-1.5">Recipient</label>
                  <select value={messageForm.recipient_user_id} onChange={e => setMessageForm(p => ({ ...p, recipient_user_id: e.target.value }))} className="input-field w-full">
                    <option value="">Select user...</option>
                    {profiles.map(p => <option key={p.user_id} value={p.user_id}>{p.first_name} {p.last_name} ({p.business_name})</option>)}
                  </select>
                </div>
              )}
              <div><label className="block text-sm font-medium mb-1.5">Subject</label>
                <input value={messageForm.subject} onChange={e => setMessageForm(p => ({ ...p, subject: e.target.value }))} className="input-field w-full" placeholder="Message subject" />
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Message</label>
                <textarea value={messageForm.message} onChange={e => setMessageForm(p => ({ ...p, message: e.target.value }))} className="input-field w-full" rows={4} placeholder="Type your message..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowMessageModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted">Cancel</button>
                <button onClick={handleSendMessage} disabled={sendingMessage} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
