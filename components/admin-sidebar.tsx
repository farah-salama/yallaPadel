import Link from "next/link";
import { logoutAction } from "@/lib/actions";

const items = [
  ["Overview", "/admin"],
  ["Bookings", "/admin/bookings"],
  ["Courts", "/admin/courts"],
  ["Customers", "/admin/customers"],
  ["Check-in", "/admin/check-in"],
  ["Promotions", "/admin/promotions"],
  ["Settings", "/admin/settings"],
];

export function AdminSidebar() {
  return (
    <aside className="flex w-full flex-col border-b border-white/[0.06] bg-bg-2 md:h-screen md:w-60 md:border-b-0 md:border-r">
      <Link href="/admin" className="px-6 py-6 font-display text-lg tracking-[0.2em]">
        YALLA<span className="text-lime">PADEL</span>
      </Link>
      <nav className="flex gap-4 overflow-x-auto px-4 pb-4 md:flex-col md:gap-1 md:px-3">
        {items.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="whitespace-nowrap rounded-xl px-3 py-2 text-xs uppercase tracking-[0.2em] text-mute hover:bg-white/5 hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto hidden px-6 py-6 md:block">
        <Link href="/courts" className="label block">
          Player view
        </Link>
        <form action={logoutAction} className="mt-3">
          <button className="text-xs uppercase tracking-[0.2em] text-mute">Sign out</button>
        </form>
      </div>
    </aside>
  );
}
