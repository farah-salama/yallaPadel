import { formatDate, formatTime } from "@/lib/utils";
import type { BookingView } from "@/lib/types";
import { StatusChip } from "./status-chip";

export function BookingPass({
  booking,
  qrDataUrl,
}: {
  booking: BookingView;
  qrDataUrl: string;
}) {
  const status =
    booking.status === "CHECKED_IN"
      ? "REDEEMED"
      : booking.status === "CANCELLED"
        ? "CANCELLED"
        : booking.status === "PENDING_PAYMENT"
          ? "PROCESSING"
          : "PAID";
  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-lime/30 bg-gradient-to-b from-card-2 to-bg p-6 shadow-glow">
      <div className="flex items-center justify-between">
        <p className="label text-lime">YallaPadel</p>
        <StatusChip status={status} />
      </div>
      <h2 className="mt-8 font-display text-5xl tracking-tight">{booking.court.name}</h2>
      <p className="mt-4 font-mono text-2xl text-lime">
        {formatTime(booking.slot.start)} — {formatTime(booking.slot.end)}
      </p>
      <p className="mt-1 text-sm uppercase tracking-[0.2em] text-mute">{formatDate(booking.slot.start)}</p>
      <div className="mx-auto my-8 w-48 rounded-2xl bg-lime p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Booking QR" className="h-full w-full" />
      </div>
      <p className="text-center font-mono text-lg tracking-[0.35em]">{booking.code}</p>
      <p className="mt-3 text-center text-xs text-mute">Show this pass at the glass. Remaining due at court.</p>
    </div>
  );
}
