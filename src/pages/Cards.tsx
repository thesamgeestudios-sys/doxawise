import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { CreditCard, Plus, Loader2, Shield, Eye, EyeOff, Ban, Play, Trash2, DollarSign, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { formatNaira } from '@/lib/constants';

interface VirtualCard {
  id: string;
  card_id: string;
  masked_pan: string;
  cvv: string;
  expiration: string;
  card_type: string;
  name_on_card: string;
  currency: string;
  amount: number;
  status: string;
}

interface TokenizedCard {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  is_default: boolean;
}

const Cards = () => {
  const { user } = useAuth();
  const [tokenizedCards, setTokenizedCards] = useState<TokenizedCard[]>([]);
  const [virtualCards, setVirtualCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'virtual' | 'tokenized'>('virtual');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [cardCurrency, setCardCurrency] = useState<'NGN' | 'USD'>('NGN');
  
  const [fundingCard, setFundingCard] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState('');
  const [processingFund, setProcessingFund] = useState(false);
  const [revealedCvv, setRevealedCvv] = useState<Set<string>>(new Set());
  
  const [showAddTokenized, setShowAddTokenized] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [saving, setSaving] = useState(false);
  const [flwRef, setFlwRef] = useState('');
  const [cardForm, setCardForm] = useState({ card_number: '', cvv: '', expiry_month: '', expiry_year: '', otp: '' });

  useEffect(() => { if (user) loadAllCards(); }, [user]);

  const loadAllCards = async () => {
    setLoading(true);
    const [tokenRes, virtualRes] = await Promise.all([
      supabase.from('tokenized_cards').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('virtual_cards').select('*').eq('user_id', user!.id).neq('status', 'terminated').order('created_at', { ascending: false }),
    ]);
    if (tokenRes.data) setTokenizedCards(tokenRes.data as TokenizedCard[]);
    if (virtualRes.data) setVirtualCards(virtualRes.data as VirtualCard[]);
    setLoading(false);
  };

  const handleCreateVirtualCard = async () => {
    setCreatingCard(true);
    try {
      const result = await flutterwaveApi.createVirtualCard({
        amount: parseFloat(fundAmount) || 0,
        currency: cardCurrency,
      });
      if (result.success) {
        toast.success(`${cardCurrency} virtual card created!`);
        setShowCreateModal(false);
        setFundAmount('');
        loadAllCards();
      } else {
        toast.error(result.message || result.details || 'Failed to create virtual card');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setCreatingCard(false);
  };

  const handleFundCard = async () => {
    if (!fundingCard || !fundingAmount) return;
    setProcessingFund(true);
    try {
      const result = await flutterwaveApi.fundVirtualCard(fundingCard, parseFloat(fundingAmount));
      if (result.success) { toast.success('Card funded!'); setFundingCard(null); setFundingAmount(''); loadAllCards(); }
      else toast.error(result.message || 'Failed to fund card');
    } catch (err: any) { toast.error(err.message); }
    setProcessingFund(false);
  };

  const handleBlockCard = async (cardId: string, currentStatus: string) => {
    try {
      const result = currentStatus === 'active' ? await flutterwaveApi.blockVirtualCard(cardId) : await flutterwaveApi.unblockVirtualCard(cardId);
      if (result.success) { toast.success(`Card ${currentStatus === 'active' ? 'blocked' : 'unblocked'}`); loadAllCards(); }
      else toast.error(result.message || 'Action failed');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleTerminateCard = async (cardId: string) => {
    if (!confirm('Are you sure? This action is irreversible.')) return;
    try {
      const result = await flutterwaveApi.terminateVirtualCard(cardId);
      if (result.success) { toast.success('Card terminated'); loadAllCards(); }
      else toast.error(result.message || 'Failed to terminate');
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleCvv = (id: string) => {
    setRevealedCvv(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await flutterwaveApi.tokenizeCard({
        action: 'initialize', card_number: cardForm.card_number.replace(/\s/g, ''),
        cvv: cardForm.cvv, expiry_month: cardForm.expiry_month, expiry_year: cardForm.expiry_year, amount: 50,
      });
      if (result.success && result.data) {
        setFlwRef(result.data.flw_ref || '');
        setStep('otp');
        toast.info('Enter the OTP sent to your phone/email');
      } else toast.error(result.message || 'Card charge failed');
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleValidateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await flutterwaveApi.tokenizeCard({ action: 'validate', flw_ref: flwRef, otp: cardForm.otp });
      if (result.success) { toast.success('Card added!'); setShowAddTokenized(false); resetTokenizedForm(); loadAllCards(); }
      else toast.error(result.message || 'OTP validation failed');
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const resetTokenizedForm = () => { setCardForm({ card_number: '', cvv: '', expiry_month: '', expiry_year: '', otp: '' }); setStep('form'); setFlwRef(''); };

  const removeTokenizedCard = async (id: string) => {
    const { error } = await supabase.from('tokenized_cards').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Card removed'); setTokenizedCards(prev => prev.filter(c => c.id !== id)); }
  };

  const setDefault = async (id: string) => {
    await supabase.from('tokenized_cards').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('tokenized_cards').update({ is_default: true }).eq('id', id);
    setTokenizedCards(prev => prev.map(c => ({ ...c, is_default: c.id === id })));
    toast.success('Default card updated');
  };

  const statusColor = (status: string) => {
    if (status === 'active') return 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]';
    if (status === 'blocked') return 'bg-destructive/10 text-destructive';
    return 'bg-muted text-muted-foreground';
  };

  const currencySymbol = (c: string) => c === 'USD' ? '$' : '₦';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 section-reveal">
          <div>
            <h1 className="text-2xl font-bold">Cards</h1>
            <p className="text-muted-foreground">Virtual cards & tokenized payment cards</p>
          </div>
        </div>

        <div className="flex bg-muted rounded-lg p-0.5 w-fit section-reveal stagger-1">
          <button onClick={() => setActiveTab('virtual')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'virtual' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            Virtual Cards
          </button>
          <button onClick={() => setActiveTab('tokenized')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'tokenized' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            Saved Cards
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : activeTab === 'virtual' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowCreateModal(true)} className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium">
                <Plus className="w-4 h-4" /> Create Virtual Card
              </button>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium mb-1">Virtual Cards</p>
                <p className="text-muted-foreground">Create NGN or USD virtual cards for online payments. Fund them from your wallet. <strong>Note:</strong> IP whitelisting may be required in your payment provider dashboard for virtual card creation.</p>
              </div>
            </div>

            {virtualCards.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {virtualCards.map(card => (
                  <div key={card.id} className={`card-elevated p-5 relative overflow-hidden ${card.currency === 'USD' ? 'border-l-4 border-l-[hsl(var(--info))]' : 'border-l-4 border-l-[hsl(var(--success))]'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/4" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-8 h-8 text-primary" />
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted">{card.currency}</span>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor(card.status)}`}>{card.status}</span>
                      </div>
                      <p className="font-mono text-lg font-bold tracking-wider mb-1">{card.masked_pan}</p>
                      <p className="text-sm text-muted-foreground">{card.name_on_card}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Expires</p>
                          <p className="font-medium">{card.expiration}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CVV</p>
                          <button onClick={() => toggleCvv(card.id)} className="font-medium flex items-center gap-1">
                            {revealedCvv.has(card.id) ? card.cvv : '•••'}
                            {revealedCvv.has(card.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-xs text-muted-foreground">Balance</p>
                          <p className="font-bold text-primary">{currencySymbol(card.currency)}{card.amount?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <button onClick={() => setFundingCard(card.card_id)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1"><DollarSign className="w-3 h-3" /> Fund</button>
                        <button onClick={() => handleBlockCard(card.card_id, card.status)} className="text-xs font-medium text-[hsl(var(--warning))] hover:underline flex items-center gap-1">
                          {card.status === 'active' ? <><Ban className="w-3 h-3" /> Block</> : <><Play className="w-3 h-3" /> Unblock</>}
                        </button>
                        <button onClick={() => handleTerminateCard(card.card_id)} className="text-xs font-medium text-destructive hover:underline ml-auto flex items-center gap-1"><Trash2 className="w-3 h-3" /> Terminate</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-elevated p-12 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No virtual cards</p>
                <p className="text-sm mt-1">Create a virtual card for online payments</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium" onClick={() => { resetTokenizedForm(); setShowAddTokenized(true); }}>
                <Plus className="w-4 h-4" /> Add Card
              </button>
            </div>
            {tokenizedCards.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {tokenizedCards.map(card => (
                  <div key={card.id} className={`card-elevated p-5 relative ${card.is_default ? 'ring-2 ring-primary' : ''}`}>
                    {card.is_default && <span className="badge-success absolute top-4 right-4">Default</span>}
                    <CreditCard className="w-8 h-8 text-primary mb-3" />
                    <p className="font-mono text-lg font-bold">•••• •••• •••• {card.last4}</p>
                    <p className="text-sm text-muted-foreground mt-1">{card.brand} • Expires {card.expiry}</p>
                    <div className="flex gap-2 mt-4">
                      {!card.is_default && <button onClick={() => setDefault(card.id)} className="text-xs font-medium text-primary hover:underline">Set as default</button>}
                      <button onClick={() => removeTokenizedCard(card.id)} className="text-xs font-medium text-destructive hover:underline ml-auto">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-elevated p-12 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No saved cards</p>
                <p className="text-sm mt-1">Add a card for automatic payment fallback</p>
              </div>
            )}
          </div>
        )}

        {/* Create Virtual Card Modal with Currency Selection */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowCreateModal(false)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Create Virtual Card</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Card Currency</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setCardCurrency('NGN')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${cardCurrency === 'NGN' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <Banknote className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--success))]" />
                      <p className="font-semibold">Naira (₦)</p>
                      <p className="text-xs text-muted-foreground mt-1">Nigerian Naira card</p>
                    </button>
                    <button type="button" onClick={() => setCardCurrency('USD')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${cardCurrency === 'USD' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--info))]" />
                      <p className="font-semibold">Dollar ($)</p>
                      <p className="text-xs text-muted-foreground mt-1">US Dollar card</p>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Initial Fund Amount ({currencySymbol(cardCurrency)}) — optional</label>
                  <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} className="input-field w-full" placeholder="0" min={0} />
                  <p className="text-xs text-muted-foreground mt-1">You can fund the card later as well. Funds are deducted from your wallet.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button onClick={handleCreateVirtualCard} disabled={creatingCard} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    {creatingCard ? <Loader2 className="w-4 h-4 animate-spin" /> : `Create ${cardCurrency} Card`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fund Virtual Card Modal */}
        {fundingCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setFundingCard(null)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Fund Virtual Card</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount (₦)</label>
                  <input type="number" value={fundingAmount} onChange={e => setFundingAmount(e.target.value)} className="input-field w-full" placeholder="1000" min={100} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setFundingCard(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button onClick={handleFundCard} disabled={processingFund} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    {processingFund ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fund Card'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Tokenized Card Modal */}
        {showAddTokenized && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowAddTokenized(false)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">{step === 'form' ? 'Add Payment Card' : 'Enter OTP'}</h2>
              {step === 'form' ? (
                <form onSubmit={handleInitialize} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Card Number</label>
                    <input value={cardForm.card_number} onChange={e => setCardForm(p => ({ ...p, card_number: e.target.value }))} required maxLength={19} className="input-field w-full" placeholder="5399 8383 8383 8381" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Month</label>
                      <input value={cardForm.expiry_month} onChange={e => setCardForm(p => ({ ...p, expiry_month: e.target.value }))} required maxLength={2} className="input-field w-full" placeholder="09" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Year</label>
                      <input value={cardForm.expiry_year} onChange={e => setCardForm(p => ({ ...p, expiry_year: e.target.value }))} required maxLength={2} className="input-field w-full" placeholder="32" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">CVV</label>
                      <input value={cardForm.cvv} onChange={e => setCardForm(p => ({ ...p, cvv: e.target.value }))} required maxLength={4} className="input-field w-full" placeholder="470" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">A ₦50 verification charge will be applied and refunded.</p>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddTokenized(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleValidateOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">OTP</label>
                    <input value={cardForm.otp} onChange={e => setCardForm(p => ({ ...p, otp: e.target.value }))} required className="input-field w-full" placeholder="123456" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep('form')} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted">Back</button>
                    <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Cards;
