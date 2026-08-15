import type { PrismaClient } from "@prisma/client";
import { getPrisma } from "./prisma";
import {
  bookingCode,
  cairoDate,
  cairoParts,
  depositOf,
  HOLD_MS,
  id,
  parseHm,
  qrToken,
  refundPercent,
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
  Payment,
  Profile,
  Promotion,
  SlotStatus,
  SlotView,
  TimeSlot,
  WaitlistEntry,
  WaitlistNotice,
} from "./types";

function prisma(): PrismaClient {
  const client = getPrisma();
  if (!client) throw new Error("DATABASE_NOT_CONNECTED");
  return client;
}

function strip(p: Profile): Profile {
  const { password: _pw, ...rest } = p;
  void _pw;
  return rest;
}

function asProfile(row: {
  id: string;
  email: string;
  name: string;
  phone: string;
  password: string | null;
  role: Profile["role"];
  points: number;
  referralCode: string;
  referredById: string | null;
  createdAt: Date;
}): Profile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    password: row.password ?? undefined,
    role: row.role,
    points: row.points,
    referralCode: row.referralCode,
    referredById: row.referredById,
    createdAt: row.createdAt,
  };
}

function asCourt(row: {
  id: string;
  slug: string;
  name: string;
  type: string;
  location: string;
  description: string;
  imageUrl: string | null;
  peakPriceCents: number;
  offPeakPriceCents: number;
  offPeakEnd: string;
  openingTime: string;
  closingTime: string;
  status: Court["status"];
}): Court {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    location: row.location,
    description: row.description,
    imageUrl: row.imageUrl,
    peakPriceCents: row.peakPriceCents,
    offPeakPriceCents: row.offPeakPriceCents,
    offPeakEnd: row.offPeakEnd,
    openingTime: row.openingTime,
    closingTime: row.closingTime,
    status: row.status,
  };
}

function asSlot(row: {
  id: string;
  courtId: string;
  start: Date;
  end: Date;
  status: SlotStatus;
  holdExpiresAt: Date | null;
}): TimeSlot {
  return {
    id: row.id,
    courtId: row.courtId,
    start: row.start,
    end: row.end,
    status: row.status,
    holdExpiresAt: row.holdExpiresAt,
  };
}

function asBooking(row: {
  id: string;
  code: string;
  userId: string;
  courtId: string;
  slotId: string;
  status: Booking["status"];
  depositCents: number;
  remainingCents: number;
  totalCents: number;
  loyaltyRedeemCents: number;
  playerNames: string[];
  qrToken: string;
  redeemedAt: Date | null;
  cancelledAt: Date | null;
  refundStatus: Booking["refundStatus"];
  refundCents: number;
  openToJoin: boolean;
  createdAt: Date;
}): Booking {
  return {
    id: row.id,
    code: row.code,
    userId: row.userId,
    courtId: row.courtId,
    slotId: row.slotId,
    status: row.status,
    depositCents: row.depositCents,
    remainingCents: row.remainingCents,
    totalCents: row.totalCents,
    loyaltyRedeemCents: row.loyaltyRedeemCents,
    playerNames: row.playerNames,
    qrToken: row.qrToken,
    redeemedAt: row.redeemedAt,
    cancelledAt: row.cancelledAt,
    refundStatus: row.refundStatus,
    refundCents: row.refundCents,
    openToJoin: row.openToJoin,
    createdAt: row.createdAt,
  };
}

function asPayment(row: {
  id: string;
  bookingId: string;
  userId: string;
  provider: string;
  amountCents: number;
  status: Payment["status"];
  paymobTxnId: string | null;
  paymobIntentionId: string | null;
  clientSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Payment {
  return {
    id: row.id,
    bookingId: row.bookingId,
    userId: row.userId,
    provider: row.provider,
    amountCents: row.amountCents,
    status: row.status,
    paymobTxnId: row.paymobTxnId,
    paymobIntentionId: row.paymobIntentionId,
    clientSecret: row.clientSecret,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function asPromo(row: {
  id: string;
  kind: Promotion["kind"];
  percentOff: number;
  active: boolean;
  hourStart: number | null;
  hourEnd: number | null;
  slotId: string | null;
  endsAt: Date | null;
  usageCount: number;
}): Promotion {
  return {
    id: row.id,
    kind: row.kind,
    percentOff: row.percentOff,
    active: row.active,
    hourStart: row.hourStart,
    hourEnd: row.hourEnd,
    slotId: row.slotId,
    endsAt: row.endsAt,
    usageCount: row.usageCount,
  };
}

function dayBounds(day: Date) {
  const p = cairoParts(day);
  const start = cairoDate(Number(p.year), Number(p.month), Number(p.day), 0, 0);
  const end = cairoDate(Number(p.year), Number(p.month), Number(p.day) + 1, 0, 0);
  return { p, start, end };
}

async function expireFlash() {
  await prisma().promotion.updateMany({
    where: { kind: "FLASH", active: true, endsAt: { lte: new Date() } },
    data: { active: false },
  });
}

async function livePromos() {
  await expireFlash();
  const rows = await prisma().promotion.findMany();
  return rows.map(asPromo);
}

async function priceFor(slot: TimeSlot, court?: Court | null, promos?: Promotion[]) {
  const c = court ?? (await prisma().court.findUnique({ where: { id: slot.courtId } }));
  if (!c) return 0;
  const list = promos ?? (await livePromos());
  return pricedSlot(c.peakPriceCents, c.offPeakPriceCents, slot, c.offPeakEnd, list);
}

async function toSlotView(slot: TimeSlot, court?: Court | null, promos?: Promotion[]): Promise<SlotView> {
  const list = promos ?? (await livePromos());
  return {
    ...slot,
    priceCents: await priceFor(slot, court, list),
    flash: hasFlash(slot.id, list),
  };
}

async function view(bookingId: string): Promise<BookingView | null> {
  const row = await prisma().booking.findUnique({
    where: { id: bookingId },
    include: { court: true, slot: true, user: true, payments: true },
  });
  if (!row) return null;
  return {
    ...asBooking(row),
    court: asCourt(row.court),
    slot: asSlot(row.slot),
    user: strip(asProfile(row.user)),
    payments: row.payments.map(asPayment),
  };
}

async function addPoints(userId: string, delta: number, reason: string, bookingId: string | null) {
  await prisma().$transaction([
    prisma().profile.update({
      where: { id: userId },
      data: { points: { increment: delta } },
    }),
    prisma().loyaltyEvent.create({
      data: { userId, delta, reason, bookingId },
    }),
  ]);
  const user = await prisma().profile.findUnique({ where: { id: userId } });
  if (user && user.points < 0) {
    await prisma().profile.update({ where: { id: userId }, data: { points: 0 } });
  }
}

async function ensureClub() {
  const count = await prisma().court.count();
  if (count === 0) {
    await prisma().court.createMany({
      skipDuplicates: true,
      data: [
        {
          id: "court-01",
          slug: "court-01",
          name: "COURT 01",
          type: "Premium Glass Court",
          location: "Sheikh Zayed, Cairo",
          description: "Panoramic glass, tournament lights.",
          peakPriceCents: 50000,
          offPeakPriceCents: 35000,
        },
        {
          id: "court-02",
          slug: "court-02",
          name: "COURT 02",
          type: "Night Court",
          location: "Sheikh Zayed, Cairo",
          description: "Fast surface, LED canopy.",
          peakPriceCents: 45000,
          offPeakPriceCents: 30000,
        },
      ],
    });
  }
  await prisma().profile.upsert({
    where: { email: "mostafa@yallapadel.club" },
    update: { role: "ADMIN" },
    create: {
      id: "user-mostafa",
      email: "mostafa@yallapadel.club",
      name: "Mostafa",
      phone: "+201001112233",
      password: "padel123",
      role: "ADMIN",
      referralCode: "YALLA-MOST",
    },
  });
  await prisma().clubSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", name: "YallaPadel", location: "Sheikh Zayed, Cairo" },
  });
}

async function ensureSlots(courtId: string, day: Date) {
  const { p, start, end } = dayBounds(day);
  const existing = await prisma().timeSlot.count({
    where: { courtId, start: { gte: start, lt: end } },
  });
  if (existing > 0) return;
  const court = await prisma().court.findUnique({ where: { id: courtId } });
  if (!court) return;
  const open = parseHm(court.openingTime);
  const close = parseHm(court.closingTime);
  const rows = [];
  for (let h = open.h; h < close.h; h++) {
    const s = cairoDate(Number(p.year), Number(p.month), Number(p.day), h, 0);
    const e = cairoDate(Number(p.year), Number(p.month), Number(p.day), h + 1, 0);
    rows.push({
      id: `${courtId}-${p.year}${p.month}${p.day}-${String(h).padStart(2, "0")}`,
      courtId,
      start: s,
      end: e,
      status: "FREE" as const,
    });
  }
  if (rows.length) await prisma().timeSlot.createMany({ data: rows, skipDuplicates: true });
}

async function notifyWaitlist(slotId: string) {
  const next = await prisma().waitlistEntry.findFirst({
    where: { slotId, notifiedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!next) return;
  await prisma().waitlistEntry.update({
    where: { id: next.id },
    data: { notifiedAt: new Date() },
  });
}

export const prismaStore = {
  async listProfiles() {
    await ensureClub();
    const rows = await prisma().profile.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map((r) => strip(asProfile(r)));
  },
  async getProfile(id: string) {
    const row = await prisma().profile.findUnique({ where: { id } });
    return row ? strip(asProfile(row)) : null;
  },
  async findByEmail(email: string) {
    const row = await prisma().profile.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    return row ? asProfile(row) : null;
  },
  async register(input: { email: string; password: string; name: string; phone?: string; ref?: string }) {
    const taken = await prisma().profile.findFirst({
      where: { email: { equals: input.email, mode: "insensitive" } },
    });
    if (taken) throw new Error("EMAIL_TAKEN");
    const referrer = input.ref
      ? await prisma().profile.findFirst({
          where: { referralCode: { equals: input.ref, mode: "insensitive" } },
        })
      : null;
    const created = await prisma().profile.create({
      data: {
        id: id("user_"),
        email: input.email,
        name: input.name,
        phone: input.phone || "+201000000000",
        password: input.password,
        role: "PLAYER",
        points: 0,
        referralCode: `YALLA-${id("").slice(0, 4).toUpperCase()}`,
        referredById:
          referrer && referrer.email.toLowerCase() !== input.email.toLowerCase() ? referrer.id : null,
      },
    });
    return asProfile(created);
  },
  async ensureProfile(user: Profile) {
    const existing =
      (await prisma().profile.findUnique({ where: { id: user.id } })) ||
      (await prisma().profile.findFirst({
        where: { email: { equals: user.email, mode: "insensitive" } },
      }));
    if (existing) return strip(asProfile(existing));
    const created = await prisma().profile.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || "+201000000000",
        password: user.password || null,
        role: user.role === "ADMIN" ? "ADMIN" : "PLAYER",
        points: user.points ?? 0,
        referralCode: user.referralCode || `YALLA-${id("").slice(0, 4).toUpperCase()}`,
        referredById: user.referredById,
      },
    });
    return strip(asProfile(created));
  },
  async ping() {
    try {
      await ensureClub();
      const [users, bookings] = await Promise.all([
        prisma().profile.count(),
        prisma().booking.count(),
      ]);
      return { ok: true as const, demo: false as const, users, bookings };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Database error";
      return { ok: false as const, demo: false as const, users: 0, bookings: 0, error: message.slice(0, 180) };
    }
  },
  async listCourts() {
    await ensureClub();
    const rows = await prisma().court.findMany({ orderBy: { name: "asc" } });
    return rows.map(asCourt);
  },
  async getCourt(idOrSlug: string) {
    await ensureClub();
    const row = await prisma().court.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    return row ? asCourt(row) : null;
  },
  async updateCourt(id: string, patch: Partial<Court>) {
    const row = await prisma().court.update({
      where: { id },
      data: {
        name: patch.name,
        type: patch.type,
        location: patch.location,
        description: patch.description,
        imageUrl: patch.imageUrl,
        peakPriceCents: patch.peakPriceCents,
        offPeakPriceCents: patch.offPeakPriceCents,
        offPeakEnd: patch.offPeakEnd,
        openingTime: patch.openingTime,
        closingTime: patch.closingTime,
        status: patch.status,
      },
    });
    return asCourt(row);
  },
  async slotsFor(courtId: string, day: Date): Promise<SlotView[]> {
    await this.expireHolds();
    await ensureSlots(courtId, day);
    const { start, end } = dayBounds(day);
    const court = await prisma().court.findUnique({ where: { id: courtId } });
    const promos = await livePromos();
    const rows = await prisma().timeSlot.findMany({
      where: { courtId, start: { gte: start, lt: end } },
      orderBy: { start: "asc" },
    });
    const mapped = await Promise.all(rows.map((s) => toSlotView(asSlot(s), court ? asCourt(court) : null, promos)));
    return mapped;
  },
  async allSlotsOn(day: Date) {
    await this.expireHolds();
    const courts = await prisma().court.findMany();
    for (const c of courts) await ensureSlots(c.id, day);
    const { start, end } = dayBounds(day);
    const rows = await prisma().timeSlot.findMany({
      where: { start: { gte: start, lt: end } },
      orderBy: { start: "asc" },
    });
    return rows.map(asSlot);
  },
  async getSlot(id: string) {
    await this.expireHolds();
    const row = await prisma().timeSlot.findUnique({ where: { id }, include: { court: true } });
    if (!row) return null;
    return toSlotView(asSlot(row), asCourt(row.court));
  },
  async holdSlot(slotId: string, userId: string, playerNames: string[]) {
    await this.expireHolds();
    const names = playerNames.filter(Boolean).slice(0, 4);
    const profile = await prisma().profile.findUnique({ where: { id: userId } });
    if (!profile) throw new Error("USER_MISSING");
    const slotRow = await prisma().timeSlot.findUnique({ where: { id: slotId }, include: { court: true } });
    if (!slotRow) throw new Error("SLOT_MISSING");
    if (slotRow.status === "MAINTENANCE") throw new Error("MAINTENANCE");
    if (slotRow.status === "RESERVED") throw new Error("TAKEN");
    const live = await prisma().booking.findFirst({
      where: { slotId, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
    });
    if (live) throw new Error("TAKEN");
    if (slotRow.status === "HOLDING" && slotRow.holdExpiresAt && slotRow.holdExpiresAt.getTime() > Date.now()) {
      const existing = await prisma().booking.findFirst({
        where: { slotId, status: "PENDING_PAYMENT" },
      });
      if (existing && existing.userId !== userId) throw new Error("HELD");
    }
    // A slot can hold many historical bookings; only this user's pending one may be reused.
    await prisma().booking.updateMany({
      where: { slotId, status: "PENDING_PAYMENT", userId: { not: userId } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    const slot = asSlot(slotRow);
    const court = asCourt(slotRow.court);
    const promos = (await prisma().promotion.findMany()).map(asPromo);
    const total = pricedSlot(court.peakPriceCents, court.offPeakPriceCents, slot, court.offPeakEnd, promos);
    const deposit = depositOf(total);
    const expiresAt = new Date(Date.now() + HOLD_MS);
    await prisma().timeSlot.update({
      where: { id: slotId },
      data: { status: "HOLDING", holdExpiresAt: expiresAt },
    });
    let booking = await prisma().booking.findFirst({
      where: { slotId, status: "PENDING_PAYMENT", userId },
    });
    if (!booking) {
      booking = await prisma().booking.create({
        data: {
          code: bookingCode(),
          userId,
          courtId: court.id,
          slotId: slot.id,
          status: "PENDING_PAYMENT",
          depositCents: deposit,
          remainingCents: total - deposit,
          totalCents: total,
          loyaltyRedeemCents: 0,
          playerNames: names,
          qrToken: qrToken(),
        },
      });
    } else {
      booking = await prisma().booking.update({
        where: { id: booking.id },
        data: { playerNames: names, depositCents: deposit, remainingCents: total - deposit, totalCents: total },
      });
    }
    const flash = await prisma().promotion.findFirst({
      where: { kind: "FLASH", slotId: slot.id, active: true },
    });
    if (flash) {
      await prisma().promotion.update({ where: { id: flash.id }, data: { usageCount: { increment: 1 } } });
    }
    const viewed = await view(booking.id);
    if (!viewed) throw new Error("MISSING");
    return { booking: viewed, expiresAt };
  },
  async applyLoyalty(bookingId: string, userId: string, usePoints: boolean) {
    const booking = await prisma().booking.findFirst({
      where: { id: bookingId, userId },
      include: { slot: true, court: true, user: true },
    });
    if (!booking || booking.status !== "PENDING_PAYMENT") return this.getBooking(bookingId);
    const promos = await livePromos();
    const total = pricedSlot(
      booking.court.peakPriceCents,
      booking.court.offPeakPriceCents,
      asSlot(booking.slot),
      booking.court.offPeakEnd,
      promos,
    );
    const rawDeposit = depositOf(total);
    const off = usePoints ? redeemCents(booking.user.points, rawDeposit) : 0;
    await prisma().booking.update({
      where: { id: bookingId },
      data: {
        totalCents: total,
        loyaltyRedeemCents: off,
        depositCents: rawDeposit - off,
        remainingCents: total - rawDeposit,
      },
    });
    return view(bookingId);
  },
  async getBooking(idOrCode: string) {
    const row = await prisma().booking.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }, { qrToken: idOrCode }] },
    });
    return row ? view(row.id) : null;
  },
  async bookingsForUser(userId: string) {
    const rows = await prisma().booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const list = await Promise.all(rows.map((b) => view(b.id)));
    return list.filter(Boolean) as BookingView[];
  },
  async allBookings() {
    const rows = await prisma().booking.findMany({ orderBy: { createdAt: "desc" } });
    const list = await Promise.all(rows.map((b) => view(b.id)));
    return list.filter(Boolean) as BookingView[];
  },
  async attachPayment(bookingId: string, patch: Partial<Payment> & { amountCents: number; userId: string }) {
    const existing = await prisma().payment.findFirst({
      where: { bookingId, status: "PENDING" },
    });
    if (existing) {
      const row = await prisma().payment.update({
        where: { id: existing.id },
        data: {
          amountCents: patch.amountCents,
          userId: patch.userId,
          status: patch.status ?? existing.status,
          paymobTxnId: patch.paymobTxnId ?? existing.paymobTxnId,
          paymobIntentionId: patch.paymobIntentionId ?? existing.paymobIntentionId,
          clientSecret: patch.clientSecret ?? existing.clientSecret,
          provider: patch.provider ?? existing.provider,
        },
      });
      return asPayment(row);
    }
    const row = await prisma().payment.create({
      data: {
        bookingId,
        userId: patch.userId,
        provider: patch.provider ?? "paymob",
        amountCents: patch.amountCents,
        status: patch.status ?? "PENDING",
        paymobTxnId: patch.paymobTxnId ?? null,
        paymobIntentionId: patch.paymobIntentionId ?? null,
        clientSecret: patch.clientSecret ?? null,
      },
    });
    return asPayment(row);
  },
  async confirmPayment(opts: { bookingId?: string; txnId?: string; intentionId?: string }) {
    const payment = opts.txnId
      ? await prisma().payment.findFirst({ where: { paymobTxnId: opts.txnId } })
      : opts.intentionId
        ? await prisma().payment.findFirst({ where: { paymobIntentionId: opts.intentionId } })
        : opts.bookingId
          ? await prisma().payment.findFirst({ where: { bookingId: opts.bookingId } })
          : null;
    if (!payment) return { ok: false as const, reason: "NO_PAYMENT" };
    if (payment.status === "PAID") {
      const booking = await view(payment.bookingId);
      return { ok: true as const, booking: booking! };
    }
    const bookingRow = await prisma().booking.findUnique({
      where: { id: payment.bookingId },
      include: { slot: true, user: true },
    });
    if (!bookingRow) return { ok: false as const, reason: "MISSING" };
    if (bookingRow.slot.status === "RESERVED" && bookingRow.status !== "PENDING_PAYMENT") {
      return { ok: false as const, reason: "TAKEN" };
    }

    if (bookingRow.loyaltyRedeemCents > 0) {
      await addPoints(
        bookingRow.userId,
        -pointsSpent(bookingRow.loyaltyRedeemCents),
        "redeem",
        bookingRow.id,
      );
    }

    await prisma().$transaction([
      prisma().payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          amountCents: bookingRow.depositCents,
          paymobTxnId: opts.txnId ?? payment.paymobTxnId,
        },
      }),
      prisma().booking.update({
        where: { id: bookingRow.id },
        data: { status: "CONFIRMED" },
      }),
      prisma().timeSlot.update({
        where: { id: bookingRow.slotId },
        data: { status: "RESERVED", holdExpiresAt: null },
      }),
    ]);

    await addPoints(bookingRow.userId, pointsFromDeposit(bookingRow.depositCents), "booking", bookingRow.id);

    const confirmedCount = await prisma().booking.count({
      where: {
        userId: bookingRow.userId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        id: { not: bookingRow.id },
      },
    });
    if (confirmedCount === 0 && bookingRow.user.referredById) {
      await addPoints(bookingRow.userId, REFERRAL_BONUS, "referral", bookingRow.id);
      await addPoints(bookingRow.user.referredById, REFERRAL_BONUS, "referral", bookingRow.id);
    }

    await prisma().promotion.updateMany({
      where: { kind: "FLASH", slotId: bookingRow.slotId, active: true },
      data: { active: false },
    });

    return { ok: true as const, booking: (await view(bookingRow.id))! };
  },
  async failPayment(bookingId: string) {
    await prisma().payment.updateMany({
      where: { bookingId, status: { not: "PAID" } },
      data: { status: "FAILED" },
    });
    return this.getBooking(bookingId);
  },
  async demoPay(bookingId: string, usePoints = false) {
    if (usePoints) {
      const b = await prisma().booking.findUnique({ where: { id: bookingId } });
      if (b) await this.applyLoyalty(bookingId, b.userId, true);
    }
    const pending = await prisma().payment.findFirst({ where: { bookingId, status: "PENDING" } });
    if (!pending) {
      const booking = await prisma().booking.findUnique({ where: { id: bookingId } });
      if (booking) {
        await this.attachPayment(bookingId, {
          amountCents: booking.depositCents,
          userId: booking.userId,
          status: "PENDING",
        });
      }
    }
    return this.confirmPayment({ bookingId });
  },
  async updatePlayers(bookingId: string, names: string[]) {
    await prisma().booking.update({
      where: { id: bookingId },
      data: { playerNames: names.filter(Boolean).slice(0, 4) },
    });
    return this.getBooking(bookingId);
  },
  async setOpenToJoin(bookingId: string, open: boolean) {
    await prisma().booking.update({ where: { id: bookingId }, data: { openToJoin: open } });
    return this.getBooking(bookingId);
  },
  async cancel(bookingId: string) {
    const booking = await prisma().booking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });
    if (!booking) throw new Error("MISSING");
    if (booking.status === "CANCELLED") return (await view(booking.id))!;
    if (booking.status === "CHECKED_IN") throw new Error("CHECKED_IN");
    const pct = refundPercent(booking.slot.start);
    const refundCents = Math.round(booking.depositCents * (pct / 100));
    await prisma().$transaction([
      prisma().booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          refundCents,
          refundStatus: refundCents > 0 ? "PROCESSING" : "NONE",
          openToJoin: false,
        },
      }),
      prisma().timeSlot.update({
        where: { id: booking.slotId },
        data: { status: "FREE", holdExpiresAt: null },
      }),
      prisma().promotion.create({
        data: {
          kind: "FLASH",
          percentOff: FLASH_PERCENT,
          active: true,
          slotId: booking.slotId,
          endsAt: new Date(Date.now() + FLASH_MS),
        },
      }),
    ]);
    if (refundCents > 0) {
      await prisma().payment.updateMany({
        where: { bookingId, status: "PAID" },
        data: { status: "REFUNDED" },
      });
      await prisma().booking.update({
        where: { id: bookingId },
        data: { refundStatus: "REFUNDED" },
      });
    }
    await notifyWaitlist(booking.slotId);
    return (await view(bookingId))!;
  },
  async markRefund(bookingId: string, status: Booking["refundStatus"]) {
    await prisma().booking.update({ where: { id: bookingId }, data: { refundStatus: status } });
    return this.getBooking(bookingId);
  },
  async redeem(token: string) {
    const booking = await prisma().booking.findFirst({
      where: { OR: [{ qrToken: token }, { code: token.toUpperCase() }] },
    });
    if (!booking) return { ok: false as const, reason: "NOT_FOUND" as const };
    if (booking.status === "CHECKED_IN" || booking.redeemedAt) {
      return { ok: false as const, reason: "ALREADY" as const, booking: (await view(booking.id))! };
    }
    if (booking.status !== "CONFIRMED") {
      return { ok: false as const, reason: "INVALID" as const, booking: (await view(booking.id))! };
    }
    await prisma().booking.update({
      where: { id: booking.id },
      data: { status: "CHECKED_IN", redeemedAt: new Date() },
    });
    return { ok: true as const, booking: (await view(booking.id))! };
  },
  async updateBooking(id: string, patch: Partial<Booking> & { slotId?: string }) {
    const b = await prisma().booking.findUnique({ where: { id } });
    if (!b) return null;
    if (patch.slotId && patch.slotId !== b.slotId) {
      const next = await prisma().timeSlot.findUnique({ where: { id: patch.slotId } });
      if (!next || next.status !== "FREE") throw new Error("SLOT_TAKEN");
      await prisma().$transaction([
        prisma().timeSlot.update({ where: { id: b.slotId }, data: { status: "FREE" } }),
        prisma().timeSlot.update({ where: { id: next.id }, data: { status: "RESERVED" } }),
        prisma().booking.update({
          where: { id },
          data: { slotId: next.id, courtId: next.courtId },
        }),
      ]);
    }
    if (patch.status || patch.playerNames || typeof patch.openToJoin === "boolean") {
      await prisma().booking.update({
        where: { id },
        data: {
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.playerNames ? { playerNames: patch.playerNames } : {}),
          ...(typeof patch.openToJoin === "boolean" ? { openToJoin: patch.openToJoin } : {}),
        },
      });
    }
    if (patch.status === "NO_SHOW") {
      const current = await prisma().booking.findUnique({ where: { id } });
      if (current) {
        await prisma().timeSlot.update({
          where: { id: current.slotId },
          data: { status: "FREE" },
        });
        await notifyWaitlist(current.slotId);
      }
    }
    return view(id);
  },
  async setSlotStatus(id: string, status: SlotStatus) {
    const row = await prisma().timeSlot.update({ where: { id }, data: { status } });
    return asSlot(row);
  },
  async expireHolds() {
    const now = new Date();
    const expired = await prisma().timeSlot.findMany({
      where: { status: "HOLDING", holdExpiresAt: { lte: now } },
    });
    for (const slot of expired) {
      await prisma().booking.updateMany({
        where: { slotId: slot.id, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED" },
      });
      await prisma().timeSlot.update({
        where: { id: slot.id },
        data: { status: "FREE", holdExpiresAt: null },
      });
      await notifyWaitlist(slot.id);
    }
    await expireFlash();
  },
  async takeWaitlistNotices(): Promise<WaitlistNotice[]> {
    const rows = await prisma().waitlistEntry.findMany({
      where: { notifiedAt: { not: null }, emailedAt: null },
      include: { user: true, slot: { include: { court: true } } },
    });
    const notices: WaitlistNotice[] = [];
    for (const row of rows) {
      const flash = await prisma().promotion.findFirst({
        where: { kind: "FLASH", slotId: row.slotId, active: true },
      });
      notices.push({
        userId: row.userId,
        email: row.user.email,
        name: row.user.name,
        slotId: row.slotId,
        courtName: row.slot.court.name,
        start: row.slot.start,
        flashPercent: flash?.percentOff ?? null,
      });
      await prisma().waitlistEntry.update({
        where: { id: row.id },
        data: { emailedAt: new Date() },
      });
    }
    return notices;
  },
  async joinWaitlist(slotId: string, userId: string) {
    const slot = await prisma().timeSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new Error("SLOT_MISSING");
    if (slot.status === "FREE") throw new Error("FREE");
    const existing = await prisma().waitlistEntry.findFirst({
      where: { slotId, userId, notifiedAt: null },
    });
    if (existing) {
      return {
        id: existing.id,
        slotId: existing.slotId,
        userId: existing.userId,
        createdAt: existing.createdAt,
        notifiedAt: existing.notifiedAt,
        emailedAt: existing.emailedAt,
      } satisfies WaitlistEntry;
    }
    // A previously notified entry still occupies the (slotId, userId) key, so re-arm it instead of inserting.
    const row = await prisma().waitlistEntry.upsert({
      where: { slotId_userId: { slotId, userId } },
      create: { slotId, userId },
      update: { notifiedAt: null, emailedAt: null, createdAt: new Date() },
    });
    return {
      id: row.id,
      slotId: row.slotId,
      userId: row.userId,
      createdAt: row.createdAt,
      notifiedAt: row.notifiedAt,
      emailedAt: row.emailedAt,
    } satisfies WaitlistEntry;
  },
  async leaveWaitlist(slotId: string, userId: string) {
    await prisma().waitlistEntry.deleteMany({
      where: { slotId, userId, notifiedAt: null },
    });
  },
  async waitlistForUser(userId: string) {
    const rows = await prisma().waitlistEntry.findMany({
      where: { userId },
      include: { slot: { include: { court: true } } },
      orderBy: { createdAt: "desc" },
    });
    const promos = await livePromos();
    return Promise.all(
      rows.map(async (w) => ({
        id: w.id,
        slotId: w.slotId,
        userId: w.userId,
        createdAt: w.createdAt,
        notifiedAt: w.notifiedAt,
        emailedAt: w.emailedAt,
        slot: await toSlotView(asSlot(w.slot), asCourt(w.slot.court), promos),
        court: asCourt(w.slot.court),
      })),
    );
  },
  async waitlistedSlotIds(userId: string) {
    const rows = await prisma().waitlistEntry.findMany({
      where: { userId, notifiedAt: null },
      select: { slotId: true },
    });
    return rows.map((w) => w.slotId);
  },
  async friendsOf(userId: string) {
    const rows = await prisma().friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ fromId: userId }, { toId: userId }] },
      include: { from: true, to: true },
    });
    return rows.map((f) => strip(asProfile(f.fromId === userId ? f.to : f.from)));
  },
  async friendRequests(userId: string) {
    const incoming = await prisma().friendship.findMany({
      where: { toId: userId, status: "PENDING" },
      include: { from: true },
    });
    const outgoing = await prisma().friendship.findMany({
      where: { fromId: userId, status: "PENDING" },
      include: { to: true },
    });
    return {
      incoming: incoming.map((f) => ({
        id: f.id,
        fromId: f.fromId,
        toId: f.toId,
        status: f.status as Friendship["status"],
        user: strip(asProfile(f.from)),
      })),
      outgoing: outgoing.map((f) => ({
        id: f.id,
        fromId: f.fromId,
        toId: f.toId,
        status: f.status as Friendship["status"],
        user: strip(asProfile(f.to)),
      })),
    };
  },
  async requestFriend(fromId: string, email: string) {
    const to = await prisma().profile.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (!to) throw new Error("NOT_FOUND");
    if (to.id === fromId) throw new Error("SELF");
    const existing = await prisma().friendship.findFirst({
      where: {
        OR: [
          { fromId, toId: to.id },
          { fromId: to.id, toId: fromId },
        ],
      },
    });
    if (existing) return { id: existing.id, fromId: existing.fromId, toId: existing.toId, status: existing.status };
    const row = await prisma().friendship.create({ data: { fromId, toId: to.id, status: "PENDING" } });
    return { id: row.id, fromId: row.fromId, toId: row.toId, status: row.status };
  },
  async answerFriend(id: string, userId: string, accept: boolean) {
    const f = await prisma().friendship.findFirst({ where: { id, toId: userId } });
    if (!f) return null;
    if (!accept) {
      await prisma().friendship.delete({ where: { id } });
      return f;
    }
    const row = await prisma().friendship.update({ where: { id }, data: { status: "ACCEPTED" } });
    return { id: row.id, fromId: row.fromId, toId: row.toId, status: row.status };
  },
  async openGames() {
    const rows = await prisma().booking.findMany({
      where: { status: "CONFIRMED", openToJoin: true },
      orderBy: { createdAt: "desc" },
    });
    const list = await Promise.all(rows.map((b) => view(b.id)));
    return (list.filter(Boolean) as BookingView[]).filter((b) => b.playerNames.filter(Boolean).length < 4);
  },
  async requestJoin(bookingId: string, userId: string) {
    const booking = await prisma().booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.openToJoin || booking.status !== "CONFIRMED") throw new Error("CLOSED");
    if (booking.userId === userId) throw new Error("SELF");
    if (booking.playerNames.filter(Boolean).length >= 4) throw new Error("FULL");
    const existing = await prisma().joinRequest.findFirst({ where: { bookingId, userId } });
    if (existing) {
      return {
        id: existing.id,
        bookingId: existing.bookingId,
        userId: existing.userId,
        status: existing.status,
        createdAt: existing.createdAt,
      } satisfies JoinRequest;
    }
    const row = await prisma().joinRequest.create({ data: { bookingId, userId, status: "PENDING" } });
    return {
      id: row.id,
      bookingId: row.bookingId,
      userId: row.userId,
      status: row.status,
      createdAt: row.createdAt,
    } satisfies JoinRequest;
  },
  async joinRequestsForHost(userId: string) {
    const rows = await prisma().joinRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true, booking: true },
    });
    const out = [];
    for (const j of rows) {
      if (j.booking.userId !== userId) continue;
      const booking = await view(j.bookingId);
      if (!booking) continue;
      out.push({
        id: j.id,
        bookingId: j.bookingId,
        userId: j.userId,
        status: j.status,
        createdAt: j.createdAt,
        booking,
        user: strip(asProfile(j.user)),
      });
    }
    return out;
  },
  async answerJoin(id: string, hostId: string, accept: boolean) {
    const req = await prisma().joinRequest.findUnique({
      where: { id },
      include: { booking: true, user: true },
    });
    if (!req) return null;
    if (req.booking.userId !== hostId) throw new Error("FORBIDDEN");
    await prisma().joinRequest.update({
      where: { id },
      data: { status: accept ? "ACCEPTED" : "DECLINED" },
    });
    if (accept) {
      const names = [...req.booking.playerNames];
      while (names.length < 4) names.push("");
      const empty = names.findIndex((n, i) => i > 0 && !n);
      if (empty === -1 && names.filter(Boolean).length >= 4) throw new Error("FULL");
      if (empty >= 0) names[empty] = req.user.name;
      else names.push(req.user.name);
      await prisma().booking.update({
        where: { id: req.bookingId },
        data: { playerNames: names.filter((_, i) => i < 4) },
      });
    }
    return {
      id: req.id,
      bookingId: req.bookingId,
      userId: req.userId,
      status: accept ? "ACCEPTED" : "DECLINED",
      createdAt: req.createdAt,
    } satisfies JoinRequest;
  },
  async listPromotions() {
    return livePromos();
  },
  async setMorningPromo(active: boolean, percentOff?: number) {
    const existing = await prisma().promotion.findFirst({ where: { kind: "MORNING" } });
    if (!existing) {
      const row = await prisma().promotion.create({
        data: {
          id: "promo-morning",
          kind: "MORNING",
          percentOff: percentOff ?? 30,
          active,
          hourStart: 8,
          hourEnd: 12,
        },
      });
      return asPromo(row);
    }
    const row = await prisma().promotion.update({
      where: { id: existing.id },
      data: { active, ...(percentOff ? { percentOff } : {}) },
    });
    return asPromo(row);
  },
  async statsToday() {
    const { start, end } = dayBounds(new Date());
    const todays = await prisma().booking.findMany({
      where: { slot: { start: { gte: start, lt: end } } },
    });
    const active = todays.filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN");
    const revenue = active.reduce((s, b) => s + b.depositCents, 0);
    const noShows = todays.filter((b) => b.status === "NO_SHOW").length;
    const daySlots = await prisma().timeSlot.findMany({ where: { start: { gte: start, lt: end } } });
    const reserved = daySlots.filter((s) => s.status === "RESERVED").length;
    const occupancy = daySlots.length ? Math.round((reserved / daySlots.length) * 100) : 0;
    return { bookings: active.length, revenue, occupancy, noShows };
  },
};
