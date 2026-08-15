import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyTransactionPostHmac } from "@/lib/paymob";
import { sendTicketEmail } from "@/lib/mail";
import { bookingQrDataUrl } from "@/lib/qr";
import { refund } from "@/lib/paymob";

const seen = new Set<string>();

export async function POST(req: NextRequest) {
  const hmac = req.nextUrl.searchParams.get("hmac") || "";
  const body = await req.json().catch(() => null);
  const obj = body?.obj ?? body;
  if (!obj) return NextResponse.json({ ok: false }, { status: 400 });
  if (!verifyTransactionPostHmac(obj, hmac)) {
    return NextResponse.json({ ok: false, error: "hmac" }, { status: 401 });
  }
  const txnId = String(obj.id);
  if (seen.has(txnId)) return NextResponse.json({ ok: true, dup: true });
  seen.add(txnId);

  const bookingId = String(
    obj.order?.merchant_order_id ||
      obj.merchant_order_id ||
      obj.special_reference ||
      "",
  );
  const success = String(obj.success) === "true" || obj.success === true;

  if (!success) {
    if (bookingId) await db.failPayment(bookingId);
    return NextResponse.json({ ok: true });
  }

  const existing = bookingId ? await db.getBooking(bookingId) : null;
  if (!existing) return NextResponse.json({ ok: false, error: "booking" }, { status: 404 });
  await db.attachPayment(bookingId, {
    amountCents: Number(obj.amount_cents) || 0,
    userId: existing.userId,
    paymobTxnId: txnId,
    status: "PENDING",
  });
  const result = await db.confirmPayment({ bookingId, txnId });
  if (result.ok) {
    const qr = await bookingQrDataUrl(result.booking.qrToken);
    await sendTicketEmail(result.booking, qr);
  } else if (result.reason === "TAKEN") {
    try {
      await refund(Number(txnId), Number(obj.amount_cents));
    } catch {
      /* logged via throw path */
    }
  }
  return NextResponse.json({ ok: true });
}
