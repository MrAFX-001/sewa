import "dotenv/config";
import { z } from "zod";

// Fail fast: an invalid/missing env var should crash startup, not surface
// as a mysterious runtime bug in a government-facing service.
const boolFromEnv = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url(),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_NAME: z.string().default("sewa_session"),

  OTP_LENGTH: z.coerce.number().int().min(4).max(10).default(6),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  OTP_CLEANUP_RETENTION_MINUTES: z.coerce.number().int().positive().default(20),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),

  UPLOAD_DIR: z.string().default("uploads/id-cards"),

  // Bind address. 127.0.0.1 in production so only Nginx can reach the API.
  HOST: z.string().default("0.0.0.0"),

  // --- multi-instance deployment ---
  // Shared rate-limit store. Unset = in-memory (fine for local dev only).
  REDIS_URL: z.string().url().optional(),
  // Proxies in front of the app that set X-Forwarded-For. On the VM only
  // Nginx does (Cloudflare IP is resolved by Nginx real_ip), so this is 1.
  // Wrong value => req.ip is wrong => rate limits key on the proxy's IP.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  // Only ONE replica should run the OTP cleanup cron.
  ENABLE_IN_PROCESS_CRON: boolFromEnv.default("true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
