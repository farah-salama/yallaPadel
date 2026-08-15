import { notFound, redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { BookingPass } from "@/components/booking-pass";
import { PlayerSlots } from "@/components/player-slots";
import { StatusChip } from "@/components/status-chip";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { cancelBookingAction, savePlayersAction, toggleOpenAction, answerJoinAction } from "@/lib/actions";
import { bookingQrDataUrl } from "@/lib/qr";
import { formatMoney, hoursUntil, refundPercent } from "@/lib/utils";

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string; cancelled?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const user = await getSession();
  if (!user) redirect("/login");
  const booking = await db.getBooking(id);
  if (!booking) notFound();
  if (booking.userId !== user.id && user.role !== "ADMIN") redirect("/bookings");
  const qr = await bookingQrDataUrl(booking.qrToken);
  const pct = refundPercent(booking.slot.start);
  const hours = hoursUntil(booking.slot.start);
  const friends = await db.friendsOf(user.id);
  const requests = booking.userId === user.id ? (await db.joinRequestsForHost(user.id)).filter((r) => r.bookingId === booking.id) : [];

  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-lg px-5 py-12">
        <p className="label">{q.welcome ? "Confirmed" : "Pass"}</p>
        <h1 className="mt-3 font-display text-5xl">{q.welcome ? "YOU'RE IN." : booking.code}</h1>
        {q.cancelled ? (
          <div className="mt-4">
            <StatusChip status="CANCELLED" />
            <p className="mt-3 text-sm text-mute">
              Refund {formatMoney(booking.refundCents)} · {booking.refundStatus}
            </p>
          </div>
        ) : null}
        <div className="mt-8">
          <BookingPass booking={booking} qrDataUrl={qr} />
        </div>
        {booking.status === "CONFIRMED" || booking.status === "CHECKED_IN" ? (
          <form action={savePlayersAction} className="mt-10">
            <input type="hidden" name="bookingId" value={booking.id} />
            <PlayerSlots names={booking.playerNames} friends={friends} />
            <button className="mt-4 text-xs uppercase tracking-[0.2em] text-lime">Save players</button>
          </form>
        ) : null}
        {booking.status === "CONFIRMED" && booking.userId === user.id ? (
          <form action={toggleOpenAction} className="panel mt-8 flex items-center justify-between p-4">
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="open" value={booking.openToJoin ? "0" : "1"} />
            <div>
              <p className="label">Open to join</p>
              <p className="text-sm text-mute">{booking.openToJoin ? "Others can request a seat." : "Keep this private."}</p>
            </div>
            <button className="text-xs uppercase tracking-[0.2em] text-lime">{booking.openToJoin ? "Close" : "Open"}</button>
          </form>
        ) : null}
        {requests.length ? (
          <div className="mt-8 space-y-3">
            <p className="label">Join requests</p>
            {requests.map((r) => (
              <form key={r.id} action={answerJoinAction} className="panel flex items-center justify-between p-4">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <span>{r.user.name}</span>
                <div className="flex gap-3">
                  <button name="accept" value="1" className="text-xs uppercase tracking-[0.2em] text-lime">
                    Accept
                  </button>
                  <button name="accept" value="0" className="text-xs uppercase tracking-[0.2em] text-mute">
                    Decline
                  </button>
                </div>
              </form>
            ))}
          </div>
        ) : null}
        {booking.status === "CONFIRMED" ? (
          <form action={cancelBookingAction} className="mt-10">
            <input type="hidden" name="bookingId" value={booking.id} />
            <p className="text-sm text-mute">
              Cancel policy: {hours > 6 ? "full refund" : hours >= 2 ? "50% refund" : "no refund"} ({pct}%).
              Refunds go back through Paymob.
            </p>
            <button className="mt-4 w-full rounded-full border border-white/10 py-3 text-xs uppercase tracking-[0.2em] text-mute">
              Cancel booking
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
