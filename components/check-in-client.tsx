"use client";

import { useRef, useState } from "react";
import { redeemAction } from "@/lib/actions";

export function CheckInClient({
  flash,
}: {
  flash?: { kind: "ok" | "already" | "invalid" | "missing"; name?: string; court?: string; time?: string };
}) {
  const [token, setToken] = useState("");
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="mx-auto max-w-md text-center">
      <p className="label">Staff</p>
      <h1 className="mt-3 font-display text-6xl">CHECK IN</h1>
      {flash?.kind === "ok" ? (
        <div className="panel mt-8 border-lime/40 p-8">
          <p className="font-display text-4xl text-lime">✓ VALID BOOKING</p>
          <p className="mt-3 text-xl">{flash.court}</p>
          <p className="text-mute">{flash.name}</p>
          <p className="font-mono">{flash.time}</p>
          <p className="mt-4 text-lime">✓ REDEEMED</p>
          <p className="text-sm text-mute">Booking successfully checked in.</p>
        </div>
      ) : null}
      {flash?.kind === "already" ? (
        <div className="panel mt-8 border-danger/40 p-8">
          <p className="font-display text-4xl text-danger">× ALREADY REDEEMED</p>
        </div>
      ) : null}
      {flash?.kind === "invalid" ? (
        <div className="panel mt-8 border-danger/40 p-8">
          <p className="font-display text-3xl text-danger">× INVALID</p>
        </div>
      ) : null}
      {flash?.kind === "missing" ? (
        <div className="panel mt-8 p-8">
          <p className="text-mute">No booking for that code.</p>
        </div>
      ) : null}
      <form action={redeemAction} className="mt-10 space-y-4">
        <div className="mx-auto flex aspect-square w-56 items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-card">
          <p className="px-6 text-xs uppercase tracking-[0.2em] text-mute">Paste code or QR token</p>
        </div>
        <input
          ref={input}
          name="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="PDL-8X42"
          className="w-full rounded-2xl border border-white/10 bg-card px-4 py-4 text-center font-mono text-xl uppercase outline-none"
        />
        <button className="w-full rounded-full bg-lime py-4 text-sm uppercase tracking-[0.22em] text-bg">Redeem booking</button>
      </form>
    </div>
  );
}
