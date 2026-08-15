import {
  addDays,
  bookingCode,
  cairoDate,
  cairoParts,
  depositOf,
  HOLD_MS,
  hourInCairo,
  id,
  parseHm,
  qrToken,
  refundPercent,
  slotPrice,
  startOfCairoDay,
} from "./utils";
import type {
  Booking,
  BookingView,
  Court,
  Payment,
  Profile,
  SlotStatus,
  TimeSlot,
} from "./types";

type Store = {
  profiles: Profile[];
  courts: Court[];
  slots: TimeSlot[];
  bookings: Booking[];
  payments: Payment[];
};

const g = globalThis as unknown as { __yp?: Store };

function seed(): Store {
  const mostafa: Profile = {
    id: "user-mostafa",
    email: "mostafa@yallapadel.club",
    name: "Mostafa",
    phone: "+201001112233",
    role: "ADMIN",
    createdAt: cairoDate(2025, 1, 10),
    password: "padel123",
  };
  const omar: Profile = {
    id: "user-omar",
    email: "omar@yallapadel.club",
    name: "Omar E.",
    phone: "+201009998877",
    role: "PLAYER",
    createdAt: cairoDate(2026, 2, 1),
    password: "padel123",
  };
  const lina: Profile = {
    id: "user-lina",
    email: "lina@yallapadel.club",
    name: "Lina K.",
    phone: "+201005554433",
    role: "PLAYER",
    createdAt: cairoDate(2026, 3, 12),
    password: "padel123",
  };

  const courts: Court[] = [
    {
      id: "court-01",
      slug: "court-01",
      name: "COURT 01",
      type: "Premium Glass Court",
      location: "Sheikh Zayed, Cairo",
      description: "Panoramic glass, tournament lights, night play.",
      peakPriceCents: 50000,
      offPeakPriceCents: 35000,
      offPeakEnd: "12:00",
      openingTime: "07:00",
      closingTime: "23:00",
      status: "ACTIVE",
    },
    {
      id: "court-02",
      slug: "court-02",
      name: "COURT 02",
      type: "Night Court",
      location: "Sheikh Zayed, Cairo",
      description: "Fast surface, LED canopy, perfect for doubles.",
      peakPriceCents: 45000,
      offPeakPriceCents: 30000,
      offPeakEnd: "12:00",
      openingTime: "07:00",
      closingTime: "23:00",
      status: "ACTIVE",
    },
  ];

  const slots: TimeSlot[] = [];
  for (const court of courts) {
    for (let d = 0; d < 14; d++) {
      const day = addDays(startOfCairoDay(), d);
      const p = cairoParts(day);
      const open = parseHm(court.openingTime);
      const close = parseHm(court.closingTime);
      for (let h = open.h; h < close.h; h++) {
        const start = cairoDate(Number(p.year), Number(p.month), Number(p.day), h, 0);
        const end = cairoDate(Number(p.year), Number(p.month), Number(p.day), h + 1, 0);
        if (end.getTime() <= Date.now() - 60 * 60 * 1000) continue;
        slots.push({
          id: `${court.id}-${p.year}${p.month}${p.day}-${String(h).padStart(2, "0")}`,
          courtId: court.id,
          start,
          end,
          status: "FREE",
          holdExpiresAt: null,
        });
      }
    }
  }

  const store: Store = {
    profiles: [mostafa, omar, lina],
    courts,
    slots,
    bookings: [],
    payments: [],
  };

  const today = cairoParts();
  const packHours = [18, 19, 20, 21];
  for (const court of courts) {
    for (const h of packHours) {
      const slot = store.slots.find(
        (s) =>
          s.courtId === court.id &&
          hourInCairo(s.start) === h &&
          cairoParts(s.start).day === today.day,
      );
      if (!slot) continue;
      const who = h % 2 === 0 ? omar : lina;
      confirmSeedBooking(store, slot, who, court);
    }
  }

  return store;
}

function confirmSeedBooking(store: Store, slot: TimeSlot, user: Profile, court: Court) {
  const total = slotPrice(court.peakPriceCents, court.offPeakPriceCents, slot.start, court.offPeakEnd);
  const deposit = depositOf(total);
  const booking: Booking = {
    id: id("bk_"),
    code: bookingCode(),
    userId: user.id,
    courtId: court.id,
    slotId: slot.id,
    status: "CONFIRMED",
    depositCents: deposit,
    remainingCents: total - deposit,
    totalCents: total,
    playerNames: [user.name, "Guest"],
    qrToken: qrToken(),
    redeemedAt: null,
    cancelledAt: null,
    refundStatus: "NONE",
    refundCents: 0,
    createdAt: new Date(Date.now() - 3_600_000),
  };
  slot.status = "RESERVED";
  store.bookings.push(booking);
  store.payments.push({
    id: id("pay_"),
    bookingId: booking.id,
    userId: user.id,
    provider: "paymob",
    amountCents: deposit,
    status: "PAID",
    paymobTxnId: `demo-${booking.id}`,
    paymobIntentionId: null,
    clientSecret: null,
    createdAt: booking.createdAt,
    updatedAt: booking.createdAt,
  });
}

function db(): Store {
  if (!g.__yp) g.__yp = seed();
  expireHolds(g.__yp);
  return g.__yp;
}

function expireHolds(store: Store) {
  const now = Date.now();
  for (const slot of store.slots) {
    if (slot.status === "HOLDING" && slot.holdExpiresAt && slot.holdExpiresAt.getTime() <= now) {
      const booking = store.bookings.find((b) => b.slotId === slot.id && b.status === "PENDING_PAYMENT");
      if (booking) booking.status = "CANCELLED";
      slot.status = "FREE";
      slot.holdExpiresAt = null;
    }
  }
}

function view(store: Store, b: Booking): BookingView {
  const court = store.courts.find((c) => c.id === b.courtId)!;
  const slot = store.slots.find((s) => s.id === b.slotId)!;
  const user = store.profiles.find((p) => p.id === b.userId)!;
  const payments = store.payments.filter((p) => p.bookingId === b.id);
  return { ...b, court, slot, user, payments };
}

export const demo = {
  listProfiles() {
    return db().profiles.map((p) => {
      const { password, ...rest } = p;
      void password;
      return rest;
    });
  },
  getProfile(id: string) {
    const p = db().profiles.find((x) => x.id === id);
    if (!p) return null;
    const { password, ...rest } = p;
    void password;
    return rest;
  },
  findByEmail(email: string) {
    return db().profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
  listCourts() {
    return db().courts;
  },
  getCourt(idOrSlug: string) {
    return db().courts.find((c) => c.id === idOrSlug || c.slug === idOrSlug) ?? null;
  },
  updateCourt(id: string, patch: Partial<Court>) {
    const c = db().courts.find((x) => x.id === id);
    if (!c) return null;
    Object.assign(c, patch);
    return c;
  },
  slotsFor(courtId: string, day: Date) {
    const p = cairoParts(day);
    return db()
      .slots.filter((s) => {
        const sp = cairoParts(s.start);
        return s.courtId === courtId && sp.year === p.year && sp.month === p.month && sp.day === p.day;
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  },
  allSlotsOn(day: Date) {
    const p = cairoParts(day);
    return db().slots.filter((s) => {
      const sp = cairoParts(s.start);
      return sp.year === p.year && sp.month === p.month && sp.day === p.day;
    });
  },
  getSlot(id: string) {
    return db().slots.find((s) => s.id === id) ?? null;
  },
  holdSlot(slotId: string, userId: string, playerNames: string[]) {
    const store = db();
    const slot = store.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error("SLOT_MISSING");
    if (slot.status === "MAINTENANCE") throw new Error("MAINTENANCE");
    if (slot.status === "RESERVED") throw new Error("TAKEN");
    if (slot.status === "HOLDING" && slot.holdExpiresAt && slot.holdExpiresAt.getTime() > Date.now()) {
      const existing = store.bookings.find((b) => b.slotId === slotId && b.status === "PENDING_PAYMENT");
      if (existing && existing.userId !== userId) throw new Error("HELD");
    }
    const court = store.courts.find((c) => c.id === slot.courtId)!;
    const total = slotPrice(court.peakPriceCents, court.offPeakPriceCents, slot.start, court.offPeakEnd);
    const deposit = depositOf(total);
    slot.status = "HOLDING";
    slot.holdExpiresAt = new Date(Date.now() + HOLD_MS);
    let booking = store.bookings.find((b) => b.slotId === slotId && b.status === "PENDING_PAYMENT" && b.userId === userId);
    if (!booking) {
      booking = {
        id: id("bk_"),
        code: bookingCode(),
        userId,
        courtId: court.id,
        slotId: slot.id,
        status: "PENDING_PAYMENT",
        depositCents: deposit,
        remainingCents: total - deposit,
        totalCents: total,
        playerNames: playerNames.filter(Boolean).slice(0, 4),
        qrToken: qrToken(),
        redeemedAt: null,
        cancelledAt: null,
        refundStatus: "NONE",
        refundCents: 0,
        createdAt: new Date(),
      };
      store.bookings.push(booking);
    } else {
      booking.playerNames = playerNames.filter(Boolean).slice(0, 4);
      booking.depositCents = deposit;
      booking.remainingCents = total - deposit;
      booking.totalCents = total;
    }
    return { booking: view(store, booking), expiresAt: slot.holdExpiresAt };
  },
  getBooking(idOrCode: string) {
    const store = db();
    const b = store.bookings.find((x) => x.id === idOrCode || x.code === idOrCode || x.qrToken === idOrCode);
    return b ? view(store, b) : null;
  },
  bookingsForUser(userId: string) {
    const store = db();
    return store.bookings
      .filter((b) => b.userId === userId)
      .map((b) => view(store, b))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  allBookings() {
    const store = db();
    return store.bookings.map((b) => view(store, b)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  attachPayment(bookingId: string, patch: Partial<Payment> & { amountCents: number; userId: string }) {
    const store = db();
    const existing = store.payments.find((p) => p.bookingId === bookingId && p.status === "PENDING");
    if (existing) {
      Object.assign(existing, patch, { updatedAt: new Date() });
      return existing;
    }
    const p: Payment = {
      id: id("pay_"),
      bookingId,
      provider: "paymob",
      status: "PENDING",
      paymobTxnId: null,
      paymobIntentionId: null,
      clientSecret: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...patch,
    };
    store.payments.push(p);
    return p;
  },
  confirmPayment(opts: { bookingId?: string; txnId?: string; intentionId?: string }) {
    const store = db();
    const payment =
      store.payments.find((p) => opts.txnId && p.paymobTxnId === opts.txnId) ||
      store.payments.find((p) => opts.intentionId && p.paymobIntentionId === opts.intentionId) ||
      store.payments.find((p) => opts.bookingId && p.bookingId === opts.bookingId);
    if (!payment) return { ok: false as const, reason: "NO_PAYMENT" };
    if (payment.status === "PAID") return { ok: true as const, booking: view(store, store.bookings.find((b) => b.id === payment.bookingId)!) };
    const booking = store.bookings.find((b) => b.id === payment.bookingId);
    const slot = booking ? store.slots.find((s) => s.id === booking.slotId) : null;
    if (!booking || !slot) return { ok: false as const, reason: "MISSING" };

    if (slot.status === "RESERVED" && booking.status !== "PENDING_PAYMENT") {
      return { ok: false as const, reason: "TAKEN" };
    }
    if (slot.status === "HOLDING" && slot.holdExpiresAt && slot.holdExpiresAt.getTime() < Date.now()) {
      const taken = store.bookings.find((b) => b.slotId === slot.id && b.status === "CONFIRMED");
      if (taken && taken.id !== booking.id) return { ok: false as const, reason: "TAKEN" };
    }

    payment.status = "PAID";
    payment.updatedAt = new Date();
    if (opts.txnId) payment.paymobTxnId = opts.txnId;
    booking.status = "CONFIRMED";
    slot.status = "RESERVED";
    slot.holdExpiresAt = null;
    return { ok: true as const, booking: view(store, booking) };
  },
  failPayment(bookingId: string) {
    const store = db();
    const payment = store.payments.find((p) => p.bookingId === bookingId);
    if (payment && payment.status !== "PAID") payment.status = "FAILED";
    return demo.getBooking(bookingId);
  },
  demoPay(bookingId: string) {
    return this.confirmPayment({ bookingId });
  },
  updatePlayers(bookingId: string, names: string[]) {
    const b = db().bookings.find((x) => x.id === bookingId);
    if (!b) return null;
    b.playerNames = names.filter(Boolean).slice(0, 4);
    return demo.getBooking(bookingId);
  },
  cancel(bookingId: string) {
    const store = db();
    const booking = store.bookings.find((b) => b.id === bookingId);
    const slot = booking ? store.slots.find((s) => s.id === booking.slotId) : null;
    if (!booking || !slot) throw new Error("MISSING");
    if (booking.status === "CANCELLED") return view(store, booking);
    if (booking.status === "CHECKED_IN") throw new Error("CHECKED_IN");
    const pct = refundPercent(slot.start);
    const refundCents = Math.round(booking.depositCents * (pct / 100));
    booking.status = "CANCELLED";
    booking.cancelledAt = new Date();
    booking.refundCents = refundCents;
    booking.refundStatus = refundCents > 0 ? "PROCESSING" : "NONE";
    slot.status = "FREE";
    slot.holdExpiresAt = null;
    const payment = store.payments.find((p) => p.bookingId === booking.id && p.status === "PAID");
    if (payment && refundCents > 0) {
      payment.status = "REFUNDED";
      booking.refundStatus = "REFUNDED";
    }
    return view(store, booking);
  },
  markRefund(bookingId: string, status: Booking["refundStatus"]) {
    const b = db().bookings.find((x) => x.id === bookingId);
    if (!b) return null;
    b.refundStatus = status;
    return demo.getBooking(bookingId);
  },
  redeem(token: string) {
    const store = db();
    const booking = store.bookings.find((b) => b.qrToken === token || b.code === token.toUpperCase());
    if (!booking) return { ok: false as const, reason: "NOT_FOUND" as const };
    if (booking.status === "CHECKED_IN" || booking.redeemedAt) {
      return { ok: false as const, reason: "ALREADY" as const, booking: view(store, booking) };
    }
    if (booking.status !== "CONFIRMED") {
      return { ok: false as const, reason: "INVALID" as const, booking: view(store, booking) };
    }
    booking.status = "CHECKED_IN";
    booking.redeemedAt = new Date();
    return { ok: true as const, booking: view(store, booking) };
  },
  updateBooking(id: string, patch: Partial<Booking> & { slotId?: string }) {
    const store = db();
    const b = store.bookings.find((x) => x.id === id);
    if (!b) return null;
    if (patch.slotId && patch.slotId !== b.slotId) {
      const next = store.slots.find((s) => s.id === patch.slotId);
      const prev = store.slots.find((s) => s.id === b.slotId);
      if (!next || next.status !== "FREE") throw new Error("SLOT_TAKEN");
      if (prev) prev.status = "FREE";
      next.status = "RESERVED";
      b.slotId = next.id;
      b.courtId = next.courtId;
    }
    if (patch.status) b.status = patch.status;
    if (patch.playerNames) b.playerNames = patch.playerNames;
    if (patch.status === "NO_SHOW") {
      const slot = store.slots.find((s) => s.id === b.slotId);
      if (slot) slot.status = "FREE";
    }
    return view(store, b);
  },
  setSlotStatus(id: string, status: SlotStatus) {
    const s = db().slots.find((x) => x.id === id);
    if (!s) return null;
    s.status = status;
    return s;
  },
  expireHolds() {
    expireHolds(db());
  },
  statsToday() {
    const store = db();
    const today = cairoParts();
    const todays = store.bookings.filter((b) => {
      const slot = store.slots.find((s) => s.id === b.slotId);
      if (!slot) return false;
      const p = cairoParts(slot.start);
      return p.day === today.day && p.month === today.month;
    });
    const active = todays.filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN");
    const revenue = active.reduce((s, b) => s + b.depositCents, 0);
    const noShows = todays.filter((b) => b.status === "NO_SHOW").length;
    const daySlots = store.slots.filter((s) => {
      const p = cairoParts(s.start);
      return p.day === today.day && p.month === today.month;
    });
    const reserved = daySlots.filter((s) => s.status === "RESERVED").length;
    const occupancy = daySlots.length ? Math.round((reserved / daySlots.length) * 100) : 0;
    return { bookings: active.length, revenue, occupancy, noShows };
  },
};
