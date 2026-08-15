import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { PlayerNav } from "@/components/player-nav";
import { AuthField } from "@/components/auth-field";
import { getSession } from "@/lib/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; ref?: string }>;
}) {
  const user = await getSession();
  const q = await searchParams;
  const next = q.next || "/courts";
  const loginHref = `/login?next=${encodeURIComponent(next)}`;

  return (
    <div className="min-h-screen pb-20">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-md px-5 py-16">
        <p className="label">New player</p>
        <h1 className="mt-4 font-display text-5xl">SIGN UP.</h1>
        <p className="mt-3 text-mute">Create an account to hold a slot and pay the deposit.</p>
        {q.error === "taken" ? <p className="mt-4 text-sm text-danger">Email already used.</p> : null}
        <form action={registerAction} className="mt-10 space-y-4">
          <input type="hidden" name="next" value={next} />
          <AuthField name="name" label="Name" />
          <AuthField name="email" label="Email" type="email" />
          <AuthField name="password" label="Password" type="password" />
          <AuthField name="ref" label="Referral code" defaultValue={q.ref || ""} />
          <button className="w-full rounded-full bg-lime py-4 text-sm font-medium uppercase tracking-[0.22em] text-bg">
            Create account →
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-mute">
          Already play here?{" "}
          <Link href={loginHref} className="text-lime">
            Sign in
          </Link>
        </p>
        <p className="mt-6 text-center text-xs text-mute">
          <Link href="/">Back home</Link>
        </p>
      </div>
    </div>
  );
}
