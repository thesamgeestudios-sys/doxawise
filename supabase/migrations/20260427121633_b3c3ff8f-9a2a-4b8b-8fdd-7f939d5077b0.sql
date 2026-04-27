ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS receipt_id text,
ADD COLUMN IF NOT EXISTS receipt_status text NOT NULL DEFAULT 'generated',
ADD COLUMN IF NOT EXISTS receipt_pdf_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS receipt_image_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS receipt_generated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Bank Transfer',
ADD COLUMN IF NOT EXISTS business_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS business_address text DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_info text DEFAULT '';

UPDATE public.transactions
SET receipt_id = COALESCE(receipt_id, 'DXW-RCPT-' || upper(replace(id::text, '-', ''))),
    receipt_generated_at = COALESCE(receipt_generated_at, created_at),
    receipt_status = COALESCE(receipt_status, 'generated')
WHERE receipt_id IS NULL OR receipt_generated_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_transaction_receipt_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.receipt_id IS NULL OR NEW.receipt_id = '' THEN
    NEW.receipt_id := 'DXW-RCPT-' || upper(replace(NEW.id::text, '-', ''));
  END IF;

  IF NEW.receipt_generated_at IS NULL THEN
    NEW.receipt_generated_at := COALESCE(NEW.created_at, now());
  END IF;

  IF NEW.receipt_status IS NULL OR NEW.receipt_status = '' THEN
    NEW.receipt_status := 'generated';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_transaction_receipt_fields_trigger ON public.transactions;
CREATE TRIGGER set_transaction_receipt_fields_trigger
BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_transaction_receipt_fields();

CREATE INDEX IF NOT EXISTS idx_transactions_receipt_id ON public.transactions(receipt_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created_at ON public.transactions(user_id, created_at DESC);