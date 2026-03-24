import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { CreditCard, Plus, Calendar, AlertCircle, Send, Loader2, CheckCircle, XCircle, Clock, Search, UserCheck } from 'lucide-react';
import { formatNaira, calculateFee } from '@/lib/constants';
import { toast } from 'sonner';

interface Payment {
  id: string;
  recipient_name: string;
  bank_name: string;
  account_number: string;
  amount: number;
  fee: number;
  scheduled_date: string;
  status: string;
  failure_reason: string | null;
}

interface Bank {
  code: string;
  name: string;
}

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const [form, setForm] = useState({ recipientName: '', bankCode: '', bankName: '', accountNumber: '', amount: '', scheduledDate: '' });

  useEffect(() => {
    if (user) {
      loadPayments();
      loadBanks();
    }
  }, [user]);

  const loadPayments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('scheduled_payments')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setPayments(data as Payment[]);
    setLoading(false);
  };

  const loadBanks = async () => {
    try {
      const result = await flutterwaveApi.getBanks();
      if (result.success && result.banks) setBanks(result.banks);
    } catch (err) {
      console.error('Failed to load banks:', err);
    }
  };

  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const resolveAccount = useCallback(async (accountNumber: string, bankCode: string) => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setResolvingAccount(true);
    setResolvedName('');
    try {
      const result = await flutterwaveApi.resolveAccount(accountNumber, bankCode);
      if (result.success && result.data?.account_name) {
        setResolvedName(result.data.account_name);
        setForm(p => ({ ...p, recipientName: result.data.account_name }));
      }
    } catch (err) {
      console.error('Account resolve failed:', err);
    }
    setResolvingAccount(false);
  }, []);

  useEffect(() => {
    if (form.accountNumber.length === 10 && form.bankCode) {
      resolveAccount(form.accountNumber, form.bankCode);
    } else {
      setResolvedName('');
    }
  }, [form.accountNumber, form.bankCode, resolveAccount]);

  const selectBank = (bank: Bank) => {
    setForm(p => ({ ...p, bankCode: bank.code, bankName: bank.name }));
    setBankSearch(bank.name);
    setShowBankDropdown(false);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const amount = parseFloat(form.amount);
    const fee = calculateFee(amount);

    const { error } = await supabase.from('scheduled_payments').insert({
      user_id: user!.id,
      recipient_name: form.recipientName,
      bank_name: form.bankName || form.bankCode,
      account_number: form.accountNumber,
      amount,
      fee,
      scheduled_date: form.scheduledDate,
      status: 'pending',
    });

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Payment of ${formatNaira(amount)} scheduled`);
      setForm({ recipientName: '', bankCode: '', bankName: '', accountNumber: '', amount: '', scheduledDate: '' });
      setBankSearch('');
      setResolvedName('');
      setShowScheduleModal(false);
      loadPayments();
    }
  };

  const processPayment = async (payment: Payment) => {
    setProcessing(payment.id);
    const bankObj = banks.find(b => b.name === payment.bank_name);

    try {
      const result = await flutterwaveApi.initiateTransfer({
        account_bank: bankObj?.code || payment.bank_name,
        account_number: payment.account_number,
        amount: payment.amount,
        recipient_name: payment.recipient_name,
        payment_id: payment.id,
      });

      if (result.success) {
        toast.success('Payment processed successfully!');
        loadPayments();
      } else {
        toast.error(result.message || 'Transfer failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setProcessing(null);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-[hsl(var(--warning))]" />;
    }
  };

  const statusStyles: Record<string, string> = {
    pending: 'badge-warning',
    completed: 'badge-success',
    failed: 'bg-destructive/10 text-destructive text-xs font-medium px-2.5 py-1 rounded-full',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 section-reveal">
          <div>
            <h1 className="text-2xl font-bold">Payment Scheduling</h1>
            <p className="text-muted-foreground">Schedule single or batch payments</p>
          </div>
          <button onClick={() => setShowScheduleModal(true)} className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" />
            Schedule Payment
          </button>
        </div>

        <div className="bg-[hsl(var(--info))]/5 border border-[hsl(var(--info))]/20 rounded-xl p-4 flex items-start gap-3 section-reveal stagger-1">
          <AlertCircle className="w-5 h-5 text-[hsl(var(--info))] mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">How payments work</p>
            <p className="text-muted-foreground mt-1">
              Scheduled payments are deducted from your wallet balance. A fee of 0.3% (max ₦1,000) applies per transfer. Click "Process" on any pending payment to execute it.
            </p>
          </div>
        </div>

        <div className="card-elevated overflow-hidden section-reveal stagger-2">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Recipient</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden sm:table-cell">Bank</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Amount</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden sm:table-cell">Fee</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Date</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium">{p.recipient_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.account_number}</p>
                      </td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.bank_name}</td>
                      <td className="p-4 text-right font-medium tabular-nums">{formatNaira(p.amount)}</td>
                      <td className="p-4 text-right text-sm text-muted-foreground tabular-nums hidden sm:table-cell">{formatNaira(p.fee)}</td>
                      <td className="p-4 text-sm hidden md:table-cell">{p.scheduled_date}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 ${statusStyles[p.status] || statusStyles.pending}`}>
                          {statusIcon(p.status)} {p.status}
                        </span>
                        {p.failure_reason && <p className="text-xs text-destructive mt-1">{p.failure_reason}</p>}
                      </td>
                      <td className="p-4 text-right">
                        {p.status === 'pending' && (
                          <button
                            onClick={() => processPayment(p)}
                            disabled={processing === p.id}
                            className="btn-primary px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5"
                          >
                            {processing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Process
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No payments scheduled</p>
              <p className="text-sm mt-1">Schedule your first payment to get started</p>
            </div>
          )}
        </div>

        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowScheduleModal(false)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Schedule Payment</h2>
              <form onSubmit={handleSchedule} className="space-y-4">
                {/* Bank with search */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-1.5">Bank</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={bankSearch}
                      onChange={e => { setBankSearch(e.target.value); setShowBankDropdown(true); setForm(p => ({ ...p, bankCode: '', bankName: '' })); }}
                      onFocus={() => setShowBankDropdown(true)}
                      required={!form.bankCode}
                      className="input-field w-full pl-10"
                      placeholder="Search for a bank..."
                      autoComplete="off"
                    />
                  </div>
                  {showBankDropdown && filteredBanks.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredBanks.map(b => (
                        <button key={b.code} type="button" onClick={() => selectBank(b)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors">
                          {b.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {form.bankCode && (
                    <p className="text-xs text-[hsl(var(--success))] mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {form.bankName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Account Number</label>
                  <input value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, '') }))} required maxLength={10} className="input-field w-full" placeholder="0123456789" />
                  {resolvingAccount && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Resolving account...</p>
                  )}
                  {resolvedName && (
                    <p className="text-xs text-[hsl(var(--success))] mt-1 flex items-center gap-1 font-medium">
                      <UserCheck className="w-3 h-3" /> {resolvedName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Recipient Name</label>
                  <input value={form.recipientName} onChange={e => setForm(p => ({ ...p, recipientName: e.target.value }))} required className="input-field w-full" placeholder="Auto-filled from account" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount (₦)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min={100} className="input-field w-full" placeholder="50000" />
                  {form.amount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Fee: {formatNaira(calculateFee(parseFloat(form.amount) || 0))} • Total: {formatNaira((parseFloat(form.amount) || 0) + calculateFee(parseFloat(form.amount) || 0))}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Scheduled Date</label>
                  <input type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} required className="input-field w-full" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowScheduleModal(false); setBankSearch(''); setResolvedName(''); }} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Schedule</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Payments;
