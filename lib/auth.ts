import { cookies } from "next/headers";
import { db } from "./db";
import { createServerSupabase } from "./supabase/server";
import type { Profile } from "./types";

const COOKIE = "yp_session";

export async function getSession(): Promise<Profile | null> {
  try {
    const supabase = await createServerSupabase();
    if (supabase && process.env.DEMO_MODE !== "true") {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const profile = (await db.getProfile(data.user.id)) ?? (await db.findByEmail(data.user.email ?? ""));
        if (profile) return profile;
        return {
          id: data.user.id,
          email: data.user.email ?? "",
          name: data.user.user_metadata?.name ?? "Player",
          phone: data.user.phone ?? "+201000000000",
          role: "PLAYER",
          createdAt: new Date(),
          points: 0,
          referralCode: "",
          referredById: null,
        };
      }
    }
  } catch {
    /* cookie session below */
  }

  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  try {
    return await db.getProfile(id);
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSession();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function setDemoSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
}
