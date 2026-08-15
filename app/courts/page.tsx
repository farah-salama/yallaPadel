import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { CourtDiagram } from "@/components/court-diagram";
import { StatusChip } from "@/components/status-chip";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hourInCairo, formatMoney } from "@/lib/utils";

export default async function CourtsPage() {
  const user = await getSession();
  const courts = db.listCourts();
  const today = new Date();
  return (
    <div className="min-h-screen pb-20">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="label">Sheikh Zayed</p>
        <h1 className="mt-3 font-display text-5xl sm:text-7xl">COURTS ARE OPEN.</h1>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {courts.map((court) => {
            const slots = db.slotsFor(court.id, today);
            const eveningFree = slots.filter((s) => hourInCairo(s.start) >= 18 && s.status === "FREE").length;
            return (
              <article key={court.id} className="panel overflow-hidden">
                <div className="bg-bg-2 p-6">
                  <CourtDiagram accent className="h-40" />
                </div>
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
