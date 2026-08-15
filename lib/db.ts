import { demo } from "./demo-store";
import { getPrisma } from "./prisma";
import { prismaStore } from "./prisma-store";
import type { Booking, BookingView, Court, Profile, SlotStatus } from "./types";

export function usingDemo() {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  return !process.env.DATABASE_URL?.trim() || !getPrisma();
}

function store() {
  return usingDemo() ? null : prismaStore;
}

export const db = {
  usingDemo,
  listProfiles: async () => (store() ?? wrap(demo)).listProfiles(),
  getProfile: async (id: string) => (store() ?? wrap(demo)).getProfile(id),
  findByEmail: async (email: string) => (store() ?? wrap(demo)).findByEmail(email),
  register: async (input: { email: string; password: string; name: string; phone?: string; ref?: string }) =>
    (store() ?? wrap(demo)).register(input),
  listCourts: async () => (store() ?? wrap(demo)).listCourts(),
  getCourt: async (id: string) => (store() ?? wrap(demo)).getCourt(id),
  updateCourt: async (id: string, patch: Partial<Court>) => (store() ?? wrap(demo)).updateCourt(id, patch),
  slotsFor: async (courtId: string, day: Date) => (store() ?? wrap(demo)).slotsFor(courtId, day),
  allSlotsOn: async (day: Date) => (store() ?? wrap(demo)).allSlotsOn(day),
  getSlot: async (id: string) => (store() ?? wrap(demo)).getSlot(id),
  holdSlot: async (slotId: string, userId: string, names: string[]) =>
    (store() ?? wrap(demo)).holdSlot(slotId, userId, names),
  applyLoyalty: async (bookingId: string, userId: string, usePoints: boolean) =>
    (store() ?? wrap(demo)).applyLoyalty(bookingId, userId, usePoints),
  getBooking: async (id: string) => (store() ?? wrap(demo)).getBooking(id),
  bookingsForUser: async (userId: string) => (store() ?? wrap(demo)).bookingsForUser(userId),
  allBookings: async () => (store() ?? wrap(demo)).allBookings(),
  attachPayment: async (bookingId: string, patch: Parameters<typeof demo.attachPayment>[1]) =>
    (store() ?? wrap(demo)).attachPayment(bookingId, patch),
  confirmPayment: async (opts: { bookingId?: string; txnId?: string; intentionId?: string }) =>
    (store() ?? wrap(demo)).confirmPayment(opts),
  failPayment: async (bookingId: string) => (store() ?? wrap(demo)).failPayment(bookingId),
  demoPay: async (bookingId: string, usePoints = false) => (store() ?? wrap(demo)).demoPay(bookingId, usePoints),
  updatePlayers: async (bookingId: string, names: string[]) => (store() ?? wrap(demo)).updatePlayers(bookingId, names),
  setOpenToJoin: async (bookingId: string, open: boolean) => (store() ?? wrap(demo)).setOpenToJoin(bookingId, open),
  cancel: async (bookingId: string) => (store() ?? wrap(demo)).cancel(bookingId),
  markRefund: async (bookingId: string, status: Booking["refundStatus"]) =>
    (store() ?? wrap(demo)).markRefund(bookingId, status),
  redeem: async (token: string) => (store() ?? wrap(demo)).redeem(token),
  updateBooking: async (id: string, patch: Partial<Booking> & { slotId?: string }) =>
    (store() ?? wrap(demo)).updateBooking(id, patch),
  setSlotStatus: async (id: string, status: SlotStatus) => (store() ?? wrap(demo)).setSlotStatus(id, status),
  expireHolds: async () => (store() ?? wrap(demo)).expireHolds(),
  takeWaitlistNotices: async () => (store() ?? wrap(demo)).takeWaitlistNotices(),
  joinWaitlist: async (slotId: string, userId: string) => (store() ?? wrap(demo)).joinWaitlist(slotId, userId),
  leaveWaitlist: async (slotId: string, userId: string) => (store() ?? wrap(demo)).leaveWaitlist(slotId, userId),
  waitlistForUser: async (userId: string) => (store() ?? wrap(demo)).waitlistForUser(userId),
  waitlistedSlotIds: async (userId: string) => (store() ?? wrap(demo)).waitlistedSlotIds(userId),
  friendsOf: async (userId: string) => (store() ?? wrap(demo)).friendsOf(userId),
  friendRequests: async (userId: string) => (store() ?? wrap(demo)).friendRequests(userId),
  requestFriend: async (fromId: string, email: string) => (store() ?? wrap(demo)).requestFriend(fromId, email),
  answerFriend: async (id: string, userId: string, accept: boolean) =>
    (store() ?? wrap(demo)).answerFriend(id, userId, accept),
  openGames: async () => (store() ?? wrap(demo)).openGames(),
  requestJoin: async (bookingId: string, userId: string) => (store() ?? wrap(demo)).requestJoin(bookingId, userId),
  joinRequestsForHost: async (userId: string) => (store() ?? wrap(demo)).joinRequestsForHost(userId),
  answerJoin: async (id: string, hostId: string, accept: boolean) =>
    (store() ?? wrap(demo)).answerJoin(id, hostId, accept),
  listPromotions: async () => (store() ?? wrap(demo)).listPromotions(),
  setMorningPromo: async (active: boolean, percentOff?: number) =>
    (store() ?? wrap(demo)).setMorningPromo(active, percentOff),
  statsToday: async () => (store() ?? wrap(demo)).statsToday(),
  ensureProfile: async (user: Profile) => (store() ?? wrap(demo)).ensureProfile(user),
  ping: async () => (store() ?? wrap(demo)).ping(),
};

function wrap(d: typeof demo) {
  return {
    listProfiles: async () => d.listProfiles(),
    getProfile: async (id: string) => d.getProfile(id),
    findByEmail: async (email: string) => d.findByEmail(email),
    register: async (input: Parameters<typeof d.register>[0]) => d.register(input),
    listCourts: async () => d.listCourts(),
    getCourt: async (id: string) => d.getCourt(id),
    updateCourt: async (id: string, patch: Partial<Court>) => d.updateCourt(id, patch),
    slotsFor: async (courtId: string, day: Date) => d.slotsFor(courtId, day),
    allSlotsOn: async (day: Date) => d.allSlotsOn(day),
    getSlot: async (id: string) => d.getSlot(id),
    holdSlot: async (slotId: string, userId: string, names: string[]) => d.holdSlot(slotId, userId, names),
    applyLoyalty: async (bookingId: string, userId: string, usePoints: boolean) =>
      d.applyLoyalty(bookingId, userId, usePoints),
    getBooking: async (id: string) => d.getBooking(id),
    bookingsForUser: async (userId: string) => d.bookingsForUser(userId),
    allBookings: async () => d.allBookings(),
    attachPayment: async (bookingId: string, patch: Parameters<typeof d.attachPayment>[1]) =>
      d.attachPayment(bookingId, patch),
    confirmPayment: async (opts: { bookingId?: string; txnId?: string; intentionId?: string }) =>
      d.confirmPayment(opts),
    failPayment: async (bookingId: string) => d.failPayment(bookingId),
    demoPay: async (bookingId: string, usePoints = false) => d.demoPay(bookingId, usePoints),
    updatePlayers: async (bookingId: string, names: string[]) => d.updatePlayers(bookingId, names),
    setOpenToJoin: async (bookingId: string, open: boolean) => d.setOpenToJoin(bookingId, open),
    cancel: async (bookingId: string) => d.cancel(bookingId),
    markRefund: async (bookingId: string, status: Booking["refundStatus"]) => d.markRefund(bookingId, status),
    redeem: async (token: string) => d.redeem(token),
    updateBooking: async (id: string, patch: Partial<Booking> & { slotId?: string }) => d.updateBooking(id, patch),
    setSlotStatus: async (id: string, status: SlotStatus) => d.setSlotStatus(id, status),
    expireHolds: async () => d.expireHolds(),
    takeWaitlistNotices: async () => d.takeWaitlistNotices(),
    joinWaitlist: async (slotId: string, userId: string) => d.joinWaitlist(slotId, userId),
    leaveWaitlist: async (slotId: string, userId: string) => d.leaveWaitlist(slotId, userId),
    waitlistForUser: async (userId: string) => d.waitlistForUser(userId),
    waitlistedSlotIds: async (userId: string) => d.waitlistedSlotIds(userId),
    friendsOf: async (userId: string) => d.friendsOf(userId),
    friendRequests: async (userId: string) => d.friendRequests(userId),
    requestFriend: async (fromId: string, email: string) => d.requestFriend(fromId, email),
    answerFriend: async (id: string, userId: string, accept: boolean) => d.answerFriend(id, userId, accept),
    openGames: async () => d.openGames(),
    requestJoin: async (bookingId: string, userId: string) => d.requestJoin(bookingId, userId),
    joinRequestsForHost: async (userId: string) => d.joinRequestsForHost(userId),
    answerJoin: async (id: string, hostId: string, accept: boolean) => d.answerJoin(id, hostId, accept),
    listPromotions: async () => d.listPromotions(),
    setMorningPromo: async (active: boolean, percentOff?: number) => d.setMorningPromo(active, percentOff),
    statsToday: async () => d.statsToday(),
    ensureProfile: async (user: Profile) => d.ensureProfile(user),
    ping: async () => ({ ok: false as const, demo: true as const, users: d.listProfiles().length, bookings: d.allBookings().length }),
  };
}

export type { BookingView, Profile };
