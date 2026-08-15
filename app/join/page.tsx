import { redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestJoinAction } from "@/lib/actions";
import { formatDate, formatTime } from "@/lib/utils";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login?next=/join");
  const games = (await db.openGames()).filter((g) => g.userId !== user.id);
  const q = await searchParams;
  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-xl px-5 py-12">
        <p className="label">Open games</p>
        <h1 className="mt-3 font-display text-5xl">{games.length ? "JUMP IN." : "QUIET COURT."}</h1>
        {q.sent ? <p className="mt-3 text-lime">Request sent.</p> : null}
        {q.error ? <p className="mt-3 text-danger">Couldn&apos;t join that game.</p> : null}
        <div className="mt-10 space-y-3">
          {games.map((g) => (
            <form key={g.id} action={requestJoinAction} className="panel p-5">
              <input type="hidden" name="bookingId" value={g.id} />
              <p className="font-display text-2xl">{g.court.name}</p>
              <p className="font-mono text-sm text-mute">
                {formatDate(g.slot.start)} · {formatTime(g.slot.start)} · {g.user.name}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-mute">
                {g.playerNames.filter(Boolean).length}/4 playing
              </p>
              <button className="mt-4 text-xs uppercase tracking-[0.2em] text-lime">Request to join</button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
