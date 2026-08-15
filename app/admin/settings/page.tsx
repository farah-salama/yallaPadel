import { db } from "@/lib/db";
import { paymobConfigured } from "@/lib/paymob";

export default async function SettingsPage() {
  const demo = db.usingDemo();
  const ping = await db.ping();
  return (
    <div className="max-w-xl">
      <p className="label">Club</p>
      <h1 className="mt-3 font-display text-5xl">SETTINGS.</h1>
      <div className="panel mt-8 divide-y divide-white/[0.06] p-6 text-sm">
        <Row k="Club" v="YallaPadel · Sheikh Zayed" />
        <Row k="Deposit" v="50%" />
        <Row k="Hold" v="5 minutes" />
        <Row k="Cancel" v=">6h 100% · 2–6h 50% · <2h 0%" />
        <Row
          k="Database"
          v={
            demo
              ? "Demo memory (not Supabase) — set DATABASE_URL + DIRECT_URL + DEMO_MODE=false on Vercel"
              : ping.ok
                ? `Supabase · ${ping.users} players · ${ping.bookings} bookings`
                : `Supabase error — ${"error" in ping && ping.error ? ping.error : "check DATABASE_URL"}`
          }
        />
        <Row k="Paymob" v={paymobConfigured() ? "Configured" : "Demo checkout"} />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <span className="shrink-0 text-mute">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
