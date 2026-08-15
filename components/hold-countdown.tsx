"use client";

import { useEffect, useState } from "react";

export function HoldCountdown({ expiresAt }: { expiresAt: string | Date }) {
  const end = new Date(expiresAt).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, end - now);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return (
    <div className="text-center">
      <p className="label">Minutes to complete</p>
      <p className="mt-3 font-mono text-7xl font-medium tracking-tight text-lime sm:text-8xl">{label}</p>
    </div>
  );
}
