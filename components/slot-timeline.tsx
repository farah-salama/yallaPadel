"use client";

import Link from "next/link";
import { formatMoney, formatTime } from "@/lib/utils";
import type { SlotView } from "@/lib/types";
import { StatusChip } from "./status-chip";
import { joinWaitlistAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function SlotTimeline({
  slots,
  waitlistedIds = [],
  canWaitlist = false,
  back = "/courts",
}: {
  slots: SlotView[];
  courtId?: string;
  waitlistedIds?: string[];
  canWaitlist?: boolean;
  back?: string;
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
        const waiting = waitlistedIds.includes(slot.id);
        const inner = (
          <div
            className={cn(
              "group flex items-center gap-4 rounded-2xl border px-5 py-4 transition",
              available && "border-lime/25 bg-lime/[0.04] hover:scale-[1.01] hover:border-lime/50 hover:shadow-glow-sm",
              slot.flash && available && "shadow-glow",
              held && "border-warn/30 bg-warn/[0.06]",
              slot.status === "RESERVED" && "border-white/[0.06] bg-white/[0.03]",
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
            <div className="hidden sm:block">
              <StatusChip
                status={
                  slot.flash && available
                    ? "FLASH"
                    : available
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
              {available ? formatMoney(slot.priceCents) : "—"}
            </div>
          </div>
        );
        if (available) {
          return (
            <Link key={slot.id} href={`/hold/${slot.id}`}>
              {inner}
            </Link>
          );
        }
        return (
          <div key={slot.id}>
            {inner}
            {canWaitlist && (slot.status === "RESERVED" || slot.status === "HOLDING") ? (
              <form action={joinWaitlistAction} className="mt-1 flex justify-end">
                <input type="hidden" name="slotId" value={slot.id} />
                <input type="hidden" name="back" value={back} />
                <button
                  disabled={waiting}
                  className="text-[10px] uppercase tracking-[0.2em] text-lime disabled:text-mute"
                >
                  {waiting ? "You're on the waitlist" : "Notify me if it frees"}
                </button>
              </form>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
