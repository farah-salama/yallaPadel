import Link from "next/link";
import { loginAction, registerAction } from "@/lib/actions";
import { PlayerNav } from "@/components/player-nav";
import { getSession } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; ref?: string }>;
}) {
  const user = await getSession();
  const q = await searchParams;
  return (
    <div className="min-h-screen pb-20">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-md px-5 py-16">
        <p className="label">Access</p>
        <h1 className="mt-4 font-display text-5xl">SIGN IN.</h1>
        <p className="mt-3 text-mute">Demo: mostafa@ / omar@ / yasmin@yallapadel.club · padel123</p>
        {q.error === "taken" ? <p className="mt-4 text-sm text-danger">Email already used.</p> : null}
        {q.error === "1" ? <p className="mt-4 text-sm text-danger">Wrong email or password.</p> : null}
        <form action={loginAction} className="mt-10 space-y-4">
          <input type="hidden" name="next" value={q.next || "/courts"} />
          <Field name="email" label="Email" type="email" />
          <Field name="password" label="Password" type="password" />
          <button className="w-full rounded-full bg-lime py-4 text-sm font-medium uppercase tracking-[0.22em] text-bg">
            Enter →
          </button>
        </form>
        <p className="label mt-14">New player</p>
        <form action={registerAction} className="mt-4 space-y-4">
          <input type="hidden" name="next" value={q.next || "/courts"} />
          <Field name="name" label="Name" />
          <Field name="email" label="Email" type="email" />
          <Field name="password" label="Password" type="password" />
          <Field name="ref" label="Referral code" defaultValue={q.ref || ""} />
          <button className="w-full rounded-full border border-white/10 py-4 text-sm uppercase tracking-[0.22em]">
            Create account
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-mute">
          <Link href="/">Back home</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={name !== "ref"}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-card px-4 py-3 outline-none focus:border-lime/40"
      />
    </label>
  );
}
