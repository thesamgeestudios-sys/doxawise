import jsPDF from 'jspdf';
import { APP_NAME, SITE_URL, formatNaira } from '@/lib/constants';

export interface ReceiptTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  created_at: string;
  balance_after: number | null;
  status?: string | null;
  receipt_id?: string | null;
  receipt_generated_at?: string | null;
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

export interface ReceiptProfile {
  business_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  virtual_account_number?: string | null;
  virtual_account_bank?: string | null;
}

const receiptIdFor = (tx: ReceiptTransaction) => tx.receipt_id || `DXW-RCPT-${tx.id.replace(/-/g, '').toUpperCase()}`;

const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth = 980) => {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += 34;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
  return yy;
};

export const generateReceiptFiles = async (tx: ReceiptTransaction, profile?: ReceiptProfile | null) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Receipt renderer unavailable');

  const receiptId = receiptIdFor(tx);
  const businessName = tx.business_name || profile?.business_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || APP_NAME;
  const senderName = tx.sender_name || businessName;
  const receiverName = tx.receiver_name || (tx.type === 'credit' ? businessName : 'Recipient');
  const status = tx.status || 'completed';
  const date = new Date(tx.receipt_generated_at || tx.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
  const verificationUrl = `${SITE_URL}/transactions?receipt=${encodeURIComponent(receiptId)}`;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(600, 780);
  ctx.rotate(-Math.PI / 9);
  ctx.fillStyle = 'rgba(26, 83, 128, 0.055)';
  ctx.font = '900 104px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('DOXAWISE', 0, 0);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#123f63';
  ctx.fillRect(80, 80, 82, 82);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px Arial';
  ctx.fillText('D', 108, 136);
  ctx.fillStyle = '#123f63';
  ctx.font = '900 44px Arial';
  ctx.fillText('DOXAWISE', 185, 120);
  ctx.fillStyle = '#607080';
  ctx.font = '22px Arial';
  ctx.fillText('Smart Financial Records', 188, 152);
  ctx.fillStyle = '#123f63';
  ctx.fillRect(80, 205, 1040, 4);

  ctx.fillStyle = '#607080';
  ctx.font = '700 22px Arial';
  ctx.fillText('TRANSACTION RECEIPT', 80, 275);
  ctx.fillStyle = '#142333';
  ctx.font = '900 42px Arial';
  drawText(ctx, receiptId, 80, 328, 720);
  ctx.fillStyle = status === 'failed' ? '#c83636' : status === 'processing' ? '#9a6400' : '#1f8f60';
  ctx.font = '900 26px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(status === 'completed' ? 'SUCCESSFUL' : status.toUpperCase(), 1120, 318);
  ctx.textAlign = 'left';

  const info = [
    ['Transaction ID', tx.id], ['Date & Time', date], ['Type', tx.type === 'credit' ? 'Credit' : 'Debit'], ['Payment Method', tx.payment_method || 'Bank Transfer'],
    ['Reference', tx.reference || 'Not available'], ['Amount', formatNaira(tx.amount)], ['Paid By', senderName], ['Received By', receiverName],
    ['Sender Account', [tx.sender_bank || profile?.virtual_account_bank, tx.sender_account || profile?.virtual_account_number].filter(Boolean).join(' • ') || 'Not specified'],
    ['Receiver Account', [tx.receiver_bank, tx.receiver_account].filter(Boolean).join(' • ') || 'Not specified'],
  ];
  let y = 420;
  for (let i = 0; i < info.length; i += 2) {
    for (let col = 0; col < 2; col++) {
      const item = info[i + col];
      if (!item) continue;
      const x = col === 0 ? 80 : 620;
      ctx.strokeStyle = '#d9e1e8';
      ctx.strokeRect(x, y, 500, 112);
      ctx.fillStyle = '#607080';
      ctx.font = '700 18px Arial';
      ctx.fillText(item[0], x + 24, y + 36);
      ctx.fillStyle = '#142333';
      ctx.font = '700 23px Arial';
      drawText(ctx, item[1], x + 24, y + 76, 448);
    }
    y += 138;
  }

  ctx.fillStyle = '#607080';
  ctx.font = '700 20px Arial';
  ctx.fillText('DESCRIPTION', 80, 1148);
  ctx.fillStyle = '#142333';
  ctx.font = '24px Arial';
  drawText(ctx, tx.description || 'Transaction processed through Doxawise', 80, 1192, 1040);

  ctx.fillStyle = '#123f63';
  ctx.fillRect(80, 1280, 1040, 118);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px Arial';
  ctx.fillText(formatNaira(tx.amount), 110, 1354);
  if (tx.balance_after !== null) {
    ctx.textAlign = 'right';
    ctx.font = '700 23px Arial';
    ctx.fillText(`Balance after: ${formatNaira(tx.balance_after)}`, 1090, 1354);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#607080';
  ctx.font = '20px Arial';
  ctx.fillText(`Generated by ${APP_NAME}. This receipt does not require a signature.`, 80, 1460);
  ctx.font = '18px Arial';
  drawText(ctx, verificationUrl, 80, 1495, 1040);

  const receipt_image_url = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.addImage(receipt_image_url, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  return { receipt_pdf_url: pdf.output('datauristring'), receipt_image_url, receipt_id: receiptId };
};

export const downloadDataUrl = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
};