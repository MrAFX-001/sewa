import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { generateOtp } from "../utils/otp.js";
import { hashOtp, verifyOtp } from "../utils/hash.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { AppError } from "../middleware/errorHandler.js";
import { Prisma, type OtpPurpose } from "@prisma/client";

/**
 * Issues a new OTP for the given user, enforcing the resend cooldown
 * server-side (the frontend timer is UX only - this is the real check).
 * Invalidates any prior unconsumed OTP of the same purpose.
 */
export async function issueOtp(
  userId: string,
  email: string,
  purpose: OtpPurpose,
): Promise<void> {
  const MAX_RETRIES = 3;

  let code = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      code = generateOtp();
      const codeHash = await hashOtp(code);
      const expiresAt = new Date(
        Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000,
      );
      const cooldownStart = new Date(
        Date.now() - env.OTP_RESEND_COOLDOWN_SECONDS * 1000,
      );

      await prisma.$transaction(
        async (tx) => {
          const recent = await tx.otpVerification.findFirst({
            where: {
              userId,
              purpose,
              createdAt: { gt: cooldownStart },
            },
            orderBy: { createdAt: "desc" },
          });

          if (recent) {
            throw new AppError(
              429,
              "Please wait before requesting another code.",
            );
          }

          await tx.otpVerification.updateMany({
            where: {
              userId,
              purpose,
              consumedAt: null,
            },
            data: {
              consumedAt: new Date(),
            },
          });

          await tx.otpVerification.create({
            data: {
              userId,
              purpose,
              codeHash,
              expiresAt,
              maxAttempts: env.OTP_MAX_ATTEMPTS,
            },
          });
        },
        {
          isolationLevel: "Serializable",
        },
      );

      break;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2034" &&
        attempt < MAX_RETRIES
      ) {
        continue;
      }

      throw err;
    }
  }

  await sendOtpEmail(email, code, purpose);
}

/**
 * Verifies a submitted OTP code. Increments the attempt counter on every
 * call (success or failure) so a code can't be brute-forced indefinitely,
 * and consumes the code on success so it can't be replayed.
 */
export async function consumeOtp(
  userId: string,
  purpose: OtpPurpose,
  code: string,
): Promise<boolean> {
  const otp = await prisma.otpVerification.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    throw new AppError(400, "No active verification code. Please request a new one.");
  }

  if (otp.expiresAt < new Date()) {
    throw new AppError(400, "Code has expired. Please request a new one.");
  }

  const isValid = await verifyOtp(code, otp.codeHash);

  if (isValid) {
    const consumed = await prisma.otpVerification.updateMany({
      where: {
        id: otp.id,
        consumedAt: null,
        attempts: { lt: otp.maxAttempts },
      },
      data: {
        attempts: { increment: 1 },
        consumedAt: new Date(),
      },
    });

    if (consumed.count !== 1) {
      throw new AppError(429, "Too many incorrect attempts. Please request a new code.");
    }

    return true;
  }

  const attempted = await prisma.otpVerification.updateMany({
    where: {
      id: otp.id,
      consumedAt: null,
      attempts: { lt: otp.maxAttempts },
    },
    data: {
      attempts: { increment: 1 },
    },
  });

  if (attempted.count !== 1) {
    throw new AppError(429, "Too many incorrect attempts. Please request a new code.");
  }

  return false;
}



