import { PrismaClient, Role, SlotStatus } from "@prisma/client";
import { addDays, cairoDate, cairoParts, parseHm, startOfCairoDay } from "../lib/utils";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "padel123";

async function main() {
  await prisma.clubSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", name: "YallaPadel", location: "Sheikh Zayed, Cairo" },
  });

  const mostafa = await prisma.profile.upsert({
    where: { email: "mostafa@yallapadel.club" },
    update: { role: Role.ADMIN, password: DEMO_PASSWORD },
    create: {
      id: "user-mostafa",
      email: "mostafa@yallapadel.club",
      name: "Mostafa",
      phone: "+201001112233",
      role: Role.ADMIN,
      password: DEMO_PASSWORD,
      referralCode: "YALLA-MOST",
    },
  });
  const omar = await prisma.profile.upsert({
    where: { email: "omar@yallapadel.club" },
    update: { password: DEMO_PASSWORD },
    create: {
      id: "user-omar",
      email: "omar@yallapadel.club",
      name: "Omar E.",
      phone: "+201009998877",
      role: Role.PLAYER,
      password: DEMO_PASSWORD,
      points: 400,
      referralCode: "YALLA-OMAR",
    },
  });
  const lina = await prisma.profile.upsert({
    where: { email: "lina@yallapadel.club" },
    update: { password: DEMO_PASSWORD },
    create: {
      id: "user-lina",
      email: "lina@yallapadel.club",
      name: "Lina K.",
      phone: "+201005554433",
      role: Role.PLAYER,
      password: DEMO_PASSWORD,
      points: 220,
      referralCode: "YALLA-LINA",
      referredById: omar.id,
    },
  });
  await prisma.profile.upsert({
    where: { email: "nabil@yallapadel.club" },
    update: { password: DEMO_PASSWORD },
    create: {
      id: "user-nabil",
      email: "nabil@yallapadel.club",
      name: "Nabil S.",
      phone: "+201002223344",
      role: Role.PLAYER,
      password: DEMO_PASSWORD,
      points: 80,
      referralCode: "YALLA-NABL",
    },
  });
  await prisma.profile.upsert({
    where: { email: "yasmin@yallapadel.club" },
    update: { password: DEMO_PASSWORD },
    create: {
      id: "user-yasmin",
      email: "yasmin@yallapadel.club",
      name: "Yasmin A.",
      phone: "+201003334455",
      role: Role.PLAYER,
      password: DEMO_PASSWORD,
      points: 50,
      referralCode: "YALLA-YASM",
    },
  });
  void mostafa;
  void lina;

  await prisma.friendship.upsert({
    where: { fromId_toId: { fromId: omar.id, toId: lina.id } },
    update: { status: "ACCEPTED" },
    create: { fromId: omar.id, toId: lina.id, status: "ACCEPTED" },
  });

  await prisma.promotion.upsert({
    where: { id: "promo-morning" },
    update: {},
    create: {
      id: "promo-morning",
      kind: "MORNING",
      percentOff: 30,
      active: false,
      hourStart: 8,
      hourEnd: 12,
    },
  });

  const c1 = await prisma.court.upsert({
    where: { slug: "court-01" },
    update: { imageUrl: "/courts/court-01.jpg" },
    create: {
      id: "court-01",
      slug: "court-01",
      name: "COURT 01",
      type: "Premium Glass Court",
      location: "Sheikh Zayed, Cairo",
      description: "Panoramic glass, tournament lights.",
      imageUrl: "/courts/court-01.jpg",
      peakPriceCents: 50000,
      offPeakPriceCents: 35000,
    },
  });
  const c2 = await prisma.court.upsert({
    where: { slug: "court-02" },
    update: { imageUrl: "/courts/court-02.jpg" },
    create: {
      id: "court-02",
      slug: "court-02",
      name: "COURT 02",
      type: "Night Court",
      location: "Sheikh Zayed, Cairo",
      description: "Fast surface, LED canopy.",
      imageUrl: "/courts/court-02.jpg",
      peakPriceCents: 45000,
      offPeakPriceCents: 30000,
    },
  });

  for (const court of [c1, c2]) {
    for (let d = 0; d < 14; d++) {
      const day = addDays(startOfCairoDay(), d);
      const p = cairoParts(day);
      const open = parseHm(court.openingTime);
      const close = parseHm(court.closingTime);
      const rows = [];
      for (let h = open.h; h < close.h; h++) {
        const start = cairoDate(Number(p.year), Number(p.month), Number(p.day), h, 0);
        const end = cairoDate(Number(p.year), Number(p.month), Number(p.day), h + 1, 0);
        rows.push({
          id: `${court.id}-${p.year}${p.month}${p.day}-${String(h).padStart(2, "0")}`,
          courtId: court.id,
          start,
          end,
          status: SlotStatus.FREE,
        });
      }
      if (rows.length) await prisma.timeSlot.createMany({ data: rows, skipDuplicates: true });
    }
  }

  console.log("Seeded YallaPadel courts, players, and 14-day slots.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
