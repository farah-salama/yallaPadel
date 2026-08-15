import Image from "next/image";
import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { CourtDiagram } from "@/components/court-diagram";
import { StatusChip } from "@/components/status-chip";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hourInCairo, formatMoney } from "@/lib/utils";

export default async function CourtsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSession();
  const q = await searchParams;
  const courts = await db.listCourts();
  const today = new Date();
  const cards = await Promise.all(
    courts.map(async (court) => {
      const slots = await db.slotsFor(court.id, today);
      const eveningFree = slots.filter((s) => hourInCairo(s.start) >= 18 && s.status === "FREE").length;
      return { court, eveningFree };
    }),
  );
  return (
    <div className="min-h-screen pb-20">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="label">Sheikh Zayed</p>
        <h1 className="mt-3 font-display text-5xl sm:text-7xl">COURTS ARE OPEN.</h1>
        {q.error === "hold" || q.error === "booking" ? (
          <p className="mt-4 text-sm text-danger">That slot didn&apos;t lock. Pick a time again.</p>
        ) : null}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {cards.map(({ court, eveningFree }) => (
              <article key={court.id} className="panel overflow-hidden">
                {court.imageUrl ? (
                  <div className="relative h-56 w-full bg-bg-2">
                    <Image
                      src={court.imageUrl}
                      alt={court.name}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-bg-2 p-6">
                    <CourtDiagram accent className="h-40" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-4xl">{court.name}</h2>
                      <p className="mt-1 text-mute">{court.type}</p>
                    </div>
                    <StatusChip status={eveningFree ? "AVAILABLE" : "BOOKED"} />
                  </div>
                  <p className="mt-4 text-sm text-mute">{court.location}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-mute">
                    {eveningFree ? "Available tonight" : "Packed tonight"}
                  </p>
                  <div className="mt-8 flex items-end justify-between">
                    <div>
                      <p className="label">From</p>
                      <p className="font-mono text-2xl">{formatMoney(court.offPeakPriceCents)}</p>
                    </div>
                    <Link
                      href={`/courts/${court.slug}`}
                      className="rounded-full bg-lime px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-bg"
                    >
                      View slots
                    </Link>
                  </div>
                </div>
              </article>
          ))}
        </div>
      </div>
    </div>
  );
}
