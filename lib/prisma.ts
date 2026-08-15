import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Pooler user is postgres.PROJECT — Prisma/pg otherwise authenticates as plain `postgres`. */
export function prismaDatabaseUrl(raw = process.env.DATABASE_URL) {
  if (!raw?.trim()) return "";
  let url = raw.trim().replace(/^["']|["']$/g, "");
  url = url.replace(
    /^(postgres(?:ql)?:\/\/)postgres\.([^:/]+):/i,
    (_m, proto: string, project: string) => `${proto}postgres%2E${project}:`,
  );
  if (!/[?&]sslmode=/i.test(url)) {
    url += `${url.includes("?") ? "&" : "?"}sslmode=require`;
  }
  return url;
}

/** Session pooler (DIRECT_URL, port 5432). Transaction pooler + pgbouncer drops holds before /book loads. */
export function prismaRuntimeUrl() {
  const raw = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "";
  const url = prismaDatabaseUrl(raw);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    return url.replace(/[?&]pgbouncer=true/gi, "").replace(/\?&/, "?").replace(/[?&]$/, "");
  }
}

export function getPrisma() {
  const url = prismaRuntimeUrl();
  if (!url || process.env.DEMO_MODE === "true") {
    return null;
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: { db: { url } },
    });
  }
  return globalForPrisma.prisma;
}
