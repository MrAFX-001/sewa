import { mkdirSync } from "node:fs";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import { redis } from "./config/redis.js";
import { startOtpCleanupJob } from "./services/cleanup.service.js";

import { bootstrapDatabaseIfEmpty } from "./lib/bootstrap.js";

mkdirSync(env.UPLOAD_DIR, { recursive: true });

// Check and seed initial admin user / records if starting with an empty database
void bootstrapDatabaseIfEmpty();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`SEVA 2026 backend listening on ${env.HOST}:${env.PORT} [${env.NODE_ENV}]`);
});

// Longer than Nginx's upstream keepalive_timeout (60s) to avoid sporadic 502s.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

if (env.ENABLE_IN_PROCESS_CRON) startOtpCleanupJob();

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully`);
  setTimeout(() => process.exit(1), 25_000).unref();

  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    await redis?.quit().catch(() => {});
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
