import { APP_NAME, SITE_URL, formatNaira } from '@/lib/constants';
import { Download, X, FileImage, Mail, Share2, QrCode } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

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
  payment_method?: string | null;
  business_name?: string | null;
  business_address?: string | null;
  contact_info?: string | null;
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
  businessName?: string;
  businessAddress?: string;
  contactInfo?: string;
  autoDownload?: 'pdf' | 'jpg' | null;
  onAutoDownloadComplete?: () => void;
}

const TransactionReceipt = ({
  transaction,
  onClose,
  senderName,
  senderAccount,
  senderBank,
  recipientName,
  recipientAccount,
  recipientBank,
  businessName,
  businessAddress,
  contactInfo,
  autoDownload,
  onAutoDownloadComplete,
}: Props) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const hasAutoDownloaded = useRef(false);

  const receiptId = transaction.receipt_id || `DXW-RCPT-${transaction.id.replace(/-/g, '').toUpperCase()}`;
  const status = transaction.status || (transaction.receipt_status === 'generated' ? 'completed' : 'pending');
  const date = new Date(transaction.receipt_generated_at || transaction.created_at);
  const formattedDateTime = date.toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const desc = transaction.description || '';
  const parsedRecipient = recipientName || (desc.includes('to ') ? desc.split('to ').pop()?.split(' -')[0]?.split(' (Fee:')[0] : undefined);
  const resolvedBusinessName = transaction.business_name || businessName || senderName || recipientName || APP_NAME;
  const resolvedContact = transaction.contact_info || contactInfo || 'support@doxawise.vercel.app';
  const resolvedAddress = transaction.business_address || businessAddress || '';
  const verificationUrl = `${SITE_URL}/transactions?receipt=${encodeURIComponent(receiptId)}`;
  const fileStem = `doxawise-receipt-${receiptId.slice(-12).toLowerCase()}`;

  const partyLabels = useMemo(() => {
    if (transaction.type === 'credit') return { paidBy: senderName || 'External payer', receivedBy: recipientName || resolvedBusinessName };
    return { paidBy: senderName || resolvedBusinessName, receivedBy: parsedRecipient || 'Recipient' };
  }, [parsedRecipient, recipientName, resolvedBusinessName, senderName, transaction.type]);

  const captureReceipt = async () => {
    const el = receiptRef.current;
    if (!el) throw new Error('Receipt preview is not ready');
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(el, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
  };

  const downloadAsImage = async () => {
    try {
      const canvas = await captureReceipt();
      const link = document.createElement('a');
      link.download = `${fileStem}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.96);
      link.click();
    } catch {
      toast.info('Receipt will be available shortly');
    }
  };

  const downloadAsPdf = async () => {
    try {
      const canvas = await captureReceipt();
      const { default: jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const availableWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * availableWidth) / canvas.width;
      const renderHeight = Math.min(imageHeight, pageHeight - margin * 2);
      pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, renderHeight, undefined, 'FAST');
      pdf.save(`${fileStem}.pdf`);
    } catch {
      toast.info('Receipt will be available shortly');
    }
  };

  const shareReceipt = async () => {
    const text = `${APP_NAME} receipt ${receiptId} for ${formatNaira(transaction.amount)} - ${verificationUrl}`;
    if (navigator.share) {
      await navigator.share({ title: `${APP_NAME} Transaction Receipt`, text, url: verificationUrl });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success('Receipt link copied');
  };

  const emailReceipt = () => {
    const subject = encodeURIComponent(`${APP_NAME} Receipt ${receiptId}`);
    const body = encodeURIComponent(`Transaction receipt: ${receiptId}\nAmount: ${formatNaira(transaction.amount)}\nVerification: ${verificationUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  useEffect(() => {
    if (!autoDownload || hasAutoDownloaded.current) return;
    hasAutoDownloaded.current = true;
    window.setTimeout(async () => {
      if (autoDownload === 'pdf') await downloadAsPdf();
      if (autoDownload === 'jpg') await downloadAsImage();
      onAutoDownloadComplete?.();
    }, 250);
  }, [autoDownload, onAutoDownloadComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-3 sm:p-6" onClick={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Transaction Receipt</h3>
            {transaction.receipt_status !== 'generated' && <p className="text-xs text-muted-foreground">Receipt will be available shortly</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={downloadAsPdf} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            <button onClick={downloadAsImage} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted">
              <FileImage className="h-3.5 w-3.5" /> JPG
            </button>
            <button onClick={shareReceipt} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button onClick={emailReceipt} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted">
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
            <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-muted" aria-label="Close receipt">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[82vh] overflow-y-auto bg-muted/40 p-3 sm:p-6">
          <div ref={receiptRef} style={{ width: '100%', maxWidth: '760px', margin: '0 auto', background: '#ffffff', color: 'hsl(222 22% 10%)', padding: '40px', fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '45% 0 auto', textAlign: 'center', transform: 'rotate(-18deg)', fontSize: '64px', fontWeight: 800, color: 'hsl(222 62% 42% / 0.045)', letterSpacing: '8px', pointerEvents: 'none' }}>DOXAWISE</div>

            <header style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', borderBottom: '2px solid hsl(222 62% 42%)', paddingBottom: '22px', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'hsl(222 62% 42%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '24px' }}>D</div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '1px', color: 'hsl(222 62% 42%)' }}>DOXAWISE</div>
                  <div style={{ fontSize: '12px', color: 'hsl(220 10% 46%)', marginTop: '2px' }}>Smart Financial Records</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: 'hsl(220 10% 46%)', lineHeight: 1.65, maxWidth: '260px' }}>
                <strong style={{ display: 'block', color: 'hsl(222 22% 10%)', fontSize: '14px' }}>{resolvedBusinessName}</strong>
                {resolvedAddress && <span style={{ display: 'block' }}>{resolvedAddress}</span>}
                <span>{resolvedContact}</span>
              </div>
            </header>

            <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', margin: '28px 0' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(220 10% 46%)', letterSpacing: '2px' }}>TRANSACTION RECEIPT</div>
                <h2 style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 900, color: 'hsl(222 22% 10%)' }}>{receiptId}</h2>
              </div>
              <div style={{ borderRadius: '999px', padding: '8px 14px', background: status === 'failed' ? 'hsl(0 72% 51% / 0.1)' : status === 'pending' || status === 'processing' ? 'hsl(38 92% 50% / 0.13)' : 'hsl(152 56% 40% / 0.12)', color: status === 'failed' ? 'hsl(0 72% 51%)' : status === 'pending' || status === 'processing' ? 'hsl(30 80% 30%)' : 'hsl(152 56% 32%)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                {status === 'completed' ? 'Successful' : status}
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <InfoBox label="Transaction ID" value={transaction.id} mono />
              <InfoBox label="Date & Time" value={formattedDateTime} />
              <InfoBox label="Transaction Type" value={transaction.type === 'credit' ? 'Credit' : 'Debit'} />
              <InfoBox label="Payment Method" value={transaction.payment_method || 'Bank Transfer'} />
            </section>

            <section style={{ borderTop: '1px solid hsl(220 16% 88%)', borderBottom: '1px solid hsl(220 16% 88%)', padding: '20px 0', marginBottom: '24px' }}>
              <SectionLabel>Parties involved</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '18px', marginTop: '12px' }}>
                <PartyBox title="Paid By" name={partyLabels.paidBy} account={senderAccount} bank={senderBank} />
                <PartyBox title="Received By" name={partyLabels.receivedBy} account={recipientAccount} bank={recipientBank} />
              </div>
            </section>

            <section style={{ marginBottom: '24px' }}>
              <SectionLabel>Description</SectionLabel>
              <p style={{ margin: '8px 0 0', padding: '14px 16px', background: 'hsl(220 16% 96%)', borderRadius: '12px', fontSize: '13px', lineHeight: 1.6, color: 'hsl(222 22% 10%)' }}>
                {transaction.description || 'Transaction processed through Doxawise'}
              </p>
            </section>

            <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', background: 'hsl(222 62% 42%)', color: '#ffffff', borderRadius: '18px', padding: '22px 24px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.78, marginBottom: '6px' }}>Amount</div>
                <div style={{ fontSize: '34px', fontWeight: 900 }}>{formatNaira(transaction.amount)}</div>
              </div>
              {transaction.balance_after !== null && <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.88 }}>Balance After<br /><strong style={{ fontSize: '16px' }}>{formatNaira(transaction.balance_after)}</strong></div>}
            </section>

            <footer style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', borderTop: '1px solid hsl(220 16% 88%)', paddingTop: '18px' }}>
              <div style={{ fontSize: '11px', color: 'hsl(220 10% 46%)', lineHeight: 1.7 }}>
                <p style={{ margin: 0 }}>Generated by {APP_NAME}.</p>
                <p style={{ margin: 0 }}>This is a system-generated receipt and does not require signature.</p>
                <p style={{ margin: '8px 0 0', fontFamily: 'monospace', wordBreak: 'break-all' }}>{verificationUrl}</p>
              </div>
              <div style={{ width: '74px', height: '74px', border: '1px solid hsl(220 16% 88%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'hsl(222 62% 42%)' }}>
                <QrCode size={50} />
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({ children }: { children: string }) => (
  <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'hsl(222 62% 42%)' }}>{children}</div>
);

const InfoBox = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div style={{ border: '1px solid hsl(220 16% 88%)', borderRadius: '12px', padding: '12px 14px', minWidth: 0 }}>
    <div style={{ fontSize: '10px', color: 'hsl(220 10% 46%)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>{label}</div>
    <div style={{ fontSize: mono ? '10px' : '13px', fontWeight: 700, fontFamily: mono ? 'monospace' : undefined, wordBreak: mono ? 'break-all' : 'normal' }}>{value}</div>
  </div>
);

const PartyBox = ({ title, name, account, bank }: { title: string; name?: string; account?: string; bank?: string }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: '11px', color: 'hsl(220 10% 46%)', marginBottom: '6px' }}>{title}</div>
    <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(222 22% 10%)' }}>{name || 'Not specified'}</div>
    {account && <div style={{ fontSize: '11px', color: 'hsl(220 10% 46%)', fontFamily: 'monospace', marginTop: '4px' }}>{account}</div>}
    {bank && <div style={{ fontSize: '12px', color: 'hsl(220 10% 46%)', marginTop: '2px' }}>{bank}</div>}
  </div>
);

export default TransactionReceipt;
