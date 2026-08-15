import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import type { Profile } from "@/lib/types";

export function PlayerNav({ user }: { user: Profile | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-lg tracking-[0.18em]">
          YALLA<span className="text-lime">PADEL</span>
        </Link>
        <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.22em] text-mute md:flex">
          <Link href="/">Home</Link>
          <Link href="/courts">Courts</Link>
          <Link href="/join">Join</Link>
          <Link href="/friends">Friends</Link>
          <Link href="/bookings">Bookings</Link>
          <Link href="/profile">Profile</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === "ADMIN" ? (
                <Link href="/admin" className="label text-lime">
                  Ops
                </Link>
              ) : null}
              <form action={logoutAction}>
                <button className="text-xs uppercase tracking-[0.2em] text-mute">Out</button>
              </form>
            </>
          ) : (
            <Link href="/signup" className="text-xs uppercase tracking-[0.2em] text-mute">
              Sign up
            </Link>
            <Link href="/login" className="rounded-full bg-lime px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-bg">
              Sign in
            </Link>
          )}
        </div>
      </div>
      <nav className="flex justify-around border-t border-white/[0.06] py-3 text-[10px] uppercase tracking-[0.2em] text-mute md:hidden">
        <Link href="/">Home</Link>
        <Link href="/courts">Courts</Link>
        <Link href="/join">Join</Link>
        <Link href="/bookings">Bookings</Link>
        <Link href="/profile">Profile</Link>
      </nav>
    </header>
  );
}
