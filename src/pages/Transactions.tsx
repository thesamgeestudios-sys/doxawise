import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { formatNaira } from '@/lib/constants';
import TransactionReceipt from '@/components/TransactionReceipt';
import { downloadDataUrl, generateReceiptFiles } from '@/lib/receiptGenerator';
import { flutterwaveApi } from '@/lib/flutterwave';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  created_at: string;
  balance_after: number | null;
  status?: string | null;
  receipt_id?: string | null;
  receipt_status?: string | null;
  receipt_generated_at?: string | null;
  receipt_pdf_url?: string | null;
  receipt_image_url?: string | null;
  payment_method?: string | null;
  business_name?: string | null;
  business_address?: string | null;
  contact_info?: string | null;
  sender_name?: string | null;
  sender_account?: string | null;
  sender_bank?: string | null;
  receiver_name?: string | null;
  receiver_account?: string | null;
  receiver_bank?: string | null;
}

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [autoDownload, setAutoDownload] = useState<'pdf' | 'jpg' | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadProfile();
    }
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

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
    if (data) setProfile(data);
  };

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const ensureReceipt = async (tx: Transaction) => {
    if (tx.receipt_pdf_url && tx.receipt_image_url) return tx;
    setGeneratingReceipt(tx.id);
    try {
      const files = await generateReceiptFiles(tx, profile);
      await flutterwaveApi.storeReceipt({ transaction_id: tx.id, receipt_pdf_url: files.receipt_pdf_url, receipt_image_url: files.receipt_image_url });
      const updated = { ...tx, ...files, receipt_status: 'generated', receipt_generated_at: new Date().toISOString() };
      setTransactions(prev => prev.map(item => item.id === tx.id ? updated : item));
      return updated;
    } finally {
      setGeneratingReceipt(null);
    }
  };

  const downloadReceipt = async (tx: Transaction, format: 'pdf' | 'jpg') => {
    try {
      const readyTx = await ensureReceipt(tx);
      const receiptId = readyTx.receipt_id || `DXW-RCPT-${readyTx.id.replace(/-/g, '').toUpperCase()}`;
      const stem = `doxawise-receipt-${receiptId.slice(-12).toLowerCase()}`;
      if (format === 'pdf' && readyTx.receipt_pdf_url) downloadDataUrl(readyTx.receipt_pdf_url, `${stem}.pdf`);
      if (format === 'jpg' && readyTx.receipt_image_url) downloadDataUrl(readyTx.receipt_image_url, `${stem}.jpg`);
    } catch {
      setSelectedTx(tx);
      setAutoDownload(format);
    }
  };

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
            <p className="text-muted-foreground">Click any transaction to download receipt</p>
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
                <div key={tx.id} onClick={() => setSelectedTx(tx)} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer">
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
                  <div className="flex shrink-0 items-center gap-3 ml-4">
                    <div className="hidden sm:flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadReceipt(tx, 'pdf'); }}
                        disabled={generatingReceipt === tx.id}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60"
                      >
                        {generatingReceipt === tx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadReceipt(tx, 'jpg'); }}
                        disabled={generatingReceipt === tx.id}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60"
                      >
                        JPG
                      </button>
                    </div>
                    <div className="text-right">
                    <p className={`font-semibold tabular-nums ${tx.type === 'credit' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                    </p>
                    {tx.balance_after !== null && (
                      <p className="text-xs text-muted-foreground">Bal: {formatNaira(tx.balance_after)}</p>
                    )}
                      {tx.receipt_status && tx.receipt_status !== 'generated' && (
                        <p className="text-xs text-muted-foreground">Receipt pending</p>
                      )}
                    </div>
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

      {selectedTx && (() => {
        // Parse recipient from description (format: "Transfer to Name - BankName")
        const desc = selectedTx.description || '';
        const recipientMatch = desc.match(/(?:Transfer|transfer)\s+to\s+(.+?)(?:\s*-\s*(.+))?$/);
        const recipientName = recipientMatch?.[1]?.trim();
        const recipientBank = recipientMatch?.[2]?.trim();
        return (
          <TransactionReceipt
            transaction={selectedTx}
            onClose={() => { setSelectedTx(null); setAutoDownload(null); }}
            senderName={selectedTx.sender_name || (profile ? (profile.business_name || `${profile.first_name} ${profile.last_name}`.trim()) : undefined)}
            senderAccount={selectedTx.sender_account || profile?.virtual_account_number || undefined}
            senderBank={selectedTx.sender_bank || profile?.virtual_account_bank || undefined}
            recipientName={selectedTx.receiver_name || recipientName}
            recipientBank={selectedTx.receiver_bank || recipientBank}
            recipientAccount={selectedTx.receiver_account || undefined}
            businessName={profile?.business_name || undefined}
            contactInfo={profile?.phone || user?.email || undefined}
            autoDownload={autoDownload}
            onAutoDownloadComplete={() => setAutoDownload(null)}
          />
        );
      })()}
    </DashboardLayout>
  );
};

export default Transactions;
