import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Keep `postgres%2Eproject` encoded. `new URL().toString()` decodes it and Prisma then auths as `postgres`. */
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
  return url.replace(/[?&]pgbouncer=true/gi, "").replace(/\?&/g, "?").replace(/[?&]$/g, "");
}

/** Session pooler (DIRECT_URL, port 5432) for reads/writes. */
export function prismaRuntimeUrl() {
  return prismaDatabaseUrl(process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "");
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
