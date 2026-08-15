import { redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile");
  const list = db.bookingsForUser(user.id);
  const spent = list
    .filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN")
    .reduce((s, b) => s + b.depositCents, 0);
  const noshow = list.filter((b) => b.status === "NO_SHOW").length;
  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-3xl px-5 py-12">
        <p className="label">Player</p>
        <h1 className="mt-3 font-display text-6xl">{user.name.toUpperCase()}</h1>
        <p className="mt-2 text-mute">{user.email}</p>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat k="Player since" v={String(user.createdAt.getFullYear())} />
          <Stat k="Matches" v={String(list.filter((b) => b.status !== "CANCELLED" && b.status !== "PENDING_PAYMENT").length)} />
          <Stat k="Spent" v={formatMoney(spent)} />
          <Stat k="No-shows" v={String(noshow)} />
        </div>
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
