import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { SlotTimeline } from "@/components/slot-timeline";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, cairoDate, cairoParts, formatDate, startOfCairoDay } from "@/lib/utils";

export default async function CourtSlotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const user = await getSession();
  const court = await db.getCourt(id);
  if (!court) notFound();

  const today = startOfCairoDay();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const selected = q.d
    ? cairoDate(Number(q.d.slice(0, 4)), Number(q.d.slice(5, 7)), Number(q.d.slice(8, 10)))
    : today;
  const slots = await db.slotsFor(court.id, selected);
  const key = (d: Date) => {
    const p = cairoParts(d);
    return `${p.year}-${p.month}-${p.day}`;
  };

  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-3xl px-5 py-10">
        <p className="label">{court.location}</p>
        <h1 className="mt-3 font-display text-5xl">{court.name}</h1>
        <p className="mt-2 text-mute">{court.type} · peak {court.peakPriceCents / 100} EGP · morning {court.offPeakPriceCents / 100} EGP</p>
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const k = key(d);
            const active = k === key(selected);
            return (
              <Link
                key={k}
                href={`/courts/${court.slug}?d=${k}`}
                className={`min-w-[88px] rounded-2xl border px-3 py-3 text-center text-xs uppercase tracking-[0.16em] ${
                  active ? "border-lime/50 bg-lime/10 text-lime" : "border-white/10 text-mute"
                }`}
              >
                {formatDate(d, { weekday: "short", day: "numeric", month: "short" })}
              </Link>
            );
          })}
        </div>
        <div className="mt-8">
          <SlotTimeline
            slots={slots}
            courtId={court.id}
            canWaitlist={Boolean(user)}
            waitlistedIds={user ? await db.waitlistedSlotIds(user.id) : []}
            back={`/courts/${court.slug}?d=${key(selected)}`}
          />
        </div>
      </div>
    </div>
  );
}
