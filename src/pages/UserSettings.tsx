import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { Settings, Building2, Shield, Loader2, CheckCircle2, AlertTriangle, Lock, Save, User, Camera, MessageSquare, Send, HelpCircle, Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME, TRANSFER_LIMIT_NO_BVN, formatNaira } from '@/lib/constants';

const UserSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [bvnInput, setBvnInput] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'support' | 'messages'>('profile');
  
  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Support
  const [tickets, setTickets] = useState<any[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Messages
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => { if (user) { loadProfile(); loadTickets(); loadMessages(); } }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
    if (data) { setProfile(data); setEditName(data.business_name || ''); setBvnInput(data.bvn || ''); }
    setLoading(false);
  };

  const loadTickets = async () => {
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setTickets(data);
  };

  const loadMessages = async () => {
    const { data } = await supabase.from('admin_messages').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setMessages(data);
  };

  const handleVerifyBvn = async () => {
    const bvn = bvnInput || profile?.bvn;
    if (!bvn || bvn.length !== 11) { toast.error('Please enter a valid 11-digit BVN'); return; }
    if (bvn !== profile?.bvn) {
      await supabase.from('profiles').update({ bvn }).eq('user_id', user!.id);
    }
    setVerifying(true);
    try {
      const result = await flutterwaveApi.verifyBvn(bvn);
      if (result.success) { toast.success('BVN verified!'); loadProfile(); }
      else toast.error(result.message || 'Verification failed');
    } catch (err: any) { toast.error(err.message); }
    setVerifying(false);
  };

  const handleSaveBusinessName = async () => {
    if (profile?.business_name_locked) { toast.error('Business name is locked'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ business_name: editName }).eq('user_id', user!.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success('Business name updated'); loadProfile(); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from('profile-avatars').upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploadingAvatar(false); return; }

    const { data: urlData } = supabase.storage.from('profile-avatars').getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', user!.id);
    toast.success('Profile picture updated!');
    loadProfile();
    setUploadingAvatar(false);
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTicket(true);
    try {
      const result = await flutterwaveApi.createSupportTicket(ticketForm.subject, ticketForm.message);
      if (result.success) {
        toast.success('Support ticket submitted!');
        setTicketForm({ subject: '', message: '' });
        setShowNewTicket(false);
        loadTickets();
      } else toast.error(result.error || 'Failed to submit');
    } catch (err: any) { toast.error(err.message); }
    setSubmittingTicket(false);
  };

  const markMessageRead = async (id: string) => {
    await supabase.from('admin_messages').update({ is_read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  const initials = (profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '');
  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="section-reveal">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account, get help, and view messages</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-0.5 w-fit section-reveal stagger-1">
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            <User className="w-4 h-4 inline mr-1.5" /> Profile
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'support' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            <HelpCircle className="w-4 h-4 inline mr-1.5" /> Support
          </button>
          <button onClick={() => setActiveTab('messages')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${activeTab === 'messages' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            <Bell className="w-4 h-4 inline mr-1.5" /> Messages
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="card-elevated p-6 section-reveal stagger-1">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{initials || '?'}</div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-full bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{profile?.first_name} {profile?.last_name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{profile?.account_type} account</p>
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="card-elevated p-6 section-reveal stagger-2">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Business Information</h2>
              </div>
              {profile?.business_name_locked && (
                <div className="bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/30 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
                  <Lock className="w-4 h-4 text-[hsl(var(--warning))] shrink-0" />
                  <p className="text-muted-foreground">Your business name is <strong>permanently locked</strong> because a virtual account has been created.</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Business Name</label>
                  <div className="flex gap-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="input-field w-full" readOnly={profile?.business_name_locked} disabled={profile?.business_name_locked} />
                    {!profile?.business_name_locked && editName !== profile?.business_name && (
                      <button onClick={handleSaveBusinessName} disabled={saving} className="btn-primary px-3 rounded-lg flex items-center gap-1 text-sm shrink-0">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {!profile?.business_name_locked && <p className="text-xs text-[hsl(var(--warning))] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Locked once you create a virtual account</p>}
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
                  <label className="block text-sm font-medium mb-1.5">BVN</label>
                  <input value={bvnInput} onChange={e => setBvnInput(e.target.value.replace(/\D/g, ''))} className="input-field w-full" maxLength={11} placeholder="Enter 11-digit BVN" readOnly={profile?.bvn_verified} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">BVN Status</label>
                  <div className="input-field w-full flex items-center gap-2">
                    {profile?.bvn_verified ? (
                      <><CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" /><span className="text-sm font-medium text-[hsl(var(--success))]">Verified</span></>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
                        <span className="text-sm">Not verified — transfer limit: {formatNaira(TRANSFER_LIMIT_NO_BVN)}</span>
                        <button onClick={handleVerifyBvn} disabled={verifying} className="ml-auto text-xs btn-primary px-3 py-1 rounded-md font-medium flex items-center gap-1">
                          {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify Now'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {profile?.virtual_account_number && (
              <div className="card-elevated p-6 section-reveal stagger-3">
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

            <div className="card-elevated p-6 section-reveal stagger-4">
              <h2 className="text-lg font-semibold mb-4">Fee Structure</h2>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><span className="font-medium">Transfer Fee:</span> 0.3% of transaction amount</p>
                <p><span className="font-medium">Fee Cap:</span> ₦1,000 maximum per transaction</p>
                <p><span className="font-medium">Non-BVN Limit:</span> ₦50,000 per transaction</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-4 section-reveal">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Support Tickets</h2>
              <button onClick={() => setShowNewTicket(true)} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> New Ticket
              </button>
            </div>

            {tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="card-elevated p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.message}</p>
                        {ticket.admin_reply && (
                          <div className="mt-3 bg-primary/5 rounded-lg p-3 border-l-2 border-primary">
                            <p className="text-xs font-medium text-primary mb-1">Admin Reply:</p>
                            <p className="text-sm">{ticket.admin_reply}</p>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                        ticket.status === 'open' ? 'badge-warning' :
                        ticket.status === 'resolved' ? 'badge-success' : 'badge-info'
                      }`}>{ticket.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(ticket.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-elevated p-12 text-center text-muted-foreground">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No support tickets</p>
                <p className="text-sm mt-1">Need help? Create a new support ticket</p>
              </div>
            )}

            {showNewTicket && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowNewTicket(false)}>
                <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
                  <h2 className="text-xl font-bold mb-6">New Support Ticket</h2>
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Subject</label>
                      <input value={ticketForm.subject} onChange={e => setTicketForm(p => ({ ...p, subject: e.target.value }))} required className="input-field w-full" placeholder="Brief description of your issue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Message</label>
                      <textarea value={ticketForm.message} onChange={e => setTicketForm(p => ({ ...p, message: e.target.value }))} required className="input-field w-full" rows={5} placeholder="Describe your issue in detail..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowNewTicket(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted">Cancel</button>
                      <button type="submit" disabled={submittingTicket} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                        {submittingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-3 section-reveal">
            <h2 className="text-lg font-semibold">Messages from Admin</h2>
            {messages.length > 0 ? (
              messages.map(msg => (
                <div key={msg.id} className={`card-elevated p-4 ${!msg.is_read ? 'border-l-4 border-l-primary' : ''}`} onClick={() => !msg.is_read && markMessageRead(msg.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{msg.subject}</p>
                      <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                    </div>
                    {msg.is_broadcast && <span className="badge-info shrink-0">Broadcast</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(msg.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))
            ) : (
              <div className="card-elevated p-12 text-center text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No messages</p>
                <p className="text-sm mt-1">Admin messages will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserSettings;
