import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import cron from 'node-cron';

/**
 * Deletes OTPVerification rows that are older than the retention window.
 * Called on a schedule (default: every 5 minutes).
 */
export async function cleanupOldOtps(): Promise<void> {
  const retentionMinutes = Number(env.OTP_CLEANUP_RETENTION_MINUTES ?? 20);
  const cutoff = new Date(Date.now() - retentionMinutes * 60 * 1000);

  const result = await prisma.otpVerification.deleteMany({
    where: {
      OR: [
        // 1️⃣ Expired OTPs (never consumed)
        { expiresAt: { lt: cutoff }, consumedAt: null },
        // 2️⃣ Consumed OTPs (used successfully or exhausted attempts)
        { consumedAt: { lt: cutoff } },
      ],
    },
  });

  if (result.count > 0) {
    logger.info({ deleted: result.count, retentionMinutes }, 'otp_cleanup_deleted');
  }
}

/**
 * Starts the cron job. Call this once when the server boots.
 */
export function startOtpCleanupJob(): void {
  // Runs every 5 minutes; adjust the schedule if you want more/less frequent runs.
  cron.schedule('*/5 * * * *', () => {
    cleanupOldOtps().catch((err) => {
      logger.error({ err }, 'otp_cleanup_failed');
    });
  });

  logger.info('otp_cleanup_scheduled');
}
