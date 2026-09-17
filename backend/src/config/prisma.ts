import { PrismaClient } from "@prisma/client";
import { isProd } from "./env.js";

// Avoid instantiating multiple PrismaClients on hot-reload in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ["error", "warn"] : ["error", "warn", "query"],
  });

if (!isProd) globalForPrisma.prisma = prisma;
