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
  startOfCairoDay,
} from "./utils";
import {
  FLASH_MS,
  FLASH_PERCENT,
  hasFlash,
  pointsFromDeposit,
  pointsSpent,
  pricedSlot,
  redeemCents,
  REFERRAL_BONUS,
} from "./pricing";
import type {
  Booking,
  BookingView,
  Court,
  Friendship,
  JoinRequest,
  LoyaltyEvent,
  Payment,
  Profile,
  Promotion,
  SlotStatus,
  SlotView,
  TimeSlot,
  WaitlistEntry,
  WaitlistNotice,
} from "./types";

type Store = {
  profiles: Profile[];
  courts: Court[];
  slots: TimeSlot[];
  bookings: Booking[];
  payments: Payment[];
  friendships: Friendship[];
  joinRequests: JoinRequest[];
  waitlist: WaitlistEntry[];
  promotions: Promotion[];
  loyalty: LoyaltyEvent[];
  notices: WaitlistNotice[];
};

const g = globalThis as unknown as { __yp_v2?: Store };

function player(
  id: string,
  email: string,
  name: string,
  phone: string,
  created: Date,
  extra: Partial<Profile> = {},
): Profile {
  return {
    id,
    email,
    name,
    phone,
    role: "PLAYER",
    createdAt: created,
    password: "padel123",
    points: 0,
    referralCode: extra.referralCode || `YALLA-${id.slice(-4).toUpperCase()}`,
    referredById: null,
    ...extra,
  };
}

function seed(): Store {
  const mostafa: Profile = {
    id: "user-mostafa",
    email: "mostafa@yallapadel.club",
    name: "Mostafa",
    phone: "+201001112233",
    role: "ADMIN",
    createdAt: cairoDate(2025, 1, 10),
    password: "padel123",
    points: 0,
    referralCode: "YALLA-MOST",
    referredById: null,
  };
  const omar = player("user-omar", "omar@yallapadel.club", "Omar E.", "+201009998877", cairoDate(2026, 2, 1), {
    referralCode: "YALLA-OMAR",
    points: 400,
  });
  const lina = player("user-lina", "lina@yallapadel.club", "Lina K.", "+201005554433", cairoDate(2026, 3, 12), {
    referralCode: "YALLA-LINA",
    points: 220,
    referredById: "user-omar",
  });
  const nabil = player("user-nabil", "nabil@yallapadel.club", "Nabil S.", "+201002223344", cairoDate(2026, 5, 4), {
    referralCode: "YALLA-NABL",
    points: 80,
  });
  const yasmin = player("user-yasmin", "yasmin@yallapadel.club", "Yasmin A.", "+201003334455", cairoDate(2026, 6, 18), {
    referralCode: "YALLA-YASM",
    points: 50,
  });

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
    profiles: [mostafa, omar, lina, nabil, yasmin],
    courts,
    slots,
    bookings: [],
    payments: [],
    friendships: [
      { id: "fr-1", fromId: omar.id, toId: lina.id, status: "ACCEPTED" },
      { id: "fr-2", fromId: nabil.id, toId: omar.id, status: "PENDING" },
    ],
    joinRequests: [],
    waitlist: [],
    promotions: [
      {
        id: "promo-morning",
        kind: "MORNING",
        percentOff: 30,
        active: false,
        hourStart: 8,
        hourEnd: 12,
        slotId: null,
        endsAt: null,
        usageCount: 0,
      },
    ],
    loyalty: [],
    notices: [],
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
      confirmSeedBooking(store, slot, who, court, h === 20 && court.id === "court-01");
    }
  }

  const packed = store.slots.find(
    (s) =>
      s.courtId === "court-01" &&
      hourInCairo(s.start) === 20 &&
      cairoParts(s.start).day === today.day,
  );
  if (packed) {
    store.waitlist.push({
      id: id("wl_"),
      slotId: packed.id,
      userId: yasmin.id,
      createdAt: new Date(),
      notifiedAt: null,
    });
  }

  return store;
}

function confirmSeedBooking(store: Store, slot: TimeSlot, user: Profile, court: Court, openToJoin = false) {
  const total = pricedSlot(court.peakPriceCents, court.offPeakPriceCents, slot, court.offPeakEnd, store.promotions);
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
    loyaltyRedeemCents: 0,
    playerNames: openToJoin ? [user.name] : [user.name, "Guest"],
    qrToken: qrToken(),
    redeemedAt: null,
    cancelledAt: null,
    refundStatus: "NONE",
    refundCents: 0,
    openToJoin,
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
  if (!g.__yp_v2) g.__yp_v2 = seed();
  expireHolds(g.__yp_v2);
  expireFlash(g.__yp_v2);
  return g.__yp_v2;
}

function expireFlash(store: Store) {
  const now = Date.now();
  for (const p of store.promotions) {
    if (p.kind === "FLASH" && p.endsAt && p.endsAt.getTime() <= now) p.active = false;
  }
}

function notifyWaitlist(store: Store, slot: TimeSlot, flashPercent: number | null) {
  const next = store.waitlist
    .filter((w) => w.slotId === slot.id && !w.notifiedAt)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  if (!next) return;
  next.notifiedAt = new Date();
  const user = store.profiles.find((p) => p.id === next.userId);
  const court = store.courts.find((c) => c.id === slot.courtId);
  if (!user || !court) return;
  store.notices.push({
    userId: user.id,
    email: user.email,
    name: user.name,
    slotId: slot.id,
    courtName: court.name,
    start: slot.start,
    flashPercent,
  });
}

function expireHolds(store: Store) {
  const now = Date.now();
  for (const slot of store.slots) {
    if (slot.status === "HOLDING" && slot.holdExpiresAt && slot.holdExpiresAt.getTime() <= now) {
      const booking = store.bookings.find((b) => b.slotId === slot.id && b.status === "PENDING_PAYMENT");
      if (booking) booking.status = "CANCELLED";
      slot.status = "FREE";
      slot.holdExpiresAt = null;
      notifyWaitlist(store, slot, null);
    }
  }
}

function strip(p: Profile): Profile {
  const { password: _pw, ...rest } = p;
  void _pw;
  return rest;
}

function view(store: Store, b: Booking): BookingView {
  const court = store.courts.find((c) => c.id === b.courtId)!;
  const slot = store.slots.find((s) => s.id === b.slotId)!;
  const user = strip(store.profiles.find((p) => p.id === b.userId)!);
  const payments = store.payments.filter((p) => p.bookingId === b.id);
  return { ...b, court, slot, user, payments };
}

function priceFor(store: Store, slot: TimeSlot) {
  const court = store.courts.find((c) => c.id === slot.courtId)!;
  return pricedSlot(court.peakPriceCents, court.offPeakPriceCents, slot, court.offPeakEnd, store.promotions);
}

function addPoints(store: Store, userId: string, delta: number, reason: string, bookingId: string | null) {
  const p = store.profiles.find((x) => x.id === userId);
  if (!p) return;
  p.points = Math.max(0, p.points + delta);
  store.loyalty.push({
    id: id("lp_"),
    userId,
    delta,
    reason,
    bookingId,
    createdAt: new Date(),
  });
}

function toSlotView(store: Store, s: TimeSlot): SlotView {
  return {
    ...s,
    priceCents: priceFor(store, s),
    flash: hasFlash(s.id, store.promotions),
  };
}

export const demo = {
  listProfiles() {
    return db().profiles.map(strip);
  },
  getProfile(id: string) {
    const p = db().profiles.find((x) => x.id === id);
    return p ? strip(p) : null;
  },
  findByEmail(email: string) {
    return db().profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
  register(input: { email: string; password: string; name: string; phone?: string; ref?: string }) {
    const store = db();
    if (store.profiles.some((p) => p.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("EMAIL_TAKEN");
    }
    const referrer = input.ref
      ? store.profiles.find((p) => p.referralCode.toUpperCase() === input.ref!.toUpperCase())
      : null;
    const created: Profile = {
      id: id("user_"),
      email: input.email,
      name: input.name,
      phone: input.phone || "+201000000000",
      role: "PLAYER",
      createdAt: new Date(),
      password: input.password,
      points: 0,
      referralCode: `YALLA-${id("").slice(0, 4).toUpperCase()}`,
      referredById: referrer && referrer.email.toLowerCase() !== input.email.toLowerCase() ? referrer.id : null,
    };
    store.profiles.push(created);
    return created;
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
  slotsFor(courtId: string, day: Date): SlotView[] {
    const store = db();
    const p = cairoParts(day);
    return store.slots
      .filter((s) => {
        const sp = cairoParts(s.start);
        return s.courtId === courtId && sp.year === p.year && sp.month === p.month && sp.day === p.day;
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((s) => toSlotView(store, s));
  },
  allSlotsOn(day: Date) {
    const p = cairoParts(day);
    return db().slots.filter((s) => {
      const sp = cairoParts(s.start);
      return sp.year === p.year && sp.month === p.month && sp.day === p.day;
    });
  },
  getSlot(id: string) {
    const store = db();
    const s = store.slots.find((x) => x.id === id);
    return s ? toSlotView(store, s) : null;
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
    const total = priceFor(store, slot);
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
        loyaltyRedeemCents: 0,
        playerNames: playerNames.filter(Boolean).slice(0, 4),
        qrToken: qrToken(),
        redeemedAt: null,
        cancelledAt: null,
        refundStatus: "NONE",
        refundCents: 0,
        openToJoin: false,
        createdAt: new Date(),
      };
      store.bookings.push(booking);
    } else {
      booking.playerNames = playerNames.filter(Boolean).slice(0, 4);
      booking.depositCents = deposit;
      booking.remainingCents = total - deposit;
      booking.totalCents = total;
    }
    const flash = store.promotions.find((p) => p.kind === "FLASH" && p.slotId === slot.id && p.active);
    if (flash) flash.usageCount += 1;
    return { booking: view(store, booking), expiresAt: slot.holdExpiresAt };
  },
  applyLoyalty(bookingId: string, userId: string, usePoints: boolean) {
    const store = db();
    const booking = store.bookings.find((b) => b.id === bookingId && b.userId === userId);
    const user = store.profiles.find((p) => p.id === userId);
    if (!booking || !user || booking.status !== "PENDING_PAYMENT") return demo.getBooking(bookingId);
    const slot = store.slots.find((s) => s.id === booking.slotId)!;
    const total = priceFor(store, slot);
    const rawDeposit = depositOf(total);
    const off = usePoints ? redeemCents(user.points, rawDeposit) : 0;
    booking.totalCents = total;
    booking.loyaltyRedeemCents = off;
    booking.depositCents = rawDeposit - off;
    booking.remainingCents = total - rawDeposit;
    return view(store, booking);
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
    if (payment.status === "PAID")
      return { ok: true as const, booking: view(store, store.bookings.find((b) => b.id === payment.bookingId)!) };
    const booking = store.bookings.find((b) => b.id === payment.bookingId);
    const slot = booking ? store.slots.find((s) => s.id === booking.slotId) : null;
    if (!booking || !slot) return { ok: false as const, reason: "MISSING" };

    if (slot.status === "RESERVED" && booking.status !== "PENDING_PAYMENT") {
      return { ok: false as const, reason: "TAKEN" };
    }

    const user = store.profiles.find((p) => p.id === booking.userId)!;
    if (booking.loyaltyRedeemCents > 0) {
      addPoints(store, user.id, -pointsSpent(booking.loyaltyRedeemCents), "redeem", booking.id);
    }

    payment.status = "PAID";
    payment.amountCents = booking.depositCents;
    payment.updatedAt = new Date();
    if (opts.txnId) payment.paymobTxnId = opts.txnId;
    booking.status = "CONFIRMED";
    slot.status = "RESERVED";
    slot.holdExpiresAt = null;

    const earned = pointsFromDeposit(booking.depositCents);
    addPoints(store, user.id, earned, "booking", booking.id);

    const confirmedCount = store.bookings.filter(
      (b) => b.userId === user.id && (b.status === "CONFIRMED" || b.status === "CHECKED_IN") && b.id !== booking.id,
    ).length;
    if (confirmedCount === 0 && user.referredById) {
      addPoints(store, user.id, REFERRAL_BONUS, "referral", booking.id);
      addPoints(store, user.referredById, REFERRAL_BONUS, "referral", booking.id);
    }

    const flash = store.promotions.find((p) => p.kind === "FLASH" && p.slotId === slot.id && p.active);
    if (flash) flash.active = false;

    return { ok: true as const, booking: view(store, booking) };
  },
  failPayment(bookingId: string) {
    const store = db();
    const payment = store.payments.find((p) => p.bookingId === bookingId);
    if (payment && payment.status !== "PAID") payment.status = "FAILED";
    return demo.getBooking(bookingId);
  },
  demoPay(bookingId: string, usePoints = false) {
    if (usePoints) {
      const b = db().bookings.find((x) => x.id === bookingId);
      if (b) demo.applyLoyalty(bookingId, b.userId, true);
    }
    return this.confirmPayment({ bookingId });
  },
  updatePlayers(bookingId: string, names: string[]) {
    const b = db().bookings.find((x) => x.id === bookingId);
    if (!b) return null;
    b.playerNames = names.filter(Boolean).slice(0, 4);
    return demo.getBooking(bookingId);
  },
  setOpenToJoin(bookingId: string, open: boolean) {
    const b = db().bookings.find((x) => x.id === bookingId);
    if (!b) return null;
    b.openToJoin = open;
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
    booking.openToJoin = false;
    slot.status = "FREE";
    slot.holdExpiresAt = null;
    const payment = store.payments.find((p) => p.bookingId === booking.id && p.status === "PAID");
    if (payment && refundCents > 0) {
      payment.status = "REFUNDED";
      booking.refundStatus = "REFUNDED";
    }
    const flash: Promotion = {
      id: id("fl_"),
      kind: "FLASH",
      percentOff: FLASH_PERCENT,
      active: true,
      hourStart: null,
      hourEnd: null,
      slotId: slot.id,
      endsAt: new Date(Date.now() + FLASH_MS),
      usageCount: 0,
    };
    store.promotions.push(flash);
    notifyWaitlist(store, slot, FLASH_PERCENT);
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
    if (typeof patch.openToJoin === "boolean") b.openToJoin = patch.openToJoin;
    if (patch.status === "NO_SHOW") {
      const slot = store.slots.find((s) => s.id === b.slotId);
      if (slot) {
        slot.status = "FREE";
        notifyWaitlist(store, slot, null);
      }
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
  takeWaitlistNotices() {
    const store = db();
    const n = store.notices.splice(0, store.notices.length);
    return n;
  },
  joinWaitlist(slotId: string, userId: string) {
    const store = db();
    const slot = store.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error("SLOT_MISSING");
    if (slot.status === "FREE") throw new Error("FREE");
    if (store.waitlist.some((w) => w.slotId === slotId && w.userId === userId && !w.notifiedAt)) {
      return store.waitlist.find((w) => w.slotId === slotId && w.userId === userId)!;
    }
    const entry: WaitlistEntry = {
      id: id("wl_"),
      slotId,
      userId,
      createdAt: new Date(),
      notifiedAt: null,
    };
    store.waitlist.push(entry);
    return entry;
  },
  leaveWaitlist(slotId: string, userId: string) {
    const store = db();
    store.waitlist = store.waitlist.filter((w) => !(w.slotId === slotId && w.userId === userId && !w.notifiedAt));
  },
  waitlistForUser(userId: string) {
    const store = db();
    return store.waitlist
      .filter((w) => w.userId === userId)
      .map((w) => {
        const slot = store.slots.find((s) => s.id === w.slotId)!;
        const court = store.courts.find((c) => c.id === slot.courtId)!;
        return { ...w, slot: toSlotView(store, slot), court };
      });
  },
  waitlistedSlotIds(userId: string) {
    return db()
      .waitlist.filter((w) => w.userId === userId && !w.notifiedAt)
      .map((w) => w.slotId);
  },
  friendsOf(userId: string) {
    const store = db();
    const rows = store.friendships.filter(
      (f) => f.status === "ACCEPTED" && (f.fromId === userId || f.toId === userId),
    );
    return rows.map((f) => strip(store.profiles.find((p) => p.id === (f.fromId === userId ? f.toId : f.fromId))!));
  },
  friendRequests(userId: string) {
    const store = db();
    const incoming = store.friendships.filter((f) => f.toId === userId && f.status === "PENDING");
    const outgoing = store.friendships.filter((f) => f.fromId === userId && f.status === "PENDING");
    return {
      incoming: incoming.map((f) => ({ ...f, user: strip(store.profiles.find((p) => p.id === f.fromId)!) })),
      outgoing: outgoing.map((f) => ({ ...f, user: strip(store.profiles.find((p) => p.id === f.toId)!) })),
    };
  },
  requestFriend(fromId: string, email: string) {
    const store = db();
    const to = store.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!to) throw new Error("NOT_FOUND");
    if (to.id === fromId) throw new Error("SELF");
    const existing = store.friendships.find(
      (f) => (f.fromId === fromId && f.toId === to.id) || (f.fromId === to.id && f.toId === fromId),
    );
    if (existing) return existing;
    const row: Friendship = { id: id("fr_"), fromId, toId: to.id, status: "PENDING" };
    store.friendships.push(row);
    return row;
  },
  answerFriend(id: string, userId: string, accept: boolean) {
    const f = db().friendships.find((x) => x.id === id && x.toId === userId);
    if (!f) return null;
    f.status = accept ? "ACCEPTED" : "PENDING";
    if (!accept) {
      db().friendships.splice(db().friendships.indexOf(f), 1);
    }
    return f;
  },
  openGames() {
    const store = db();
    return store.bookings
      .filter((b) => b.status === "CONFIRMED" && b.openToJoin && b.playerNames.filter(Boolean).length < 4)
      .map((b) => view(store, b));
  },
  requestJoin(bookingId: string, userId: string) {
    const store = db();
    const booking = store.bookings.find((b) => b.id === bookingId);
    if (!booking || !booking.openToJoin || booking.status !== "CONFIRMED") throw new Error("CLOSED");
    if (booking.userId === userId) throw new Error("SELF");
    if (booking.playerNames.filter(Boolean).length >= 4) throw new Error("FULL");
    const existing = store.joinRequests.find((j) => j.bookingId === bookingId && j.userId === userId);
    if (existing) return existing;
    const row: JoinRequest = { id: id("jr_"), bookingId, userId, status: "PENDING", createdAt: new Date() };
    store.joinRequests.push(row);
    return row;
  },
  joinRequestsForHost(userId: string) {
    const store = db();
    return store.joinRequests
      .filter((j) => j.status === "PENDING")
      .map((j) => {
        const booking = store.bookings.find((b) => b.id === j.bookingId);
        if (!booking || booking.userId !== userId) return null;
        const user = strip(store.profiles.find((p) => p.id === j.userId)!);
        return { ...j, booking: view(store, booking), user };
      })
      .filter(Boolean) as Array<JoinRequest & { booking: BookingView; user: Profile }>;
  },
  answerJoin(id: string, hostId: string, accept: boolean) {
    const store = db();
    const req = store.joinRequests.find((j) => j.id === id);
    if (!req) return null;
    const booking = store.bookings.find((b) => b.id === req.bookingId);
    if (!booking || booking.userId !== hostId) throw new Error("FORBIDDEN");
    req.status = accept ? "ACCEPTED" : "DECLINED";
    if (accept) {
      const guest = store.profiles.find((p) => p.id === req.userId)!;
      const names = [...booking.playerNames];
      while (names.length < 4) names.push("");
      const empty = names.findIndex((n, i) => i > 0 && !n);
      if (empty === -1 && names.filter(Boolean).length >= 4) throw new Error("FULL");
      if (empty >= 0) names[empty] = guest.name;
      else names.push(guest.name);
      booking.playerNames = names.filter((_, i) => i < 4);
    }
    return req;
  },
  listPromotions() {
    expireFlash(db());
    return db().promotions;
  },
  setMorningPromo(active: boolean, percentOff?: number) {
    const store = db();
    let p = store.promotions.find((x) => x.kind === "MORNING");
    if (!p) {
      p = {
        id: "promo-morning",
        kind: "MORNING",
        percentOff: percentOff ?? 30,
        active,
        hourStart: 8,
        hourEnd: 12,
        slotId: null,
        endsAt: null,
        usageCount: 0,
      };
      store.promotions.push(p);
    }
    p.active = active;
    if (percentOff) p.percentOff = percentOff;
    return p;
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
