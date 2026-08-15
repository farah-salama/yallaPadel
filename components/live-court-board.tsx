import { formatTime } from "@/lib/utils";
import type { Court, TimeSlot } from "@/lib/types";
import { StatusChip } from "./status-chip";
import { CourtDiagram } from "./court-diagram";

export function LiveCourtBoard({
  courts,
  slots,
}: {
  courts: Court[];
  slots: TimeSlot[];
}) {
  const now = Date.now();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {courts.map((court) => {
        const mine = slots.filter((s) => s.courtId === court.id).sort((a, b) => a.start.getTime() - b.start.getTime());
        const current = mine.find((s) => s.start.getTime() <= now && s.end.getTime() > now);
        const next = mine.find((s) => s.start.getTime() > now);
        const occupied = current?.status === "RESERVED" || current?.status === "HOLDING";
        return (
          <div key={court.id} className="panel p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="label">{court.type}</p>
                <h3 className="mt-2 font-display text-3xl">{court.name}</h3>
              </div>
              <StatusChip status={occupied ? "OCCUPIED" : "AVAILABLE"} />
            </div>
            <CourtDiagram className="mt-4 h-24" accent={!occupied} occupied={occupied} />
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-mute">
              {current ? "Current" : "Next"}{" "}
              <span className="font-mono text-ink">
                {current
                  ? `${formatTime(current.start)} — ${formatTime(current.end)}`
                  : next
                    ? `${formatTime(next.start)} — ${formatTime(next.end)}`
                    : "—"}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
