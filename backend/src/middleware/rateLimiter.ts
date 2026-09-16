import type { Request, RequestHandler } from "express";
import rateLimit, { type Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis.js";
import { logger } from "../config/logger.js";

/**
 * Two layers per endpoint:
 *
 *  1. Per EMAIL (primary): stops brute-forcing / spamming one account.
 *     This is what protects users, and it isn't affected by shared IPs.
 *  2. Per IP (backstop): deliberately generous, because many students share
 *     one public IP (campus Wi-Fi, computer labs, Jio/Airtel carrier NAT).
 *     It only stops one machine flooding the API with many different emails.
 *
 * Why not MAC address: MACs don't survive routing. The server only ever sees
 * the DTU gateway's MAC, so every visitor would share a single bucket.
 *
 * req.ip is the real visitor IP only after Nginx's Cloudflare real_ip config
 * (deploy/nginx/update-cloudflare-realip.sh) is in place.
 *
 * Each export is an array of middleware; Express flattens arrays, so routes
 * keep using them exactly as before, e.g. router.post("/signup", signupLimiter, ...).
 */

const HOUR = 60 * 60 * 1000;
const QUARTER_HOUR = 15 * 60 * 1000;

function normalizedEmail(req: Request): string | null {
  const raw = (req.body as { email?: unknown } | undefined)?.email;
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return email.length > 0 && email.length <= 320 ? email : null;
}

function makeLimiter(name: string, opts: Partial<Options>): RequestHandler {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...opts,
    ...(redis
      ? {
          store: new RedisStore({
            prefix: `rl:${name}:`,
            sendCommand: (...args: string[]) => redis!.sendCommand(args) as Promise<never>,
          }),
          // Redis down => allow requests (and log) rather than take the portal offline.
          passOnStoreError: true,
        }
      : {}),
    handler: (req, res, _next, options) => {
      logger.warn({ limiter: name, ip: req.ip }, "rate_limited");
      res.status(options.statusCode).json(options.message);
    },
  });
}

function ipLimiter(name: string, windowMs: number, max: number, message: string) {
  return makeLimiter(`${name}:ip`, {
    windowMs,
    max,
    message: { error: message },
  });
}

function emailLimiter(name: string, windowMs: number, max: number, message: string) {
  return makeLimiter(`${name}:email`, {
    windowMs,
    max,
    // No/invalid email: nothing to key on. The IP limiter still applies and
    // validateBody rejects the request right after.
    skip: (req) => normalizedEmail(req) === null,
    keyGenerator: (req) => normalizedEmail(req)!,
    message: { error: message },
  });
}

function limit(
  name: string,
  windowMs: number,
  perEmail: number,
  perIp: number,
  message: string,
): RequestHandler[] {
  return [
    ipLimiter(name, windowMs, perIp, message),
    emailLimiter(name, windowMs, perEmail, message),
  ];
}

//                                         window        email  ip
export const signupLimiter = limit("signup", HOUR, 5, 100,
  "Too many signup attempts. Try again later.");

export const otpSendLimiter = limit("otp-send", HOUR, 5, 60,
  "Too many OTP requests. Try again later.");

export const otpVerifyLimiter = limit("otp-verify", QUARTER_HOUR, 10, 150,
  "Too many verification attempts. Try again later.");

export const signinLimiter = limit("signin", QUARTER_HOUR, 10, 150,
  "Too many sign-in attempts. Try again later.");

export const passwordResetRequestLimiter = limit("pw-reset-req", HOUR, 5, 30,
  "Too many password reset requests. Try again later.");

export const passwordResetConfirmLimiter = limit("pw-reset-confirm", QUARTER_HOUR, 10, 150,
  "Too many reset attempts. Try again later.");

export const contactLimiter = limit("contact", HOUR, 3, 20,
  "Too many messages sent. Please try again later.");
