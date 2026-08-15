import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatTime } from "@/lib/utils";

export default async function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await db.getProfile(id);
  if (!person) notFound();
  const list = await db.bookingsForUser(id);
  const spent = list
    .filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN")
    .reduce((s, b) => s + b.depositCents, 0);
  const noshow = list.filter((b) => b.status === "NO_SHOW").length;
  const last = list.find((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN");
  return (
    <div>
      <p className="label">Player since {person.createdAt.getFullYear()}</p>
      <h1 className="mt-3 font-display text-6xl">{person.name.toUpperCase()}</h1>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat k="Matches" v={String(list.filter((b) => !["CANCELLED", "PENDING_PAYMENT"].includes(b.status)).length)} />
        <Stat k="Spent" v={formatMoney(spent)} />
        <Stat k="Points" v={String(person.points)} />
        <Stat k="No-shows" v={String(noshow)} />
        <Stat k="Last played" v={last ? formatDate(last.slot.start) : "—"} />
      </div>
      <p className="mt-4 font-mono text-sm text-mute">Referral {person.referralCode}</p>
      <p className="label mt-12">Recent bookings</p>
      <div className="mt-4 space-y-2">
        {list.slice(0, 8).map((b) => (
          <div key={b.id} className="panel flex justify-between p-4 text-sm">
            <span>
              {b.court.name} · {formatTime(b.slot.start)}
            </span>
            <span className="text-mute">{b.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="panel p-5">
      <p className="label">{k}</p>
      <p className="mt-3 font-mono text-2xl text-lime">{v}</p>
    </div>
  );
}
