"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, getSession, setDemoSession } from "@/lib/auth";
import { checkoutUrl, createIntention, paymobConfigured, refund, voidTxn } from "@/lib/paymob";
import { sendCancelEmail, sendJoinEmail, sendTicketEmail, sendWaitlistEmail } from "@/lib/mail";
import { bookingQrDataUrl } from "@/lib/qr";
import { cairoParts } from "@/lib/utils";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/courts");
  const user = await db.findByEmail(email);
  if (!user || user.password !== password) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  await setDemoSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : next || "/courts");
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "");
  const ref = String(formData.get("ref") || "");
  const next = String(formData.get("next") || "/courts");
  try {
    const user = await db.register({ email, password, name, ref: ref || undefined });
    await setDemoSession(user.id);
  } catch (e) {
    const params = new URLSearchParams({ next });
    if (ref) params.set("ref", ref);
    params.set("error", e instanceof Error && e.message === "EMAIL_TAKEN" ? "taken" : "db");
    redirect(`/signup?${params.toString()}`);
  }
  redirect(next || "/courts");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function holdAndPayAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login?next=/courts");
  const slotId = String(formData.get("slotId"));
  const names = [1, 2, 3, 4].map((n) => String(formData.get(`p${n}`) || "").trim());
  if (!names[0]) names[0] = user.name;
  let booking;
  try {
    await db.ensureProfile(user);
    ({ booking } = await db.holdSlot(slotId, user.id, names));
  } catch {
    redirect("/courts?error=hold");
  }
  redirect(`/book/${booking.id}`);
}

export async function startCheckoutAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  const bookingId = String(formData.get("bookingId"));
  const usePoints = String(formData.get("redeem") || "") === "1";
  const booking = (await db.applyLoyalty(bookingId, user.id, usePoints)) ?? (await db.getBooking(bookingId));
  if (!booking || booking.userId !== user.id) redirect("/bookings");

  const [first, ...rest] = user.name.split(" ");
  if (paymobConfigured()) {
    const intention = await createIntention({
      amountCents: booking.depositCents,
      specialReference: booking.id,
      customer: {
        firstName: first || "Player",
        lastName: rest.join(" ") || "Yalla",
        email: user.email,
        phone: user.phone,
      },
      items: [
        {
          name: `${booking.court.name} deposit`,
          amount: booking.depositCents,
          quantity: 1,
          description: `${booking.code} ${cairoParts(booking.slot.start).hour}:00`,
        },
      ],
    });
    await db.attachPayment(booking.id, {
      amountCents: booking.depositCents,
      userId: user.id,
      paymobIntentionId: intention.id,
      clientSecret: intention.clientSecret,
      status: "PENDING",
    });
    redirect(checkoutUrl(intention.clientSecret));
  }

  await db.attachPayment(booking.id, {
    amountCents: booking.depositCents,
    userId: user.id,
    status: "PENDING",
  });
  redirect(`/pay/${booking.id}`);
}

export async function demoConfirmAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  const bookingId = String(formData.get("bookingId"));
  const usePoints = String(formData.get("redeem") || "") === "1";
  const result = await db.demoPay(bookingId, usePoints);
  if (result.ok) {
    const qr = await bookingQrDataUrl(result.booking.qrToken);
    await sendTicketEmail(result.booking, qr);
    redirect(`/bookings/${result.booking.id}?welcome=1`);
  }
  redirect(`/pay/${bookingId}?error=taken`);
}

export async function savePlayersAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  const id = String(formData.get("bookingId"));
  const booking = await db.getBooking(id);
  if (!booking || (booking.userId !== user.id && user.role !== "ADMIN")) return;
  const names = [1, 2, 3, 4].map((n) => String(formData.get(`p${n}`) || "").trim());
  await db.updatePlayers(id, names);
}

export async function cancelBookingAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  const id = String(formData.get("bookingId"));
  const booking = await db.getBooking(id);
  if (!booking || (booking.userId !== user.id && user.role !== "ADMIN")) redirect("/bookings");
  const cancelled = await db.cancel(id);
  const txn = cancelled.payments.find((p) => p.paymobTxnId);
  if (paymobConfigured() && cancelled.refundCents > 0 && txn?.paymobTxnId) {
    try {
      const txnId = Number(txn.paymobTxnId);
      const sameDay = cairoParts(cancelled.createdAt).day === cairoParts().day;
      if (sameDay) await voidTxn(txnId);
      else await refund(txnId, cancelled.refundCents);
      await db.markRefund(id, "REFUNDED");
    } catch {
      await db.markRefund(id, "FAILED");
    }
  }
  await sendCancelEmail((await db.getBooking(id))!);
  for (const n of await db.takeWaitlistNotices()) await sendWaitlistEmail(n);
  redirect(`/bookings/${id}?cancelled=1`);
}

export async function joinWaitlistAction(formData: FormData) {
  const user = await getSession();
  const slotId = String(formData.get("slotId"));
  const back = String(formData.get("back") || "/courts");
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  await db.joinWaitlist(slotId, user.id);
  redirect(back);
}

export async function leaveWaitlistAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  await db.leaveWaitlist(String(formData.get("slotId")), user.id);
  redirect("/waitlist");
}

export async function requestFriendAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login?next=/friends");
  try {
    await db.requestFriend(user.id, String(formData.get("email") || ""));
  } catch {
    redirect("/friends?error=1");
  }
  redirect("/friends");
}

export async function answerFriendAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  await db.answerFriend(String(formData.get("id")), user.id, String(formData.get("accept")) === "1");
  redirect("/friends");
}

export async function toggleOpenAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  const id = String(formData.get("bookingId"));
  const booking = await db.getBooking(id);
  if (!booking || booking.userId !== user.id) return;
  await db.setOpenToJoin(id, String(formData.get("open")) === "1");
  redirect(`/bookings/${id}`);
}

export async function requestJoinAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login?next=/join");
  const bookingId = String(formData.get("bookingId"));
  try {
    await db.requestJoin(bookingId, user.id);
    const booking = await db.getBooking(bookingId);
    if (booking) await sendJoinEmail(booking.user.email, user.name, booking.court.name);
  } catch {
    redirect("/join?error=1");
  }
  redirect("/join?sent=1");
}

export async function answerJoinAction(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  await db.answerJoin(String(formData.get("id")), user.id, String(formData.get("accept")) === "1");
  redirect(`/bookings/${String(formData.get("bookingId"))}`);
}

export async function adminMorningPromoAction(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") redirect("/login");
  const active = String(formData.get("active")) === "1";
  const percent = Number(formData.get("percent") || 30);
  await db.setMorningPromo(active, percent);
  redirect("/admin/promotions");
}

export async function redeemAction(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") redirect("/login");
  const token = String(formData.get("token") || "").trim();
  const result = await db.redeem(token);
  if (result.ok) redirect(`/admin/check-in?ok=${result.booking.id}`);
  if (result.reason === "ALREADY") redirect(`/admin/check-in?already=${result.booking?.id}`);
  if (result.reason === "INVALID") redirect(`/admin/check-in?invalid=${result.booking?.id}`);
  redirect("/admin/check-in?missing=1");
}

export async function adminUpdateBookingAction(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") redirect("/login");
  const id = String(formData.get("bookingId"));
  const status = String(formData.get("status") || "");
  const slotId = String(formData.get("slotId") || "");
  const names = [1, 2, 3, 4].map((n) => String(formData.get(`p${n}`) || "").trim());
  await db.updateBooking(id, {
    ...(status ? { status: status as never } : {}),
    ...(slotId ? { slotId } : {}),
    playerNames: names,
  });
  redirect(`/admin/bookings/${id}`);
}

export async function adminUpdateCourtAction(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") redirect("/login");
  const id = String(formData.get("courtId"));
  await db.updateCourt(id, {
    name: String(formData.get("name")),
    type: String(formData.get("type")),
    location: String(formData.get("location")),
    peakPriceCents: Math.round(Number(formData.get("peak")) * 100),
    offPeakPriceCents: Math.round(Number(formData.get("offPeak")) * 100),
    openingTime: String(formData.get("opening")),
    closingTime: String(formData.get("closing")),
    offPeakEnd: String(formData.get("offPeakEnd")),
    status: String(formData.get("status")) === "MAINTENANCE" ? "MAINTENANCE" : "ACTIVE",
  });
  redirect("/admin/courts");
}
