import Link from "next/link";
import { db } from "@/lib/db";
import { PlayerNav } from "@/components/player-nav";
import { getSession } from "@/lib/auth";

export default async function PaymentCompletePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const user = await getSession();
  const merchant = q.merchant_order_id || q.special_reference;
  const success = q.success === "true";
  const booking = merchant ? db.getBooking(merchant) : null;

  return (
    <div className="min-h-screen">
      <PlayerNav user={user} />
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <p className="label">{success ? "Processing" : "Payment"}</p>
        <h1 className="mt-4 font-display text-5xl">
          {success ? "CONFIRMING." : "PAYMENT DIDN'T GO THROUGH."}
        </h1>
        <p className="mt-4 text-mute">
          Status is taken from the Paymob webhook, not this redirect. Refresh in a moment.
        </p>
        {booking ? (
          <Link href={booking.status === "CONFIRMED" ? `/bookings/${booking.id}` : `/pay/${booking.id}`} className="mt-10 inline-block rounded-full bg-lime px-6 py-3 text-xs uppercase tracking-[0.2em] text-bg">
            {booking.status === "CONFIRMED" ? "Open pass" : "Try again"}
          </Link>
        ) : (
          <Link href="/bookings" className="mt-10 inline-block text-lime">
            My bookings
          </Link>
        )}
      </div>
    </div>
  );
}
