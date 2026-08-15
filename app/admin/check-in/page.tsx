import { CheckInClient } from "@/components/check-in-client";
import { db } from "@/lib/db";
import { formatTime } from "@/lib/utils";

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; already?: string; invalid?: string; missing?: string }>;
}) {
  const q = await searchParams;
  const id = q.ok || q.already || q.invalid;
  const booking = id ? await db.getBooking(id) : null;
  const kind = q.ok ? "ok" : q.already ? "already" : q.invalid ? "invalid" : q.missing ? "missing" : undefined;
  return (
    <CheckInClient
      flash={
        kind
          ? {
              kind,
              name: booking?.user.name,
              court: booking?.court.name,
              time: booking ? `${formatTime(booking.slot.start)} — ${formatTime(booking.slot.end)}` : undefined,
            }
          : undefined
      }
    />
  );
}
