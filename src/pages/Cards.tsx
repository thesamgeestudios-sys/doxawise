import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { flutterwaveApi } from '@/lib/flutterwave';
import { CreditCard, Plus, Trash2, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Card {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  is_default: boolean;
}

const Cards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [saving, setSaving] = useState(false);
  const [flwRef, setFlwRef] = useState('');
  const [cardForm, setCardForm] = useState({ card_number: '', cvv: '', expiry_month: '', expiry_year: '', otp: '' });

  useEffect(() => {
    if (user) loadCards();
  }, [user]);

  const loadCards = async () => {
    setLoading(true);
    const { data } = await supabase.from('tokenized_cards').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setCards(data as Card[]);
    setLoading(false);
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await flutterwaveApi.tokenizeCard({
        action: 'initialize',
        card_number: cardForm.card_number.replace(/\s/g, ''),
        cvv: cardForm.cvv,
        expiry_month: cardForm.expiry_month,
        expiry_year: cardForm.expiry_year,
        amount: 50,
      });

      if (result.success && result.data) {
        if (result.meta?.authorization?.mode === 'otp' || result.data.chargeResponseCode === '02') {
          setFlwRef(result.data.flw_ref);
          setStep('otp');
          toast.info('Enter the OTP sent to your phone/email');
        } else if (result.data.card?.token) {
          toast.success('Card tokenized!');
          setShowAddModal(false);
          resetForm();
          loadCards();
        } else {
          setFlwRef(result.data.flw_ref || '');
          setStep('otp');
          toast.info('Enter OTP to complete verification');
        }
      } else {
        toast.error(result.message || 'Card charge failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const handleValidateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await flutterwaveApi.tokenizeCard({
        action: 'validate',
        flw_ref: flwRef,
        otp: cardForm.otp,
      });

      if (result.success) {
        toast.success('Card added successfully!');
        setShowAddModal(false);
        resetForm();
        loadCards();
      } else {
        toast.error(result.message || 'OTP validation failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const resetForm = () => {
    setCardForm({ card_number: '', cvv: '', expiry_month: '', expiry_year: '', otp: '' });
    setStep('form');
    setFlwRef('');
  };

  const removeCard = async (id: string) => {
    const { error } = await supabase.from('tokenized_cards').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Card removed');
      setCards(prev => prev.filter(c => c.id !== id));
    }
  };

  const setDefault = async (id: string) => {
    await supabase.from('tokenized_cards').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('tokenized_cards').update({ is_default: true }).eq('id', id);
    setCards(prev => prev.map(c => ({ ...c, is_default: c.id === id })));
    toast.success('Default card updated');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 section-reveal">
          <div>
            <h1 className="text-2xl font-bold">Saved Cards</h1>
            <p className="text-muted-foreground">Manage tokenized cards for automatic payment fallback</p>
          </div>
          <button className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm section-reveal stagger-1 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium mb-1">Secure Card Tokenization</p>
            <p className="text-muted-foreground">Cards are securely tokenized via Flutterwave. We never store full card details. A small ₦50 verification charge may apply and will be refunded.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : cards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 section-reveal stagger-2">
            {cards.map(card => (
              <div key={card.id} className={`card-elevated p-5 relative ${card.is_default ? 'ring-2 ring-primary' : ''}`}>
                {card.is_default && <span className="badge-success absolute top-4 right-4">Default</span>}
                <CreditCard className="w-8 h-8 text-primary mb-3" />
                <p className="font-mono text-lg font-bold">•••• •••• •••• {card.last4}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.brand} • Expires {card.expiry}</p>
                <div className="flex gap-2 mt-4">
                  {!card.is_default && (
                    <button onClick={() => setDefault(card.id)} className="text-xs font-medium text-primary hover:underline">Set as default</button>
                  )}
                  <button onClick={() => removeCard(card.id)} className="text-xs font-medium text-destructive hover:underline ml-auto">Remove</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-elevated p-12 text-center text-muted-foreground section-reveal stagger-2">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No cards added</p>
            <p className="text-sm mt-1">Add a card to enable automatic payment fallback</p>
          </div>
        )}

        {/* Add Card Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowAddModal(false)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">{step === 'form' ? 'Add Card' : 'Verify OTP'}</h2>

              {step === 'form' ? (
                <form onSubmit={handleInitialize} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Card Number</label>
                    <input
                      value={cardForm.card_number}
                      onChange={e => setCardForm(p => ({ ...p, card_number: e.target.value }))}
                      required maxLength={19} placeholder="5531 8866 5214 2950"
                      className="input-field w-full font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Month</label>
                      <input value={cardForm.expiry_month} onChange={e => setCardForm(p => ({ ...p, expiry_month: e.target.value }))} required maxLength={2} placeholder="09" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Year</label>
                      <input value={cardForm.expiry_year} onChange={e => setCardForm(p => ({ ...p, expiry_year: e.target.value }))} required maxLength={2} placeholder="32" className="input-field w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">CVV</label>
                      <input type="password" value={cardForm.cvv} onChange={e => setCardForm(p => ({ ...p, cvv: e.target.value }))} required maxLength={4} placeholder="•••" className="input-field w-full" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">A ₦50 verification charge will be applied and may be refunded.</p>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tokenize Card'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleValidateOtp} className="space-y-4">
                  <p className="text-sm text-muted-foreground">Enter the OTP sent to your phone or email to complete card verification.</p>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">OTP</label>
                    <input value={cardForm.otp} onChange={e => setCardForm(p => ({ ...p, otp: e.target.value }))} required maxLength={6} placeholder="123456" className="input-field w-full text-center text-lg font-mono tracking-widest" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep('form')} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Back</button>
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
