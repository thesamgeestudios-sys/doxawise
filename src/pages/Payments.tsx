import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CreditCard, Plus, Calendar, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { formatNaira, calculateFee } from '@/lib/constants';
import { toast } from 'sonner';

interface Payment {
  id: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  fee: number;
  scheduledDate: string;
  status: 'pending' | 'completed' | 'failed';
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [form, setForm] = useState({
    recipientName: '',
    bankName: '',
    accountNumber: '',
    amount: '',
    scheduledDate: '',
  });

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    const fee = calculateFee(amount);
    const payment: Payment = {
      id: crypto.randomUUID(),
      recipientName: form.recipientName,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      amount,
      fee,
      scheduledDate: form.scheduledDate,
      status: 'pending',
    };
    setPayments(prev => [payment, ...prev]);
    setForm({ recipientName: '', bankName: '', accountNumber: '', amount: '', scheduledDate: '' });
    setShowScheduleModal(false);
    toast.success(`Payment of ${formatNaira(amount)} scheduled for ${form.scheduledDate}`);
  };

  const statusStyles = {
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
          <button onClick={() => setShowScheduleModal(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" />
            Schedule Payment
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 section-reveal stagger-1">
          <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">How payments work</p>
            <p className="text-muted-foreground mt-1">
              Scheduled payments are deducted from your wallet balance. If insufficient, your tokenized card is charged automatically. A fee of 0.3% (max ₦1,000) applies per transfer.
            </p>
          </div>
        </div>

        {/* Payments list */}
        <div className="card-elevated overflow-hidden section-reveal stagger-2">
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Recipient</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Bank</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Amount</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Fee</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Date</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium">{p.recipientName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.accountNumber}</p>
                      </td>
                      <td className="p-4 text-muted-foreground">{p.bankName}</td>
                      <td className="p-4 text-right font-medium tabular-nums">{formatNaira(p.amount)}</td>
                      <td className="p-4 text-right text-sm text-muted-foreground tabular-nums">{formatNaira(p.fee)}</td>
                      <td className="p-4 text-sm">{p.scheduledDate}</td>
                      <td className="p-4"><span className={statusStyles[p.status]}>{p.status}</span></td>
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

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setShowScheduleModal(false)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 section-reveal" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Schedule Payment</h2>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Recipient Name</label>
                  <input value={form.recipientName} onChange={e => setForm(p => ({ ...p, recipientName: e.target.value }))} required className="input-field w-full" placeholder="Fatima Bello" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bank Name</label>
                  <input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} required className="input-field w-full" placeholder="GTBank" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Account Number</label>
                  <input value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} required maxLength={10} className="input-field w-full" placeholder="0123456789" />
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
                  <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Schedule
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
