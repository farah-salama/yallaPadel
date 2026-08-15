import { db } from "@/lib/db";
import { adminMorningPromoAction } from "@/lib/actions";
import { formatTime } from "@/lib/utils";

export default async function AdminPromotions() {
  const promos = await db.listPromotions();
  const morning = promos.find((p) => p.kind === "MORNING");
  const flashes = promos.filter((p) => p.kind === "FLASH" && p.active);
  const courts = await db.listCourts();
  const slots = await db.allSlotsOn(new Date());
  return (
    <div>
      <p className="label">Growth</p>
      <h1 className="mt-3 font-display text-5xl">PROMOTIONS.</h1>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <form action={adminMorningPromoAction} className="panel p-6">
          <p className="label">Morning boost</p>
          <h2 className="mt-3 font-display text-4xl">FILL THE QUIET HOURS</h2>
          <p className="mt-2 text-mute">08:00 — 12:00 · extra % on the morning rate.</p>
          <p className="mt-4 font-mono text-3xl text-lime">{morning?.percentOff ?? 30}% OFF</p>
          <p className="mt-2 text-sm text-mute">{morning?.active ? "Active" : "Inactive"}</p>
          <input type="hidden" name="percent" value={String(morning?.percentOff ?? 30)} />
          <input type="hidden" name="active" value={morning?.active ? "0" : "1"} />
          <button className="mt-6 rounded-full bg-lime px-6 py-3 text-xs uppercase tracking-[0.2em] text-bg">
            {morning?.active ? "Deactivate deal" : "Activate deal"}
          </button>
        </form>
        <div className="panel p-6">
          <p className="label">Flash</p>
          <h2 className="mt-3 font-display text-3xl">CANCEL DROPS</h2>
          <p className="mt-2 text-mute">20% off for 15 minutes after a cancellation.</p>
          <div className="mt-6 space-y-2">
            {flashes.length ? (
              flashes.map((f) => {
                const slot = slots.find((s) => s.id === f.slotId);
                const court = slot ? courts.find((c) => c.id === slot.courtId) : null;
                return (
                  <div key={f.id} className="rounded-xl border border-lime/20 px-3 py-2 text-sm">
                    {court?.name} · {slot ? formatTime(slot.start) : f.slotId} · {f.percentOff}% · used {f.usageCount}
                  </div>
                );
              })
            ) : (
              <p className="text-mute">No live flash deals. Cancel a booking to drop one.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
