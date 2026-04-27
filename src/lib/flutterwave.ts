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

  processTransfer: (params: {
    account_bank: string;
    account_number: string;
    amount: number;
    currency: string;
    narration: string;
    reference: string;
    recipient_name?: string;
    payment_id?: string;
  }) => callEdgeFunction("process-transfer", params),

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

  createVirtualCard: (params: { amount?: number; currency?: string }) =>
    callEdgeFunction("create-virtual-card", { action: "create", ...params }),

  fundVirtualCard: (card_id: string, amount: number) =>
    callEdgeFunction("create-virtual-card", { action: "fund", card_id, amount }),

  blockVirtualCard: (card_id: string) =>
    callEdgeFunction("create-virtual-card", { action: "block", card_id }),

  unblockVirtualCard: (card_id: string) =>
    callEdgeFunction("create-virtual-card", { action: "unblock", card_id }),

  terminateVirtualCard: (card_id: string) =>
    callEdgeFunction("create-virtual-card", { action: "terminate", card_id }),

  listVirtualCards: () =>
    callEdgeFunction("create-virtual-card", { action: "list" }),

  // Support tickets
  createSupportTicket: (subject: string, message: string) =>
    callEdgeFunction("support-tickets", { action: "create_ticket", subject, message }),

  replySupportTicket: (ticket_id: string, reply: string, status?: string) =>
    callEdgeFunction("support-tickets", { action: "reply_ticket", ticket_id, reply, status }),

  sendMessage: (params: { recipient_user_id?: string; subject: string; message: string; is_broadcast?: boolean }) =>
    callEdgeFunction("support-tickets", { action: "send_message", ...params }),

  // Admin actions
  adminDeleteUser: (target_user_id: string) =>
    callEdgeFunction("admin-actions", { action: "delete_user", target_user_id }),

  adminUpdateUser: (target_user_id: string, updates: Record<string, unknown>) =>
    callEdgeFunction("admin-actions", { action: "update_user", target_user_id, updates }),

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

  // International transfers
  getTransferRates: (source_currency: string, destination_currency: string, amount: number) =>
    callEdgeFunction("international-transfer", { action: "get_rates", source_currency, destination_currency, amount }),

  getCountryBanks: (country: string) =>
    callEdgeFunction("international-transfer", { action: "get_country_banks", country }),

  internationalTransfer: (params: {
    account_bank: string;
    account_number: string;
    amount: number;
    currency: string;
    destination_currency: string;
    beneficiary_name?: string;
    narration?: string;
  }) => callEdgeFunction("international-transfer", { action: "transfer", ...params }),
};
