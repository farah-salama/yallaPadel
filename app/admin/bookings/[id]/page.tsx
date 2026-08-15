import { notFound } from "next/navigation";
import { PlayerSlots } from "@/components/player-slots";
import { StatusChip } from "@/components/status-chip";
import { db } from "@/lib/db";
import { adminUpdateBookingAction, cancelBookingAction } from "@/lib/actions";
import { formatDate, formatMoney, formatTime } from "@/lib/utils";

export default async function AdminBookingEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await db.getBooking(id);
  if (!booking) notFound();
  const freeSlots = (await db.slotsFor(booking.courtId, booking.slot.start)).filter((s) => s.status === "FREE" || s.id === booking.slotId);
  return (
    <div className="max-w-xl">
      <p className="label">Edit</p>
      <h1 className="mt-3 font-display text-4xl">{booking.code}</h1>
      <div className="mt-4">
        <StatusChip status={booking.status} />
      </div>
      <p className="mt-4 text-mute">
        {booking.user.name} · {booking.court.name} · {formatDate(booking.slot.start)} {formatTime(booking.slot.start)} · deposit{" "}
        {formatMoney(booking.depositCents)} · remaining {formatMoney(booking.remainingCents)}
      </p>
      <form action={adminUpdateBookingAction} className="mt-8 space-y-5">
        <input type="hidden" name="bookingId" value={booking.id} />
        <label className="block">
          <span className="label">Status</span>
          <select name="status" defaultValue={booking.status} className="mt-2 w-full rounded-2xl border border-white/10 bg-card px-4 py-3">
            {["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "CHECKED_IN", "NO_SHOW"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Move slot</span>
          <select name="slotId" defaultValue={booking.slotId} className="mt-2 w-full rounded-2xl border border-white/10 bg-card px-4 py-3">
            {freeSlots.map((s) => (
              <option key={s.id} value={s.id}>
                {formatTime(s.start)} {s.id === booking.slotId ? "(current)" : ""}
              </option>
            ))}
          </select>
        </label>
        <PlayerSlots names={booking.playerNames} />
        <button className="rounded-full bg-lime px-6 py-3 text-xs uppercase tracking-[0.2em] text-bg">Save</button>
      </form>
      {booking.status === "CONFIRMED" ? (
        <form action={cancelBookingAction} className="mt-6">
          <input type="hidden" name="bookingId" value={booking.id} />
          <button className="text-xs uppercase tracking-[0.2em] text-danger">Cancel & refund</button>
        </form>
      ) : null}
    </div>
  );
}
