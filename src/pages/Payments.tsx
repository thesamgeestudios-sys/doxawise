import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { CreditCard, Plus, Calendar, AlertCircle, Send, Loader2, CheckCircle, XCircle, Clock, Search, UserCheck, Users, CheckSquare } from 'lucide-react';
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

interface StaffMember {
  id: string;
  full_name: string;
  bank_name: string;
  account_number: string;
  salary: number;
  pay_day: number;
}

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ recipientName: '', bankCode: '', bankName: '', accountNumber: '', amount: '', scheduledDate: '', scheduledTime: '09:00' });

  useEffect(() => {
    if (user) {
      loadPayments();
      loadBanks();
      loadStaff();
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

  const loadStaff = async () => {
    const { data } = await supabase.from('staff').select('*').eq('user_id', user!.id).eq('is_active', true);
    if (data) setStaffList(data as StaffMember[]);
  };

  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const resolveAccount = useCallback(async (accountNumber: string, bankCode: string) => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setResolvingAccount(true);
    setResolvedName('');
    setResolveError('');
    try {
      const result = await flutterwaveApi.resolveAccount(accountNumber, bankCode);
      if (result.success && result.data?.account_name) {
        setResolvedName(result.data.account_name);
        setForm(p => ({ ...p, recipientName: result.data.account_name }));
      } else setResolveError(result.message || 'Could not resolve account');
    } catch (err) {
      console.error('Account resolve failed:', err);
      setResolveError(err instanceof Error ? err.message : 'Could not resolve account');
    }
    setResolvingAccount(false);
  }, []);

  useEffect(() => {
    if (form.accountNumber.length === 10 && form.bankCode) {
      resolveAccount(form.accountNumber, form.bankCode);
    } else {
      setResolvedName('');
      setResolveError('');
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
      scheduled_date: `${form.scheduledDate}T${form.scheduledTime}`,
      status: 'pending',
    });

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Payment of ${formatNaira(amount)} scheduled`);
      setForm({ recipientName: '', bankCode: '', bankName: '', accountNumber: '', amount: '', scheduledDate: '', scheduledTime: '09:00' });
      setBankSearch('');
      setResolvedName('');
      setShowScheduleModal(false);
      loadPayments();
    }
  };

  const processPayment = async (payment: Payment) => {
    setProcessing(payment.id);
    const bankObj = banks.find(b => b.name === payment.bank_name);

      const reference = `DXW-SCH-${payment.id}-${Date.now()}`;
    try {
      const result = await flutterwaveApi.processTransfer({
        account_bank: bankObj?.code || payment.bank_name,
        account_number: payment.account_number,
        amount: payment.amount,
        currency: 'NGN',
        narration: `Scheduled salary payment to ${payment.recipient_name}`,
        reference,
        recipient_name: payment.recipient_name,
        payment_id: payment.id,
      });

      if (result.success) {
        toast.success('Payment submitted successfully. Status will update automatically.');
        loadPayments();
      } else {
        toast.error(result.message || 'Transfer failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed');
    }
    setProcessing(null);
  };

  const toggleStaffSelection = (id: string) => {
    setSelectedStaff(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllStaff = () => {
    if (selectedStaff.size === staffList.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(staffList.map(s => s.id)));
    }
  };

  const handleBatchPayment = async () => {
    if (selectedStaff.size === 0) {
      toast.error('Select at least one staff member');
      return;
    }

    setBatchProcessing(true);
    const selected = staffList.filter(s => selectedStaff.has(s.id));
    const transfers = selected.map(s => {
      const bankObj = banks.find(b => b.name === s.bank_name);
      return {
        account_bank: bankObj?.code || s.bank_name,
        account_number: s.account_number,
        amount: s.salary,
        recipient_name: s.full_name,
        staff_id: s.id,
      };
    });

    try {
      const result = await flutterwaveApi.batchTransfer(transfers);
      if (result.success) {
        const successCount = result.results?.filter((r: { status: string }) => r.status === 'success').length || 0;
        const failCount = result.results?.filter((r: { status: string }) => r.status === 'failed').length || 0;
        toast.success(`Batch payment complete: ${successCount} succeeded, ${failCount} failed`);
        setSelectedStaff(new Set());
        setShowBatchModal(false);
        loadPayments();
      } else {
        toast.error(result.error || 'Batch payment failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Batch payment failed');
    }
    setBatchProcessing(false);
  };

  const batchTotal = staffList
    .filter(s => selectedStaff.has(s.id))
    .reduce((sum, s) => sum + s.salary + calculateFee(s.salary), 0);

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
          <div className="flex gap-3">
            <button onClick={() => setShowBatchModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[hsl(var(--teal))] text-[hsl(var(--teal-foreground))] hover:opacity-90 transition-all">
              <Users className="w-4 h-4" />
              Batch Pay Staff
            </button>
            <button onClick={() => setShowScheduleModal(true)} className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />
              Schedule Payment
            </button>
          </div>
        </div>

        <div className="bg-[hsl(var(--info))]/5 border border-[hsl(var(--info))]/20 rounded-xl p-4 flex items-start gap-3 section-reveal stagger-1">
          <AlertCircle className="w-5 h-5 text-[hsl(var(--info))] mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">How payments work</p>
            <p className="text-muted-foreground mt-1">
              Payments are deducted from your wallet balance. A fee of 0.3% (max ₦1,000) applies per transfer. Use <strong>Batch Pay Staff</strong> to pay multiple staff at once.
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

        {/* Schedule Single Payment Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowScheduleModal(false)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Schedule Payment</h2>
              <form onSubmit={handleSchedule} className="space-y-4">
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
                  {resolveError && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {resolveError}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Date</label>
                    <input type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} required className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Time</label>
                    <input type="time" value={form.scheduledTime} onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))} required className="input-field w-full" />
                  </div>
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

        {/* Batch Payment Modal */}
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowBatchModal(false)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg p-6 section-reveal max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-2">Batch Pay Staff</h2>
              <p className="text-sm text-muted-foreground mb-6">Select staff members to pay their registered salaries in one click.</p>

              {staffList.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={selectAllStaff} className="text-sm text-primary font-medium flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4" />
                      {selectedStaff.size === staffList.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-sm text-muted-foreground">{selectedStaff.size} selected</span>
                  </div>

                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto mb-4">
                    {staffList.map(s => (
                      <label key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedStaff.has(s.id)}
                          onChange={() => toggleStaffSelection(s.id)}
                          className="w-4 h-4 rounded border-input accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.full_name}</p>
                          <p className="text-xs text-muted-foreground">{s.bank_name} • {s.account_number}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums">{formatNaira(s.salary)}</p>
                          <p className="text-xs text-muted-foreground">+ {formatNaira(calculateFee(s.salary))} fee</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedStaff.size > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total (incl. fees)</span>
                        <span className="font-bold text-lg">{formatNaira(batchTotal)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowBatchModal(false); setSelectedStaff(new Set()); }} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                    <button
                      onClick={handleBatchPayment}
                      disabled={batchProcessing || selectedStaff.size === 0}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-[hsl(var(--teal))] text-[hsl(var(--teal-foreground))] hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {batchProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Pay {selectedStaff.size} Staff</>}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No staff members</p>
                  <p className="text-sm mt-1">Add staff members first to use batch payments</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Payments;
