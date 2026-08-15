import { notFound, redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { HoldCountdown } from "@/components/hold-countdown";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { demoConfirmAction, startCheckoutAction } from "@/lib/actions";
import { formatDate, formatMoney, formatTime } from "@/lib/utils";
import { paymobConfigured } from "@/lib/paymob";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const user = await getSession();
  if (!user) redirect("/login");
  const booking = db.getBooking(id);
  if (!booking) notFound();
  const live = paymobConfigured();
  const held = booking.slot.status === "HOLDING" && booking.slot.holdExpiresAt;

  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-lg px-5 py-12">
        <p className="label">Pay & reserve</p>
        <h1 className="mt-3 font-display text-5xl">{q.error === "taken" ? "SLOT TAKEN." : "LOCK IT IN."}</h1>
        {q.error ? <p className="mt-3 text-danger">Payment didn&apos;t go through. Your slot may still be held.</p> : null}
        <div className="panel mt-8 divide-y divide-white/[0.06] p-6 text-sm">
          <Row k={booking.court.name} v={`${formatDate(booking.slot.start)}`} />
          <Row k="Time" v={`${formatTime(booking.slot.start)} — ${formatTime(booking.slot.end)}`} />
          <Row k="Court" v={formatMoney(booking.totalCents)} />
          <Row k="Deposit due now (50%)" v={formatMoney(booking.depositCents)} />
          <Row k="Remaining at court" v={formatMoney(booking.remainingCents)} />
          <Row k="Total" v={formatMoney(booking.totalCents)} strong />
        </div>
        {held ? (
          <div className="mt-8">
            <HoldCountdown expiresAt={booking.slot.holdExpiresAt!} />
            <p className="mt-2 text-center text-sm text-mute">Your slot is still held.</p>
          </div>
        ) : null}
        <form action={live ? startCheckoutAction : demoConfirmAction} className="mt-8">
          <input type="hidden" name="bookingId" value={booking.id} />
          <button className="w-full rounded-full bg-lime py-4 text-sm font-medium uppercase tracking-[0.22em] text-bg shadow-glow">
            {live ? "Pay & reserve →" : "Pay & reserve (demo) →"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-mute">
          {live ? "You will be redirected to Paymob Unified Checkout." : "Demo mode — no live charge. Add Paymob keys to go live."}
        </p>
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${strong ? "font-medium text-lime" : ""}`}>
      <span className="text-mute">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}
