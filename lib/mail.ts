import { Resend } from "resend";
import type { BookingView, WaitlistNotice } from "./types";
import { formatDate, formatMoney, formatTime } from "./utils";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const from = process.env.RESEND_FROM || "YallaPadel <bookings@yallapadel.club>";

export async function sendTicketEmail(booking: BookingView, qrDataUrl?: string) {
  const resend = client();
  if (!resend) {
    console.info("[mail] ticket", booking.code, booking.user.email);
    return;
  }
  await resend.emails.send({
    from,
    to: booking.user.email,
    subject: `YOU'RE IN — ${booking.court.name} ${formatTime(booking.slot.start)}`,
    html: `
      <div style="background:#080B09;color:#F4F7F2;font-family:sans-serif;padding:32px">
        <p style="letter-spacing:.3em;color:#C8FF00;font-size:12px">YALLAPADEL</p>
        <h1>YOU'RE IN.</h1>
        <p>${booking.court.name} · ${formatDate(booking.slot.start)} · ${formatTime(booking.slot.start)}–${formatTime(booking.slot.end)}</p>
        <p>Code <strong>${booking.code}</strong> · Deposit ${formatMoney(booking.depositCents)} paid. Remaining at court: ${formatMoney(booking.remainingCents)}.</p>
        ${qrDataUrl ? `<img src="${qrDataUrl}" width="180" alt="QR ticket" />` : ""}
      </div>
    `,
  });
}

export async function sendCancelEmail(booking: BookingView) {
  const resend = client();
  const admin = process.env.ADMIN_EMAIL;
  if (!resend) {
    console.info("[mail] cancel", booking.code, booking.refundStatus, booking.refundCents);
    return;
  }
  const body = `
    <p>${booking.user.name} cancelled ${booking.code} (${booking.court.name} ${formatTime(booking.slot.start)}).</p>
    <p>Policy refund: ${formatMoney(booking.refundCents)} · status ${booking.refundStatus}</p>
  `;
  await resend.emails.send({
    from,
    to: booking.user.email,
    subject: `Cancelled — ${booking.code}`,
    html: body,
  });
  if (admin) {
    await resend.emails.send({ from, to: admin, subject: `Refund ${booking.code}`, html: body });
  }
}

export async function sendWaitlistEmail(notice: WaitlistNotice) {
  const resend = client();
  const flash = notice.flashPercent ? ` Flash: ${notice.flashPercent}% off for 15 minutes.` : "";
  if (!resend) {
    console.info("[mail] waitlist", notice.email, notice.courtName, notice.slotId, flash);
    return;
  }
  await resend.emails.send({
    from,
    to: notice.email,
    subject: `COURT OPEN — ${notice.courtName} ${formatTime(notice.start)}`,
    html: `
      <div style="background:#080B09;color:#F4F7F2;font-family:sans-serif;padding:32px">
        <p style="letter-spacing:.3em;color:#C8FF00;font-size:12px">YALLAPADEL</p>
        <h1>THE COURT IS WAITING.</h1>
        <p>${notice.courtName} at ${formatTime(notice.start)} just opened.${flash}</p>
      </div>
    `,
  });
}

export async function sendJoinEmail(to: string, guestName: string, court: string) {
  const resend = client();
  if (!resend) {
    console.info("[mail] join", to, guestName, court);
    return;
  }
  await resend.emails.send({
    from,
    to,
    subject: `${guestName} wants to join your court`,
    html: `<p>${guestName} requested to join your game on ${court}.</p>`,
  });
}
