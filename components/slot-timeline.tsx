"use client";

import Link from "next/link";
import { formatMoney, formatTime } from "@/lib/utils";
import type { TimeSlot } from "@/lib/types";
import { StatusChip } from "./status-chip";
import { cn } from "@/lib/utils";

export function SlotTimeline({
  slots,
  prices,
}: {
  slots: TimeSlot[];
  courtId?: string;
  prices: { peak: number; offPeak: number; offPeakEnd: string };
}) {
  if (!slots.length) {
    return (
      <div className="panel p-10">
        <p className="label">Empty</p>
        <h3 className="mt-3 font-display text-4xl">THE COURT IS WAITING.</h3>
        <p className="mt-2 text-mute">Nothing booked yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {slots.map((slot) => {
        const available = slot.status === "FREE";
        const held = slot.status === "HOLDING";
        const hour = Number(formatTime(slot.start).slice(0, 2));
        const offPeak = hour < 12;
        const price = offPeak ? prices.offPeak : prices.peak;
        const inner = (
          <div
            className={cn(
              "group flex items-center gap-5 rounded-2xl border px-5 py-4 transition",
              available && "border-lime/25 bg-lime/[0.04] hover:scale-[1.01] hover:border-lime/50 hover:shadow-glow-sm",
              held && "border-warn/30 bg-warn/[0.06]",
              slot.status === "RESERVED" && "border-white/[0.06] bg-white/[0.03] opacity-60",
              slot.status === "MAINTENANCE" && "border-danger/20 bg-danger/[0.05] opacity-70",
            )}
          >
            <div className="w-16 font-mono text-lg text-ink">{formatTime(slot.start)}</div>
            <div
              className={cn(
                "h-3 flex-1 rounded-sm",
                available && "bg-lime/80 shadow-glow-sm",
                held && "bg-warn/70",
                slot.status === "RESERVED" && "bg-white/15",
                slot.status === "MAINTENANCE" && "bg-danger/40",
              )}
            />
            <div className="hidden w-28 sm:block">
              <StatusChip
                status={
                  available
                    ? "AVAILABLE"
                    : held
                      ? "HELD"
                      : slot.status === "MAINTENANCE"
                        ? "MAINTENANCE"
                        : "BOOKED"
                }
              />
            </div>
            <div className="w-24 text-right font-mono text-sm text-mute">
              {available ? formatMoney(price) : "—"}
            </div>
          </div>
        );
        if (!available) return <div key={slot.id}>{inner}</div>;
        return (
          <Link key={slot.id} href={`/hold/${slot.id}`}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
