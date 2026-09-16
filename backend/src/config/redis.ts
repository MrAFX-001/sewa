import { createClient, type RedisClientType } from "redis";
import { env } from "./env.js";
import { logger } from "./logger.js";

export let redis: RedisClientType | null = null;

if (env.REDIS_URL) {
  redis = createClient({
    url: env.REDIS_URL,
    socket: { reconnectStrategy: (retries) => Math.min(retries * 200, 5000) },
  });
  redis.on("error", (err) => logger.error({ err }, "redis_error"));
  // Top-level await (ESM): limiters are built after the connection exists.
  await redis.connect();
  logger.info("redis_connected");
}
