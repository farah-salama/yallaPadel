import { cairoParts, formatTime } from "@/lib/utils";
import type { Court, TimeSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DaySchedule({ courts, slots }: { courts: Court[]; slots: TimeSlot[] }) {
  const hours = Array.from(new Set(slots.map((s) => cairoParts(s.start).hour))).sort();
  return (
    <div className="panel overflow-x-auto p-5">
      <p className="label">Today</p>
      <div className="mt-4 min-w-[720px]">
        <div className="mb-2 grid" style={{ gridTemplateColumns: `120px repeat(${hours.length}, minmax(44px,1fr))` }}>
          <div />
          {hours.map((h) => (
            <div key={h} className="text-center font-mono text-[10px] text-mute">
              {h}:00
            </div>
          ))}
        </div>
        {courts.map((court) => (
          <div
            key={court.id}
            className="mb-2 grid items-center"
            style={{ gridTemplateColumns: `120px repeat(${hours.length}, minmax(44px,1fr))` }}
          >
            <div className="text-xs uppercase tracking-[0.16em]">{court.name}</div>
            {hours.map((h) => {
              const slot = slots.find((s) => s.courtId === court.id && cairoParts(s.start).hour === h);
              const st = slot?.status ?? "FREE";
              return (
                <div
                  key={h}
                  title={slot ? `${formatTime(slot.start)} ${st}` : ""}
                  className={cn(
                    "mx-0.5 h-8 rounded-md border",
                    st === "FREE" && "border-lime/40 bg-transparent",
                    st === "RESERVED" && "border-transparent bg-card-2",
                    st === "HOLDING" && "border-warn/50 bg-warn/20",
                    st === "MAINTENANCE" && "border-danger/30 bg-danger/20",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
