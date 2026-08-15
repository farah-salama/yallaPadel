import crypto from "crypto";

const BASE = process.env.PAYMOB_BASE_URL || "https://accept.paymob.com";

function secret() {
  return process.env.PAYMOB_SECRET_KEY || "";
}

export function paymobConfigured() {
  return Boolean(process.env.PAYMOB_SECRET_KEY && process.env.PAYMOB_PUBLIC_KEY && process.env.PAYMOB_INTEGRATION_ID_CARD);
}

export type IntentionInput = {
  amountCents: number;
  currency?: string;
  specialReference: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  items?: { name: string; amount: number; quantity: number; description?: string }[];
};

export async function createIntention(input: IntentionInput) {
  const res = await fetch(`${BASE}/v1/intention/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: input.currency ?? "EGP",
      payment_methods: [Number(process.env.PAYMOB_INTEGRATION_ID_CARD)],
      items: input.items ?? [
        {
          name: "Court deposit",
          amount: input.amountCents,
          quantity: 1,
          description: "YallaPadel slot deposit",
        },
      ],
      special_reference: input.specialReference,
      billing_data: {
        first_name: input.customer.firstName,
        last_name: input.customer.lastName,
        email: input.customer.email,
        phone_number: input.customer.phone,
        apartment: "NA",
        floor: "NA",
        street: "NA",
        building: "NA",
        shipping_method: "NA",
        postal_code: "NA",
        city: "NA",
        state: "NA",
        country: "EGY",
      },
      customer: {
        first_name: input.customer.firstName,
        last_name: input.customer.lastName,
        email: input.customer.email,
      },
      notification_url: `${process.env.APP_URL}/api/paymob/webhook`,
      redirection_url: `${process.env.APP_URL}/payment/complete`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paymob intention failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return { id: data.id as string, clientSecret: data.client_secret as string };
}

export function checkoutUrl(clientSecret: string) {
  return `${BASE}/unifiedcheckout/?publicKey=${process.env.PAYMOB_PUBLIC_KEY}&clientSecret=${clientSecret}`;
}

export function verifyTransactionPostHmac(obj: Record<string, unknown>, receivedHmac: string) {
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  if (!hmacSecret || !receivedHmac) return false;
  const order = obj.order as { id: unknown };
  const source = obj.source_data as { pan: unknown; sub_type: unknown; type: unknown };
  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    order?.id,
    obj.owner,
    obj.pending,
    source?.pan,
    source?.sub_type,
    source?.type,
    obj.success,
  ];
  const computed = crypto.createHmac("sha512", hmacSecret).update(fields.map(String).join("")).digest("hex");
  if (computed.length !== receivedHmac.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(receivedHmac));
}

async function paymobPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Paymob ${path} failed (${res.status})`);
  return data;
}

export function refund(txnId: number, amountCents: number) {
  return paymobPost("/api/acceptance/void_refund/refund", {
    transaction_id: txnId,
    amount_cents: amountCents,
  });
}

export function voidTxn(txnId: number) {
  return paymobPost("/api/acceptance/void_refund/void", { transaction_id: txnId });
}
