import { demo } from "./demo-store";
import { getPrisma } from "./prisma";
import type { Booking, BookingView, Court, Profile, SlotStatus } from "./types";

export function usingDemo() {
  return process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL || !getPrisma();
}

export const db = {
  usingDemo,
  listProfiles: () => demo.listProfiles(),
  getProfile: (id: string) => demo.getProfile(id),
  findByEmail: (email: string) => demo.findByEmail(email),
  listCourts: () => demo.listCourts(),
  getCourt: (id: string) => demo.getCourt(id),
  updateCourt: (id: string, patch: Partial<Court>) => demo.updateCourt(id, patch),
  slotsFor: (courtId: string, day: Date) => demo.slotsFor(courtId, day),
  allSlotsOn: (day: Date) => demo.allSlotsOn(day),
  getSlot: (id: string) => demo.getSlot(id),
  holdSlot: (slotId: string, userId: string, names: string[]) => demo.holdSlot(slotId, userId, names),
  getBooking: (id: string) => demo.getBooking(id),
  bookingsForUser: (userId: string) => demo.bookingsForUser(userId),
  allBookings: () => demo.allBookings(),
  attachPayment: demo.attachPayment.bind(demo),
  confirmPayment: demo.confirmPayment.bind(demo),
  failPayment: demo.failPayment.bind(demo),
  demoPay: demo.demoPay.bind(demo),
  updatePlayers: demo.updatePlayers.bind(demo),
  cancel: demo.cancel.bind(demo),
  markRefund: demo.markRefund.bind(demo),
  redeem: demo.redeem.bind(demo),
  updateBooking: (id: string, patch: Partial<Booking> & { slotId?: string }) =>
    demo.updateBooking(id, patch),
  setSlotStatus: (id: string, status: SlotStatus) => demo.setSlotStatus(id, status),
  expireHolds: () => demo.expireHolds(),
  statsToday: () => demo.statsToday(),
};

export type { BookingView, Profile };
