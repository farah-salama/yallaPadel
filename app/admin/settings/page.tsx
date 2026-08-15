import { db } from "@/lib/db";
import { paymobConfigured } from "@/lib/paymob";

export default async function SettingsPage() {
  const demo = db.usingDemo();
  return (
    <div className="max-w-xl">
      <p className="label">Club</p>
      <h1 className="mt-3 font-display text-5xl">SETTINGS.</h1>
      <div className="panel mt-8 divide-y divide-white/[0.06] p-6 text-sm">
        <Row k="Club" v="YallaPadel · Sheikh Zayed" />
        <Row k="Deposit" v="50%" />
        <Row k="Hold" v="5 minutes" />
        <Row k="Cancel" v=">6h 100% · 2–6h 50% · <2h 0%" />
        <Row k="Database" v={demo ? "Not connected — add DATABASE_URL + DIRECT_URL from Supabase" : "Supabase Postgres"} />
        <Row k="Paymob" v={paymobConfigured() ? "Configured" : "Demo checkout"} />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-3">
      <span className="text-mute">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
