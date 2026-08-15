import { db } from "@/lib/db";
import { adminUpdateCourtAction } from "@/lib/actions";
import { CourtDiagram } from "@/components/court-diagram";
import { formatMoney } from "@/lib/utils";

export default async function AdminCourts() {
  const courts = await db.listCourts();
  return (
    <div>
      <p className="label">Club</p>
      <h1 className="mt-3 font-display text-5xl">COURTS.</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {courts.map((c) => (
          <form key={c.id} action={adminUpdateCourtAction} className="panel p-6 space-y-3">
            <CourtDiagram className="h-24" accent={c.status === "ACTIVE"} occupied={c.status === "MAINTENANCE"} />
            <input type="hidden" name="courtId" value={c.id} />
            <Field name="name" label="Name" defaultValue={c.name} />
            <Field name="type" label="Type" defaultValue={c.type} />
            <Field name="location" label="Location" defaultValue={c.location} />
            <div className="grid grid-cols-2 gap-3">
              <Field name="peak" label="Peak EGP" defaultValue={String(c.peakPriceCents / 100)} />
              <Field name="offPeak" label="Morning EGP" defaultValue={String(c.offPeakPriceCents / 100)} />
              <Field name="opening" label="Opens" defaultValue={c.openingTime} />
              <Field name="closing" label="Closes" defaultValue={c.closingTime} />
              <Field name="offPeakEnd" label="Off-peak until" defaultValue={c.offPeakEnd} />
              <label className="block">
                <span className="label">Status</span>
                <select name="status" defaultValue={c.status} className="mt-2 w-full rounded-xl border border-white/10 bg-bg px-3 py-2">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </label>
            </div>
            <p className="text-xs text-mute">From {formatMoney(c.offPeakPriceCents)}</p>
            <button className="rounded-full bg-lime px-5 py-2 text-xs uppercase tracking-[0.2em] text-bg">Save court</button>
          </form>
        ))}
      </div>
    </div>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 outline-none" />
    </label>
  );
}
