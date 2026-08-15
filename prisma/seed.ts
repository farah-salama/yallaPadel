import { PrismaClient, Role, SlotStatus } from "@prisma/client";

const prisma = new PrismaClient();

function cairoDate(year: number, month: number, day: number, hour = 0, minute = 0) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
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
    const got = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute));
    const want = Date.UTC(year, month - 1, day, hour, minute);
    t += want - got;
  }
  return new Date(t);
}

async function main() {
  await prisma.clubSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", name: "YallaPadel", location: "Sheikh Zayed, Cairo" },
  });

  const mostafaId = process.env.SEED_MOSTAFA_ID || "00000000-0000-0000-0000-000000000001";
  const omarId = process.env.SEED_OMAR_ID || "00000000-0000-0000-0000-000000000002";

  await prisma.profile.upsert({
    where: { email: "mostafa@yallapadel.club" },
    update: { role: Role.ADMIN },
    create: { id: mostafaId, email: "mostafa@yallapadel.club", name: "Mostafa", phone: "+201001112233", role: Role.ADMIN },
  });
  await prisma.profile.upsert({
    where: { email: "omar@yallapadel.club" },
    update: {},
    create: { id: omarId, email: "omar@yallapadel.club", name: "Omar E.", phone: "+201009998877", role: Role.PLAYER },
  });

  const c1 = await prisma.court.upsert({
    where: { slug: "court-01" },
    update: {},
    create: {
      slug: "court-01",
      name: "COURT 01",
      type: "Premium Glass Court",
      location: "Sheikh Zayed, Cairo",
      description: "Panoramic glass, tournament lights.",
      peakPriceCents: 50000,
      offPeakPriceCents: 35000,
    },
  });
  const c2 = await prisma.court.upsert({
    where: { slug: "court-02" },
    update: {},
    create: {
      slug: "court-02",
      name: "COURT 02",
      type: "Night Court",
      location: "Sheikh Zayed, Cairo",
      description: "Fast surface, LED canopy.",
      peakPriceCents: 45000,
      offPeakPriceCents: 30000,
    },
  });

  const now = new Date();
  const cairoNow = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const y = Number(cairoNow.find((p) => p.type === "year")?.value);
  const m = Number(cairoNow.find((p) => p.type === "month")?.value);
  const d = Number(cairoNow.find((p) => p.type === "day")?.value);

  for (const court of [c1, c2]) {
    for (let day = 0; day < 14; day++) {
      const base = cairoDate(y, m, d + day, 0, 0);
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(base);
      const yy = Number(parts.find((p) => p.type === "year")?.value);
      const mm = Number(parts.find((p) => p.type === "month")?.value);
      const dd = Number(parts.find((p) => p.type === "day")?.value);
      for (let h = 7; h < 23; h++) {
        const start = cairoDate(yy, mm, dd, h, 0);
        const end = cairoDate(yy, mm, dd, h + 1, 0);
        await prisma.timeSlot.upsert({
          where: { courtId_start: { courtId: court.id, start } },
          update: {},
          create: { courtId: court.id, start, end, status: SlotStatus.FREE },
        });
      }
    }
  }

  console.log("Seeded YallaPadel courts and 14-day slots.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
