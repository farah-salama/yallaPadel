import { hourInCairo, isOffPeak, slotPrice as baseSlotPrice, DEPOSIT_PERCENT } from "./utils";
import type { Promotion, TimeSlot } from "./types";

export { refundPercent, depositOf, isOffPeak, DEPOSIT_PERCENT, slotPrice as baseSlotPrice } from "./utils";

export const FLASH_PERCENT = 20;
export const FLASH_MS = 15 * 60 * 1000;
export const REFERRAL_BONUS = 100;

export function pointsFromDeposit(depositCents: number) {
  return Math.floor(depositCents / 100);
}

export function redeemCents(points: number, depositCents: number) {
  const maxCents = Math.round(depositCents * 0.5);
  return Math.min(maxCents, points * 100, depositCents);
}

export function pointsSpent(cents: number) {
  return Math.floor(cents / 100);
}

export function livePromos(promos: Promotion[], now = Date.now()) {
  return promos.filter((p) => {
    if (!p.active) return false;
    if (p.endsAt && p.endsAt.getTime() <= now) return false;
    return true;
  });
}

export function applyPromos(baseCents: number, slot: TimeSlot, promos: Promotion[], now = Date.now()) {
  let price = baseCents;
  const live = livePromos(promos, now);
  const hour = hourInCairo(slot.start);
  const morning = live.find((p) => p.kind === "MORNING");
  if (morning && hour >= (morning.hourStart ?? 8) && hour < (morning.hourEnd ?? 12)) {
    price = Math.round(price * (1 - morning.percentOff / 100));
  }
  const flash = live.find((p) => p.kind === "FLASH" && p.slotId === slot.id);
  if (flash) {
    price = Math.round(price * (1 - flash.percentOff / 100));
  }
  return price;
}

export function hasFlash(slotId: string, promos: Promotion[], now = Date.now()) {
  return livePromos(promos, now).some((p) => p.kind === "FLASH" && p.slotId === slotId);
}

export function pricedSlot(peak: number, offPeak: number, slot: TimeSlot, offPeakEnd: string, promos: Promotion[]) {
  const base = baseSlotPrice(peak, offPeak, slot.start, offPeakEnd);
  return applyPromos(base, slot, promos);
}

export function slotPrice(peak: number, offPeak: number, start: Date, offPeakEnd = "12:00") {
  return isOffPeak(start, offPeakEnd) ? offPeak : peak;
}
