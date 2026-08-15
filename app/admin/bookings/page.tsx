import Link from "next/link";
import { StatusChip } from "@/components/status-chip";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatTime } from "@/lib/utils";

export default async function AdminBookings() {
  const list = await db.allBookings();
  return (
    <div>
      <p className="label">Ops</p>
      <h1 className="mt-3 font-display text-5xl">BOOKINGS.</h1>
      <div className="mt-8 space-y-2">
        {list.map((b) => (
          <Link key={b.id} href={`/admin/bookings/${b.id}`} className="panel flex items-center justify-between p-4">
            <div>
              <p className="font-display text-xl">
                {b.court.name} · {b.user.name}
              </p>
              <p className="font-mono text-xs text-mute">
                {formatDate(b.slot.start)} {formatTime(b.slot.start)} · {b.code} · {formatMoney(b.depositCents)}
              </p>
            </div>
            <StatusChip status={b.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
