import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { HoldCountdown } from "@/components/hold-countdown";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { startCheckoutAction } from "@/lib/actions";
import { formatDate, formatMoney, formatTime } from "@/lib/utils";

export default async function BookHoldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");
  const booking = db.getBooking(id);
  if (!booking) notFound();
  if (booking.userId !== user.id && user.role !== "ADMIN") redirect("/bookings");
  const slot = booking.slot;
  const expired = slot.status !== "HOLDING" && booking.status === "PENDING_PAYMENT";

  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-xl px-5 py-12 text-center">
        <p className="label">{expired ? "Slot released" : "Slot reserved"}</p>
        <h1 className="mt-4 font-display text-5xl">{expired ? "↻ SLOT RELEASED" : "HELD."}</h1>
        <p className="mt-4 text-mute">
          {booking.court.name} · {formatDate(slot.start)} · {formatTime(slot.start)} — {formatTime(slot.end)}
        </p>
        {!expired && slot.holdExpiresAt ? (
          <div className="mt-10">
            <HoldCountdown expiresAt={slot.holdExpiresAt} />
            <p className="mt-4 text-sm text-mute">Your slot is held while payment is completed.</p>
          </div>
        ) : (
          <Link href={`/courts/${booking.court.slug}`} className="mt-8 inline-block text-lime">
            Pick another slot
          </Link>
        )}
        {!expired ? (
          <form action={startCheckoutAction} className="mt-10">
            <input type="hidden" name="bookingId" value={booking.id} />
            <button className="w-full rounded-full bg-lime py-4 text-sm font-medium uppercase tracking-[0.22em] text-bg shadow-glow">
              Continue to payment · {formatMoney(booking.depositCents)}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
