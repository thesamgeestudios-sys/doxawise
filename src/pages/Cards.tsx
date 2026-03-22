import DashboardLayout from '@/components/DashboardLayout';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Card {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
}

const Cards = () => {
  const [cards, setCards] = useState<Card[]>([]);

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    toast.success('Card removed');
  };

  const setDefault = (id: string) => {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
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
          <button className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium" onClick={() => toast.info('Card tokenization requires Flutterwave integration')}>
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm section-reveal stagger-1">
          <p className="font-medium mb-1">Automatic Card Charging</p>
          <p className="text-muted-foreground">When your wallet balance is insufficient for scheduled payments, your default card will be charged automatically. Cards are securely tokenized via Flutterwave — we never store full card details.</p>
        </div>

        {cards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 section-reveal stagger-2">
            {cards.map(card => (
              <div key={card.id} className={`card-elevated p-5 relative ${card.isDefault ? 'ring-2 ring-primary' : ''}`}>
                {card.isDefault && <span className="badge-success absolute top-4 right-4">Default</span>}
                <CreditCard className="w-8 h-8 text-primary mb-3" />
                <p className="font-mono text-lg font-bold">•••• •••• •••• {card.last4}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.brand} • Expires {card.expiry}</p>
                <div className="flex gap-2 mt-4">
                  {!card.isDefault && (
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
      </div>
    </DashboardLayout>
  );
};

export default Cards;
