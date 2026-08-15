import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { PlayerNav } from "@/components/player-nav";
import { getSession } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const user = await getSession();
  const q = await searchParams;
  return (
    <div className="min-h-screen">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-md px-5 py-20">
        <p className="label">Access</p>
        <h1 className="mt-4 font-display text-5xl">SIGN IN.</h1>
        <p className="mt-3 text-mute">Email and password. Demo: mostafa@yallapadel.club / padel123 or omar@yallapadel.club / padel123</p>
        {q.error ? <p className="mt-4 text-sm text-danger">Wrong email or password.</p> : null}
        <form action={loginAction} className="mt-10 space-y-4">
          <input type="hidden" name="next" value={q.next || "/courts"} />
          <label className="block">
            <span className="label">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-card px-4 py-3 outline-none focus:border-lime/40"
            />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-card px-4 py-3 outline-none focus:border-lime/40"
            />
          </label>
          <button className="w-full rounded-full bg-lime py-4 text-sm font-medium uppercase tracking-[0.22em] text-bg">
            Enter →
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-mute">
          <Link href="/">Back home</Link>
        </p>
      </div>
    </div>
  );
}
