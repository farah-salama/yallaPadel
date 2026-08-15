import { cn } from "@/lib/utils";

export function StatusChip({
  status,
  extra,
}: {
  status: string;
  extra?: string;
}) {
  const map: Record<string, string> = {
    AVAILABLE: "text-lime border-lime/30 bg-lime/10",
    FLASH: "text-lime border-lime/40 bg-lime/15 shadow-glow-sm",
    FREE: "text-lime border-lime/30 bg-lime/10",
    HELD: "text-warn border-warn/30 bg-warn/10",
    HOLDING: "text-warn border-warn/30 bg-warn/10",
    PROCESSING: "text-mint border-mint/30 bg-mint/10",
    CONFIRMED: "text-lime border-lime/30 bg-lime/10",
    PAID: "text-lime border-lime/30 bg-lime/10",
    RESERVED: "text-mute border-white/10 bg-white/5",
    BOOKED: "text-mute border-white/10 bg-white/5",
    FAILED: "text-danger border-danger/30 bg-danger/10",
    "PAYMENT FAILED": "text-danger border-danger/30 bg-danger/10",
    EXPIRED: "text-mute border-white/10",
    "SLOT RELEASED": "text-mute border-white/10",
    CANCELLED: "text-mute border-white/10",
    REDEEMED: "text-lime border-lime/30 bg-lime/10",
    CHECKED_IN: "text-lime border-lime/30 bg-lime/10",
    "ALREADY USED": "text-danger border-danger/30 bg-danger/10",
    MAINTENANCE: "text-danger border-danger/20 bg-danger/10",
    OCCUPIED: "text-warn border-warn/30 bg-warn/10",
    NO_SHOW: "text-danger border-danger/20",
  };
  const cls = map[status] ?? "text-ink border-white/10";
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em]", cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current pulse" />
      {status}
      {extra ? <span className="font-mono tracking-normal">{extra}</span> : null}
    </span>
  );
}
