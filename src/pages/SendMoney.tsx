import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { formatNaira, calculateFee } from '@/lib/constants';
import { Send, Search, Loader2, CheckCircle, UserCheck, AlertCircle, Banknote, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { generateReceiptFiles } from '@/lib/receiptGenerator';

interface Bank { code: string; name: string; }

const SendMoney = () => {
  const { user } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [sending, setSending] = useState(false);
  const [banksError, setBanksError] = useState(false);
  const [form, setForm] = useState({ recipientName: '', bankCode: '', bankName: '', accountNumber: '', amount: '', narration: '' });

  useEffect(() => { loadBanks(); }, []);

  const loadBanks = async () => {
    setBanksError(false);
    try {
      const result = await flutterwaveApi.getBanks();
      if (result.success && result.banks) setBanks(result.banks);
      else setBanksError(true);
    } catch { setBanksError(true); }
  };

  const filteredBanks = banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));

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
      } else setResolveError(result.fallback ? 'Account lookup is temporarily unavailable. Please try again shortly.' : result.message || 'Could not resolve account');
    } catch (err) { setResolveError(err instanceof Error ? err.message : 'Could not resolve account'); }
    setResolvingAccount(false);
  }, []);

  useEffect(() => {
    if (form.accountNumber.length === 10 && form.bankCode) resolveAccount(form.accountNumber, form.bankCode);
    else { setResolvedName(''); setResolveError(''); }
  }, [form.accountNumber, form.bankCode, resolveAccount]);

  const selectBank = (bank: Bank) => {
    setForm(p => ({ ...p, bankCode: bank.code, bankName: bank.name }));
    setBankSearch(bank.name);
    setShowBankDropdown(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount < 100) { toast.error('Minimum amount is ₦100'); return; }

    setSending(true);
    try {
      const result = await flutterwaveApi.processTransfer({
        account_bank: form.bankCode,
        account_number: form.accountNumber,
        amount,
        currency: 'NGN',
        reference: `DXW-SEND-${Date.now()}`,
        recipient_name: form.recipientName,
        narration: form.narration || `Transfer to ${form.recipientName}`,
      });
      if (result.success) {
        if (result.transaction) {
          generateReceiptFiles(result.transaction).then(files => {
            flutterwaveApi.storeReceipt({ transaction_id: result.transaction.id, receipt_pdf_url: files.receipt_pdf_url, receipt_image_url: files.receipt_image_url });
          }).catch(() => undefined);
        }
        toast.success(`${formatNaira(amount)} sent to ${form.recipientName} successfully!`);
        setForm({ recipientName: '', bankCode: '', bankName: '', accountNumber: '', amount: '', narration: '' });
        setBankSearch('');
        setResolvedName('');
      } else {
        toast.error(result.message || 'Transfer failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed');
    }
    setSending(false);
  };

  const amount = parseFloat(form.amount) || 0;
  const fee = calculateFee(amount);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="section-reveal">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Banknote className="w-6 h-6 text-primary" /> Send Money</h1>
          <p className="text-muted-foreground">Instant transfer to any Nigerian bank account</p>
        </div>

        {banksError && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 section-reveal">
            <WifiOff className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Payment service temporarily unavailable</p>
              <p className="text-muted-foreground mt-1">We're unable to connect to our payment provider right now. Please try again in a few minutes. If the issue persists, contact support.</p>
              <button onClick={loadBanks} className="mt-2 text-primary text-sm font-medium hover:underline">Retry connection</button>
            </div>
          </div>
        )}

        <div className="bg-[hsl(var(--info))]/5 border border-[hsl(var(--info))]/20 rounded-xl p-4 flex items-start gap-3 section-reveal stagger-1">
          <AlertCircle className="w-5 h-5 text-[hsl(var(--info))] mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Transfer Info</p>
            <p className="text-muted-foreground mt-1">Transfers are deducted from your wallet balance. Fee: 0.3% (max ₦1,000). Transfers without BVN verification are limited to ₦50,000.</p>
          </div>
        </div>

        <div className="card-elevated p-6 max-w-lg section-reveal stagger-2">
          <form onSubmit={handleSend} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-1.5">Bank</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={bankSearch} onChange={e => { setBankSearch(e.target.value); setShowBankDropdown(true); setForm(p => ({ ...p, bankCode: '', bankName: '' })); }}
                  onFocus={() => setShowBankDropdown(true)} required={!form.bankCode} className="input-field w-full pl-10" placeholder="Search for a bank..." autoComplete="off" />
              </div>
              {showBankDropdown && filteredBanks.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredBanks.map(b => (
                    <button key={b.code} type="button" onClick={() => selectBank(b)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors">{b.name}</button>
                  ))}
                </div>
              )}
              {form.bankCode && <p className="text-xs text-[hsl(var(--success))] mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {form.bankName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Account Number</label>
              <input value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, '') }))} required maxLength={10} className="input-field w-full" placeholder="0123456789" />
              {resolvingAccount && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Resolving account...</p>}
              {resolvedName && <p className="text-xs text-[hsl(var(--success))] mt-1 flex items-center gap-1 font-medium"><UserCheck className="w-3 h-3" /> {resolvedName}</p>}
              {resolveError && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {resolveError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Recipient Name</label>
              <input value={form.recipientName} onChange={e => setForm(p => ({ ...p, recipientName: e.target.value }))} required className="input-field w-full" placeholder="Auto-filled from account" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Amount (₦)</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min={100} className="input-field w-full" placeholder="50000" />
              {amount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Fee: {formatNaira(fee)} • Total debit: {formatNaira(amount + fee)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Narration (optional)</label>
              <input value={form.narration} onChange={e => setForm(p => ({ ...p, narration: e.target.value }))} className="input-field w-full" placeholder="Payment for..." />
            </div>

            <button type="submit" disabled={sending || !form.bankCode || !form.accountNumber || !form.recipientName || !form.amount || banksError}
              className="w-full btn-gradient py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send {amount > 0 ? formatNaira(amount) : 'Money'}</>}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SendMoney;
