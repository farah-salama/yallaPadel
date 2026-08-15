import { redirect } from "next/navigation";
import { PlayerNav } from "@/components/player-nav";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { answerFriendAction, requestFriendAction } from "@/lib/actions";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login?next=/friends");
  const friends = await db.friendsOf(user.id);
  const reqs = await db.friendRequests(user.id);
  const q = await searchParams;
  return (
    <div className="min-h-screen pb-24">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-xl px-5 py-12">
        <p className="label">Squad</p>
        <h1 className="mt-3 font-display text-5xl">FRIENDS.</h1>
        {q.error ? <p className="mt-3 text-danger">Couldn&apos;t find that email.</p> : null}
        <form action={requestFriendAction} className="mt-8 flex gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="friend@email.com"
            className="flex-1 rounded-2xl border border-white/10 bg-card px-4 py-3 outline-none"
          />
          <button className="rounded-full bg-lime px-5 text-xs uppercase tracking-[0.2em] text-bg">Add</button>
        </form>
        {reqs.incoming.length ? (
          <div className="mt-10 space-y-2">
            <p className="label">Requests</p>
            {reqs.incoming.map((r) => (
              <form key={r.id} action={answerFriendAction} className="panel flex items-center justify-between p-4">
                <input type="hidden" name="id" value={r.id} />
                <span>{r.user.name}</span>
                <div className="flex gap-3">
                  <button name="accept" value="1" className="text-xs uppercase tracking-[0.2em] text-lime">
                    Accept
                  </button>
                  <button name="accept" value="0" className="text-xs uppercase tracking-[0.2em] text-mute">
                    Decline
                  </button>
                </div>
              </form>
            ))}
          </div>
        ) : null}
        <div className="mt-10 space-y-2">
          {friends.length ? (
            friends.map((f) => (
              <div key={f.id} className="panel p-4">
                <p className="font-display text-2xl">{f.name}</p>
                <p className="text-sm text-mute">{f.email}</p>
              </div>
            ))
          ) : (
            <p className="text-mute">No friends yet. Add Omar or Lina from the demo accounts.</p>
          )}
        </div>
      </div>
    </div>
  );
}
