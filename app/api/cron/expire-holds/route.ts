import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWaitlistEmail } from "@/lib/mail";

async function run() {
  await db.expireHolds();
  const notices = await db.takeWaitlistNotices();
  for (const n of notices) await sendWaitlistEmail(n);
  return NextResponse.json({ ok: true, notified: notices.length });
}

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}
