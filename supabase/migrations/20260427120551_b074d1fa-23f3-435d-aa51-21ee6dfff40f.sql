ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS sender_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_account text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_bank text DEFAULT '',
  ADD COLUMN IF NOT EXISTS receiver_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS receiver_account text DEFAULT '',
  ADD COLUMN IF NOT EXISTS receiver_bank text DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

ALTER TABLE public.scheduled_payments
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS reference text DEFAULT '',
  ADD COLUMN IF NOT EXISTS transfer_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone;