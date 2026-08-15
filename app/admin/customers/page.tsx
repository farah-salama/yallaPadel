import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export default async function AdminCustomers() {
  const people = (await db.listProfiles()).filter((p) => p.role === "PLAYER");
  const cards = await Promise.all(
    people.map(async (p) => {
      const list = await db.bookingsForUser(p.id);
      const spent = list
        .filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN")
        .reduce((s, b) => s + b.depositCents, 0);
      return { p, list, spent };
    }),
  );
  return (
    <div>
      <p className="label">Club</p>
      <h1 className="mt-3 font-display text-5xl">PLAYERS.</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {cards.map(({ p, list, spent }) => (
            <Link key={p.id} href={`/admin/customers/${p.id}`} className="panel p-6">
              <h2 className="font-display text-3xl">{p.name.toUpperCase()}</h2>
              <p className="mt-1 text-sm text-mute">{p.email}</p>
              <p className="mt-4 font-mono text-lime">{formatMoney(spent)}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-mute">{list.length} bookings</p>
            </Link>
        ))}
      </div>
    </div>
  );
}
