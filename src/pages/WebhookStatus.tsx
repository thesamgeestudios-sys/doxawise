import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flutterwaveApi } from '@/lib/flutterwave';
import { APP_NAME } from '@/lib/constants';
import { CheckCircle, KeyRound, Link2, Loader2, RefreshCw, Route, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type WebhookStatusResult = {
  success: boolean;
  endpoint: string;
  endpoint_matches_expected: boolean;
  webhook_hash_configured: boolean;
  provided_hash_matches?: boolean | null;
  fixie_configured: boolean;
  flutterwave_proxy_check: 'ok' | 'failed' | 'skipped';
  flutterwave_proxy_message?: string;
  checked_at: string;
};

const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${ok ? 'bg-[hsl(var(--success))]/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
    {ok ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
    {label}
  </span>
);

const WebhookStatus = () => {
  const [status, setStatus] = useState<WebhookStatusResult | null>(null);
  const [expectedHash, setExpectedHash] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingHash, setCheckingHash] = useState(false);

  const loadStatus = async (hashToVerify?: string) => {
    if (hashToVerify) setCheckingHash(true);
    else setLoading(true);

    try {
      const result = await flutterwaveApi.getWebhookStatus(hashToVerify ? { expected_hash: hashToVerify } : {});
      setStatus(result);
      if (hashToVerify) {
        result.provided_hash_matches
          ? toast.success('Webhook hash matches the configured secret')
          : toast.error('Webhook hash does not match the configured secret');
      }
    } catch (error: any) {
      toast.error(error.message || 'Unable to verify webhook status');
    } finally {
      setLoading(false);
      setCheckingHash(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Admin verification</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Flutterwave Webhook Status</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Confirm webhook routing, secret configuration, and static-IP proxy connectivity without exposing private values.
            </p>
          </div>
          <Button variant="outline" onClick={() => loadStatus()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><Link2 className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-semibold text-card-foreground">Webhook endpoint</h2>
                  <p className="text-xs text-muted-foreground">Configured callback URL</p>
                </div>
              </div>
              {status && <StatusPill ok={status.endpoint_matches_expected} label={status.endpoint_matches_expected ? 'Correct' : 'Mismatch'} />}
            </div>
            <div className="break-all rounded-md bg-muted px-3 py-2 text-sm text-foreground">
              {status?.endpoint || 'Checking endpoint...'}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><KeyRound className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-semibold text-card-foreground">Secret hash</h2>
                  <p className="text-xs text-muted-foreground">Stored securely; never displayed</p>
                </div>
              </div>
              {status && <StatusPill ok={status.webhook_hash_configured} label={status.webhook_hash_configured ? 'Configured' : 'Missing'} />}
            </div>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="expected_hash">Verify a hash value</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="expected_hash"
                    type="password"
                    value={expectedHash}
                    onChange={(event) => setExpectedHash(event.target.value)}
                    placeholder="Enter the Flutterwave secret hash to compare"
                    autoComplete="off"
                  />
                  <Button onClick={() => loadStatus(expectedHash)} disabled={!expectedHash || checkingHash}>
                    {checkingHash ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Verify
                  </Button>
                </div>
              </div>
              {status?.provided_hash_matches !== undefined && status.provided_hash_matches !== null && (
                <StatusPill ok={status.provided_hash_matches} label={status.provided_hash_matches ? 'Hash matches' : 'Hash mismatch'} />
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><Route className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-semibold text-card-foreground">Fixie routing</h2>
                  <p className="text-xs text-muted-foreground">Flutterwave requests use the static outbound IP proxy</p>
                </div>
              </div>
              {status && <StatusPill ok={status.fixie_configured} label={status.fixie_configured ? 'Enabled' : 'Missing'} />}
            </div>
            <p className="text-sm text-muted-foreground">
              Proxy connectivity: <span className="font-semibold text-foreground">{status?.flutterwave_proxy_check || 'checking'}</span>
            </p>
            {status?.flutterwave_proxy_message && <p className="mt-2 text-xs text-muted-foreground">{status.flutterwave_proxy_message}</p>}
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold text-card-foreground">{APP_NAME} verification</h2>
                <p className="text-xs text-muted-foreground">Last checked {status ? new Date(status.checked_at).toLocaleString() : 'now'}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The public webhook URL can be copied into Flutterwave. Secret validation happens server-side only.
            </p>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WebhookStatus;
