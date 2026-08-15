import { redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { PlayerSlots } from "@/components/player-slots";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { holdAndPayAction } from "@/lib/actions";
import { formatDate, formatMoney, formatTime, slotPrice } from "@/lib/utils";

export default async function HoldPage({ params }: { params: Promise<{ slotId: string }> }) {
  const { slotId } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?next=/hold/${slotId}`);
  const slot = db.getSlot(slotId);
  if (!slot) redirect("/courts");
  const court = db.getCourt(slot.courtId);
  if (!court) redirect("/courts");
  const total = slotPrice(court.peakPriceCents, court.offPeakPriceCents, slot.start, court.offPeakEnd);

  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-xl px-5 py-12">
        <p className="label">Reserve</p>
        <h1 className="mt-3 font-display text-5xl">LOCK THE SLOT.</h1>
        <div className="panel mt-8 p-6">
          <p className="label">{court.name}</p>
          <p className="mt-2 font-mono text-2xl text-lime">
            {formatTime(slot.start)} — {formatTime(slot.end)}
          </p>
          <p className="text-mute">{formatDate(slot.start)}</p>
          <p className="mt-4 font-mono">{formatMoney(total)}</p>
        </div>
        <form action={holdAndPayAction} className="mt-8 space-y-8">
          <input type="hidden" name="slotId" value={slot.id} />
          <PlayerSlots names={[user.name]} />
          <button className="w-full rounded-full bg-lime py-4 text-sm font-medium uppercase tracking-[0.22em] text-bg shadow-glow">
            Hold for 5 minutes →
          </button>
        </form>
      </div>
    </div>
  );
}
