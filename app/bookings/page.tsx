import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { StatusChip } from "@/components/status-chip";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/utils";

export default async function BookingsPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/bookings");
  const list = user.role === "ADMIN" ? db.allBookings() : db.bookingsForUser(user.id);
  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-3xl px-5 py-12">
        <p className="label">Reservations</p>
        <h1 className="mt-3 font-display text-5xl">{list.length ? "YOUR COURTS." : "QUIET COURT."}</h1>
        {!list.length ? <p className="mt-3 text-mute">For now.</p> : null}
        <div className="mt-10 space-y-3">
          {list.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`} className="panel flex items-center justify-between p-5">
              <div>
                <p className="font-display text-2xl">{b.court.name}</p>
                <p className="font-mono text-sm text-mute">
                  {formatDate(b.slot.start)} · {formatTime(b.slot.start)}
                </p>
              </div>
              <StatusChip
                status={
                  b.status === "CHECKED_IN"
                    ? "REDEEMED"
                    : b.status === "PENDING_PAYMENT"
                      ? "PROCESSING"
                      : b.status
                }
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
