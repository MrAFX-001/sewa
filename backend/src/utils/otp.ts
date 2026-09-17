import { randomInt } from "node:crypto";
import { env } from "../config/env.js";

/**
 * Generates a numeric OTP using a CSPRNG (node:crypto.randomInt), not
 * Math.random(). Length is configurable via OTP_LENGTH (default 6).
 */
export function generateOtp(): string {
  const min = 10 ** (env.OTP_LENGTH - 1);
  const max = 10 ** env.OTP_LENGTH - 1;
  return randomInt(min, max + 1).toString();
}
