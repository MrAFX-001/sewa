import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import bcrypt from "bcrypt";

export async function bootstrapDatabaseIfEmpty() {
  try {
    const committeeCount = await prisma.committeeMember.count().catch(() => -1);
    if (committeeCount === 0) {
      logger.info("Fresh database detected. Auto-seeding initial resources...");
      
      // Seed Super Admin User if none exists
      const adminEmail = "superadmin@dtu.ac.in";
      const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } }).catch(() => null);
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash("Admin@123456", 10);
        await prisma.user.create({
          data: {
            email: adminEmail,
            passwordHash,
            firstName: "Super",
            lastName: "Admin",
            phone: "9999999999",
            emailVerified: true,
            role: "SUPER_ADMIN",
            status: "active",
          }
        }).catch(() => {});
      }
    }
  } catch (err: any) {
    logger.warn({ err }, "Database bootstrap check skipped");
  }
}



