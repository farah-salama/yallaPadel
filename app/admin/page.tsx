import { LiveCourtBoard } from "@/components/live-court-board";
import { DaySchedule } from "@/components/day-schedule";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney, greeting } from "@/lib/utils";

export default async function AdminHome() {
  const user = await getSession();
  const stats = db.statsToday();
  const courts = db.listCourts();
  const slots = db.allSlotsOn(new Date());
  return (
    <div>
      <p className="label">{greeting()}, {user?.name.toUpperCase()}.</p>
      <h1 className="mt-3 font-display text-5xl">TODAY.</h1>
      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat k="Bookings" v={String(stats.bookings)} />
        <Stat k="Revenue" v={formatMoney(stats.revenue)} />
        <Stat k="Occupancy" v={`${stats.occupancy}%`} />
        <Stat k="No-shows" v={String(stats.noShows)} />
      </div>
      <div className="mt-10">
        <p className="label mb-4">Live courts</p>
        <LiveCourtBoard courts={courts} slots={slots} />
      </div>
      <div className="mt-10">
        <DaySchedule courts={courts} slots={slots} />
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="panel p-5">
      <p className="label">{k}</p>
      <p className="mt-4 font-mono text-4xl text-lime">{v}</p>
    </div>
  );
}
