import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  db.expireHolds();
  return NextResponse.json({ ok: true });
}

export async function POST() {
  db.expireHolds();
  return NextResponse.json({ ok: true });
}
