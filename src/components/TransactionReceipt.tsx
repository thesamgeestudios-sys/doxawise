import { formatNaira, APP_NAME } from '@/lib/constants';
import { Download, X, FileImage } from 'lucide-react';
import { useRef } from 'react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  created_at: string;
  balance_after: number | null;
}

interface Props {
  transaction: Transaction;
  onClose: () => void;
  senderName?: string;
  senderAccount?: string;
  senderBank?: string;
}

const TransactionReceipt = ({ transaction, onClose, senderName, senderAccount, senderBank }: Props) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadAsImage = async () => {
    const el = receiptRef.current;
    if (!el) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const link = document.createElement('a');
    link.download = `doxawise-receipt-${transaction.reference?.slice(0, 12) || transaction.id.slice(0, 8)}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const downloadAsPdf = async () => {
    const el = receiptRef.current;
    if (!el) return;
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`doxawise-receipt-${transaction.reference?.slice(0, 12) || transaction.id.slice(0, 8)}.pdf`);
  };

  const date = new Date(transaction.created_at);
  const formattedDate = date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Parse description to extract recipient info
  const desc = transaction.description || '';
  const isTransfer = desc.toLowerCase().includes('transfer');
  const isInternational = desc.toLowerCase().includes('international');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Actions bar */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Transaction Receipt</h3>
          <div className="flex items-center gap-2">
            <button onClick={downloadAsImage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 transition-colors">
              <FileImage className="w-3.5 h-3.5" /> JPEG
            </button>
            <button onClick={downloadAsPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt content */}
        <div ref={receiptRef} style={{ background: '#ffffff', color: '#1a1a2e', padding: '32px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#6d28d9', marginBottom: '4px' }}>{APP_NAME}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Transaction Receipt</div>
          </div>

          {/* Status badge */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 16px', borderRadius: '24px', fontSize: '13px', fontWeight: '600',
              background: transaction.type === 'credit' ? '#dcfce7' : '#fee2e2',
              color: transaction.type === 'credit' ? '#16a34a' : '#dc2626',
            }}>
              ● {transaction.type === 'credit' ? 'Money Received' : 'Money Sent'}
            </span>
          </div>

          {/* Amount */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: transaction.type === 'credit' ? '#16a34a' : '#dc2626' }}>
              {transaction.type === 'credit' ? '+' : '-'}{formatNaira(transaction.amount)}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '20px 0' }} />

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>Date</span>
              <span style={{ fontWeight: '500' }}>{formattedDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>Time</span>
              <span style={{ fontWeight: '500' }}>{formattedTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>Transaction Type</span>
              <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{transaction.type}</span>
            </div>
            {transaction.description && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '16px' }}>
                <span style={{ color: '#94a3b8', flexShrink: 0 }}>Description</span>
                <span style={{ fontWeight: '500', textAlign: 'right' }}>{transaction.description}</span>
              </div>
            )}
            {transaction.reference && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '16px' }}>
                <span style={{ color: '#94a3b8', flexShrink: 0 }}>Reference</span>
                <span style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '11px', textAlign: 'right', wordBreak: 'break-all' }}>{transaction.reference}</span>
              </div>
            )}

            {/* Sender info */}
            {senderName && (
              <>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                  {transaction.type === 'credit' ? 'Received By' : 'Sent By'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>Name</span>
                  <span style={{ fontWeight: '500' }}>{senderName}</span>
                </div>
                {senderAccount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#94a3b8' }}>Account</span>
                    <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>{senderAccount}</span>
                  </div>
                )}
                {senderBank && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#94a3b8' }}>Bank</span>
                    <span style={{ fontWeight: '500' }}>{senderBank}</span>
                  </div>
                )}
              </>
            )}

            {transaction.balance_after !== null && (
              <>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>Balance After</span>
                  <span style={{ fontWeight: '600' }}>{formatNaira(transaction.balance_after)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0 16px' }} />
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', lineHeight: '1.6' }}>
            <p>This is an electronic receipt generated by {APP_NAME}.</p>
            <p>{APP_NAME} is not a bank. Payment processing powered by secure banking infrastructure.</p>
            <p style={{ marginTop: '8px', fontFamily: 'monospace' }}>ID: {transaction.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReceipt;
