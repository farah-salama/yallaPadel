import Image from "next/image";
import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { CourtDiagram } from "@/components/court-diagram";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function HomePage() {
  const user = await getSession();
  const hero = await db.getCourt("court-01");
  return (
    <div className="relative min-h-screen overflow-hidden">
      <PlayerNav user={user} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(200,255,0,0.08),transparent_55%)]" />
      <section className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-2">
        <div>
          <p className="label text-lime">Sheikh Zayed · Two courts</p>
          <h1 className="mt-6 font-display text-6xl font-medium leading-[0.92] tracking-tight sm:text-8xl">
            PLAY
            <br />
            WITHOUT
            <br />
            THE CHAT.
          </h1>
          <p className="mt-6 max-w-md text-lg text-mute">Find your court. Lock your slot. Pay. Show up.</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/courts"
              className="rounded-full bg-lime px-7 py-4 text-sm font-medium uppercase tracking-[0.22em] text-bg shadow-glow"
            >
              Book a court →
            </Link>
            <Link
              href="/courts"
              className="rounded-full border border-white/10 px-7 py-4 text-sm uppercase tracking-[0.22em] text-ink"
            >
              Explore courts
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-8 rounded-full bg-lime/5 blur-3xl" />
          <div className="panel relative overflow-hidden">
            {hero?.imageUrl ? (
              <>
                <Image
                  src={hero.imageUrl}
                  alt={hero.name}
                  width={1280}
                  height={720}
                  priority
                  className="h-80 w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
              </>
            ) : (
              <div className="p-8">
                <CourtDiagram accent className="h-64" />
              </div>
            )}
            <div className="pointer-events-none absolute left-8 top-10 rounded-full border border-lime/30 bg-bg/80 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-lime">
              {hero?.name ?? "Court 01"}
            </div>
            <div className="pointer-events-none absolute right-10 top-24 rounded-full border border-white/10 bg-bg/80 px-4 py-2 font-mono text-xs">
              20:00
            </div>
            <div className="pointer-events-none absolute bottom-12 left-1/3 rounded-full border border-lime/40 bg-lime/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-lime shadow-glow-sm">
              Available
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
