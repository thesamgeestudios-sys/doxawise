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
  recipientName?: string;
  recipientAccount?: string;
  recipientBank?: string;
}

const TransactionReceipt = ({ transaction, onClose, senderName, senderAccount, senderBank, recipientName, recipientAccount, recipientBank }: Props) => {
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

  // Parse description for recipient details
  const desc = transaction.description || '';
  const parsedRecipient = recipientName || (desc.includes('to ') ? desc.split('to ').pop()?.split(' -')[0] : undefined);

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
            <Row label="Date" value={formattedDate} />
            <Row label="Time" value={formattedTime} />
            <Row label="Transaction Type" value={transaction.type} capitalize />
            {transaction.description && <Row label="Description" value={transaction.description} rightAlign />}
            {transaction.reference && <Row label="Reference" value={transaction.reference} mono rightAlign />}

            {/* Sender info */}
            {senderName && (
              <>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                <SectionHeader label={transaction.type === 'credit' ? 'Sender Details' : 'Sent By'} />
                <Row label="Name" value={senderName} />
                {senderAccount && <Row label="Account Number" value={senderAccount} mono />}
                {senderBank && <Row label="Bank" value={senderBank} />}
              </>
            )}

            {/* Recipient info */}
            {(parsedRecipient || recipientAccount) && (
              <>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                <SectionHeader label={transaction.type === 'credit' ? 'Received By' : 'Recipient Details'} />
                {parsedRecipient && <Row label="Name" value={parsedRecipient} />}
                {recipientAccount && <Row label="Account Number" value={recipientAccount} mono />}
                {recipientBank && <Row label="Bank" value={recipientBank} />}
              </>
            )}

            {transaction.balance_after !== null && (
              <>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                <Row label="Balance After" value={formatNaira(transaction.balance_after)} bold />
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

const Row = ({ label, value, mono, capitalize, rightAlign, bold }: { label: string; value: string; mono?: boolean; capitalize?: boolean; rightAlign?: boolean; bold?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '16px' }}>
    <span style={{ color: '#94a3b8', flexShrink: 0 }}>{label}</span>
    <span style={{
      fontWeight: bold ? '600' : '500',
      textAlign: rightAlign ? 'right' : undefined,
      textTransform: capitalize ? 'capitalize' : undefined,
      fontFamily: mono ? 'monospace' : undefined,
      fontSize: mono ? '11px' : undefined,
      wordBreak: mono ? 'break-all' : undefined,
    }}>{value}</span>
  </div>
);

const SectionHeader = ({ label }: { label: string }) => (
  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
    {label}
  </div>
);

export default TransactionReceipt;
