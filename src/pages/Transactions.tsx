import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { formatNaira } from '@/lib/constants';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  created_at: string;
  balance_after: number | null;
}

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setTransactions(data as Transaction[]);
    setLoading(false);
  };

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const exportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Amount', 'Description', 'Reference', 'Balance After'],
      ...filtered.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.type,
        t.amount.toString(),
        t.description || '',
        t.reference || '',
        t.balance_after?.toString() || '',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doxawise-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 section-reveal">
          <div>
            <h1 className="text-2xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">Complete record of all payments and top-ups</p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-muted rounded-lg p-0.5">
              {(['all', 'credit', 'debit'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="card-elevated overflow-hidden section-reveal stagger-1">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="divide-y">
              {filtered.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-[hsl(var(--success))]/10' : 'bg-destructive/10'}`}>
                      {tx.type === 'credit' ? (
                        <ArrowDownRight className="w-4 h-4 text-[hsl(var(--success))]" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {tx.reference && <span className="ml-2 font-mono">Ref: {tx.reference.slice(0, 16)}...</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className={`font-semibold tabular-nums ${tx.type === 'credit' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                    </p>
                    {tx.balance_after !== null && (
                      <p className="text-xs text-muted-foreground">Bal: {formatNaira(tx.balance_after)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm mt-1">All payment records will appear here</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
