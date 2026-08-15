import { redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveWaitlistAction } from "@/lib/actions";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";

export default async function WaitlistPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/waitlist");
  const list = await db.waitlistForUser(user.id);
  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-xl px-5 py-12">
        <p className="label">Alerts</p>
        <h1 className="mt-3 font-display text-5xl">{list.length ? "ON DECK." : "THE COURT IS WAITING."}</h1>
        <p className="mt-3 text-mute">We email you when a booked slot frees — including flash prices.</p>
        <div className="mt-10 space-y-3">
          {list.map((w) => (
            <div key={w.id} className="panel p-5">
              <p className="font-display text-2xl">{w.court.name}</p>
              <p className="font-mono text-sm text-mute">
                {formatDate(w.slot.start)} · {formatTime(w.slot.start)}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-mute">
                {w.notifiedAt ? "Notified" : "Watching"}
              </p>
              {!w.notifiedAt ? (
                <form action={leaveWaitlistAction} className="mt-3">
                  <input type="hidden" name="slotId" value={w.slotId} />
                  <button className="text-xs uppercase tracking-[0.2em] text-mute">Leave</button>
                </form>
              ) : (
                <Link href={`/hold/${w.slotId}`} className="mt-3 inline-block text-xs uppercase tracking-[0.2em] text-lime">
                  Book now
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
