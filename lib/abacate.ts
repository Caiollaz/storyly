// Minimal AbacatePay v2 client. The official SDK (v1) only supports one-time
// billing, so we call the v2 subscriptions endpoint directly.
// Docs: https://docs.abacatepay.com/pages/subscriptions/create

const API_BASE = "https://api.abacatepay.com/v2";

interface CreateSubscriptionParams {
  productId: string;
  externalId: string; // our userId — echoed back in webhooks
  completionUrl: string;
  returnUrl: string;
  customerId?: string;
}

interface CreateSubscriptionResponse {
  data: { id: string; url: string; status: string } | null;
  error: string | null;
}

export async function createSubscriptionCheckout(
  params: CreateSubscriptionParams,
): Promise<{ id: string; url: string }> {
  const apiKey = process.env.ABACATEPAY_API_KEY;
  if (!apiKey) throw new Error("ABACATEPAY_API_KEY is not configured.");

  const res = await fetch(`${API_BASE}/subscriptions/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ id: params.productId, quantity: 1 }],
      externalId: params.externalId,
      completionUrl: params.completionUrl,
      returnUrl: params.returnUrl,
      ...(params.customerId ? { customerId: params.customerId } : {}),
    }),
  });

  const json = (await res.json()) as CreateSubscriptionResponse;
  if (!res.ok || !json.data) {
    throw new Error(json.error ?? `AbacatePay error (${res.status})`);
  }
  return { id: json.data.id, url: json.data.url };
}

// ---------------------------------------------------------------------------
// Webhook payloads (v2 — all events share the same envelope)
// ---------------------------------------------------------------------------

export type AbacateEvent =
  | "subscription.completed"
  | "subscription.renewed"
  | "subscription.cancelled";

export interface AbacateWebhook {
  id: string;
  event: string;
  apiVersion: number;
  devMode: boolean;
  data: {
    id?: string;
    externalId?: string;
    status?: string;
    nextBilling?: string | null;
    subscription?: {
      id?: string;
      externalId?: string;
      nextBilling?: string | null;
    };
    customer?: { id?: string; metadata?: { externalId?: string } } | null;
    [key: string]: unknown;
  };
}
