import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

async function callEdgeFunction(functionName: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(
    `https://${PROJECT_ID}.supabase.co/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!res.ok && !data.success) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
}

export const flutterwaveApi = {
  verifyBvn: (bvn: string) => callEdgeFunction("verify-bvn", { bvn }),

  createVirtualAccount: () => callEdgeFunction("create-virtual-account", {}),

  initiateTransfer: (params: {
    account_bank: string;
    account_number: string;
    amount: number;
    narration?: string;
    recipient_name?: string;
    payment_id?: string;
  }) => callEdgeFunction("initiate-transfer", params),

  batchTransfer: (transfers: Array<{
    account_bank: string;
    account_number: string;
    amount: number;
    recipient_name?: string;
    payment_id?: string;
    staff_id?: string;
  }>) => callEdgeFunction("batch-transfer", { transfers }),

  tokenizeCard: (params: {
    action: "initialize" | "validate";
    card_number?: string;
    cvv?: string;
    expiry_month?: string;
    expiry_year?: string;
    amount?: number;
    flw_ref?: string;
    otp?: string;
  }) => callEdgeFunction("tokenize-card", params),

  getBanks: async () => {
    const res = await fetch(
      `https://${PROJECT_ID}.supabase.co/functions/v1/get-banks`,
      {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }
    );
    return res.json();
  },

  resolveAccount: (account_number: string, account_bank: string) =>
    callEdgeFunction("resolve-account", { account_number, account_bank }),
};
