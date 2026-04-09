import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { flutterwaveApi } from '@/lib/flutterwave';
import { formatNaira } from '@/lib/constants';
import { Globe, Search, Loader2, Send, ArrowRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'EU', name: 'Europe (SEPA)', currency: 'EUR', flag: '🇪🇺' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', flag: '🇨🇲' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', flag: '🇨🇮' },
];

interface Bank { code: string; name: string; }

const InternationalPayments = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCountry, setSelectedCountry] = useState<typeof COUNTRIES[0] | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [sending, setSending] = useState(false);
  const [rateData, setRateData] = useState<any>(null);
  const [form, setForm] = useState({
    bankCode: '', bankName: '', accountNumber: '', beneficiaryName: '', amount: '', narration: ''
  });

  const selectCountry = async (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setStep(2);
    setLoadingBanks(true);
    setBanks([]);
    try {
      const result = await flutterwaveApi.getCountryBanks(country.code);
      if (result.success && result.banks) setBanks(result.banks.map((b: any) => ({ code: b.code || b.id, name: b.name })));
    } catch (err) {
      console.error('Failed to load banks:', err);
      toast.error('Could not load banks for this country');
    }
    setLoadingBanks(false);
  };

  const fetchRate = useCallback(async () => {
    if (!selectedCountry || !form.amount || parseFloat(form.amount) <= 0) return;
    setLoadingRates(true);
    try {
      const result = await flutterwaveApi.getTransferRates('NGN', selectedCountry.currency, parseFloat(form.amount));
      if (result.success) setRateData(result.data);
      else toast.error(result.message || 'Could not fetch rate');
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoadingRates(false);
  }, [selectedCountry, form.amount]);

  useEffect(() => {
    const timer = setTimeout(() => { if (form.amount && parseFloat(form.amount) > 0) fetchRate(); }, 800);
    return () => clearTimeout(timer);
  }, [form.amount, fetchRate]);

  const filteredBanks = banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry || !form.bankCode || !form.accountNumber || !form.amount) return;
    setSending(true);
    try {
      const result = await flutterwaveApi.internationalTransfer({
        account_bank: form.bankCode,
        account_number: form.accountNumber,
        amount: parseFloat(form.amount),
        currency: 'NGN',
        destination_currency: selectedCountry.currency,
        beneficiary_name: form.beneficiaryName,
        narration: form.narration,
      });
      if (result.success) {
        toast.success('International transfer initiated!');
        setStep(1);
        setSelectedCountry(null);
        setForm({ bankCode: '', bankName: '', accountNumber: '', beneficiaryName: '', amount: '', narration: '' });
        setRateData(null);
      } else {
        toast.error(result.message || 'Transfer failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setSending(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="section-reveal">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="w-6 h-6 text-[hsl(var(--teal))]" /> International Payments</h1>
          <p className="text-muted-foreground">Send money across borders with competitive rates</p>
        </div>

        <div className="bg-[hsl(var(--info))]/5 border border-[hsl(var(--info))]/20 rounded-xl p-4 flex items-start gap-3 section-reveal stagger-1">
          <AlertCircle className="w-5 h-5 text-[hsl(var(--info))] mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">How international transfers work</p>
            <p className="text-muted-foreground mt-1">Funds are debited from your NGN wallet at the current exchange rate. A fee of 0.3% (max ₦1,000) applies. Transfers typically arrive within 1-3 business days.</p>
          </div>
        </div>

        {/* Step 1: Select Country */}
        {step === 1 && (
          <div className="section-reveal stagger-2">
            <h2 className="text-lg font-semibold mb-4">Select destination country</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {COUNTRIES.map(c => (
                <button key={c.code} onClick={() => selectCountry(c)}
                  className="card-elevated p-4 text-center hover:border-primary/40 transition-all group">
                  <span className="text-3xl block mb-2">{c.flag}</span>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.currency}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Transfer Form */}
        {step >= 2 && selectedCountry && (
          <div className="card-elevated p-6 section-reveal stagger-2 max-w-lg">
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => { setStep(1); setSelectedCountry(null); setBanks([]); setRateData(null); }}
                className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
              <span className="text-2xl">{selectedCountry.flag}</span>
              <div>
                <p className="font-semibold">{selectedCountry.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCountry.currency}</p>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              {/* Bank selection */}
              <div className="relative">
                <label className="block text-sm font-medium mb-1.5">Bank</label>
                {loadingBanks ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading banks...</div>
                ) : banks.length > 0 ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input value={bankSearch} onChange={e => { setBankSearch(e.target.value); setShowBankDropdown(true); }}
                        onFocus={() => setShowBankDropdown(true)} required={!form.bankCode}
                        className="input-field w-full pl-10" placeholder="Search bank..." autoComplete="off" />
                    </div>
                    {showBankDropdown && filteredBanks.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredBanks.slice(0, 20).map(b => (
                          <button key={b.code} type="button" onClick={() => { setForm(p => ({ ...p, bankCode: b.code, bankName: b.name })); setBankSearch(b.name); setShowBankDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors">{b.name}</button>
                        ))}
                      </div>
                    )}
                    {form.bankCode && <p className="text-xs text-[hsl(var(--success))] mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {form.bankName}</p>}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No banks available for this country. Enter account details manually.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Account Number / IBAN</label>
                <input value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} required className="input-field w-full" placeholder="Enter account number" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Beneficiary Name</label>
                <input value={form.beneficiaryName} onChange={e => setForm(p => ({ ...p, beneficiaryName: e.target.value }))} required className="input-field w-full" placeholder="Recipient full name" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Amount ({selectedCountry.currency})</label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min={1} className="input-field w-full" placeholder="100" />
              </div>

              {/* Rate display */}
              {loadingRates && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Fetching exchange rate...</div>
              )}
              {rateData && !loadingRates && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Exchange Rate</span><span className="font-medium">{rateData.rate}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">You'll pay (NGN)</span><span className="font-bold text-lg">{formatNaira(rateData.source?.amount || 0)}</span></div>
                  <button type="button" onClick={fetchRate} className="text-xs text-primary flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Refresh rate</button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Narration (optional)</label>
                <input value={form.narration} onChange={e => setForm(p => ({ ...p, narration: e.target.value }))} className="input-field w-full" placeholder="Payment for..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setStep(1); setSelectedCountry(null); }} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={sending || !form.bankCode || !form.accountNumber || !form.amount}
                  className="flex-1 btn-gradient py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send {selectedCountry.currency}</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InternationalPayments;
