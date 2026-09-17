import bcrypt from "bcrypt";

const PASSWORD_SALT_ROUNDS = 12;
// OTPs are short-lived and low-entropy (6 digits), so a cheaper cost factor
// is fine and keeps verify latency low without weakening real protection
// (rate limiting + attempt caps do the heavy lifting for OTPs).
const OTP_SALT_ROUNDS = 10;

const DUMMY_OTP_HASH = "$2b$10$pDE.eJquMpIY628tEVFRsel6P7MSLaMkBNnXqHEFFTRgG6ehv/EZu"

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PASSWORD_SALT_ROUNDS);
}

export async function verifyOtpAgainstDummy(code: string): Promise<void> {
  await bcrypt.compare(code, DUMMY_OTP_HASH);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, OTP_SALT_ROUNDS);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}



