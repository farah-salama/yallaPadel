import crypto from "crypto";

export const TZ = "Africa/Cairo";
export const HOLD_MS = 5 * 60 * 1000;
export const DEPOSIT_PERCENT = 50;

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function cairoParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return map;
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDate(date: Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(date);
}

export function formatMoney(cents: number) {
  return `${(cents / 100).toLocaleString("en-EG")} EGP`;
}

export function startOfCairoDay(date = new Date()) {
  const p = cairoParts(date);
  return cairoDate(Number(p.year), Number(p.month), Number(p.day), 0, 0);
}

export function cairoDate(year: number, month: number, day: number, hour = 0, minute = 0) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  let t = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 4; i++) {
    const parts: Record<string, string> = {};
    for (const p of fmt.formatToParts(new Date(t))) {
      if (p.type !== "literal") parts[p.type] = p.value;
    }
    const got = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
    );
    const want = Date.UTC(year, month - 1, day, hour, minute);
    t += want - got;
  }
  return new Date(t);
}

export function hourInCairo(date: Date) {
  return Number(cairoParts(date).hour);
}

export function parseHm(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return { h, m };
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function hoursUntil(date: Date) {
  return (date.getTime() - Date.now()) / 3_600_000;
}

export function refundPercent(slotStart: Date) {
  const h = hoursUntil(slotStart);
  if (h > 6) return 100;
  if (h >= 2) return 50;
  return 0;
}

export function isOffPeak(slotStart: Date, offPeakEnd = "12:00") {
  const { h } = parseHm(offPeakEnd);
  return hourInCairo(slotStart) < h;
}

export function slotPrice(peak: number, offPeak: number, start: Date, offPeakEnd = "12:00") {
  return isOffPeak(start, offPeakEnd) ? offPeak : peak;
}

export function depositOf(total: number, percent = DEPOSIT_PERCENT) {
  return Math.round(total * (percent / 100));
}

export function bookingCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "PDL-";
  for (let i = 0; i < 4; i++) s += alphabet[crypto.randomInt(alphabet.length)];
  return s;
}

export function qrToken() {
  return crypto.randomBytes(16).toString("hex");
}

export function id(prefix = "") {
  return prefix + crypto.randomBytes(8).toString("hex");
}

export function greeting() {
  const h = hourInCairo(new Date());
  if (h < 12) return "GOOD MORNING";
  if (h < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}
