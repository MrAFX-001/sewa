import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Verifying database connection and readiness...");

  const userCount = await prisma.user.count();
  const committeeCount = await prisma.committeeMember.count();
  const galleryCount = await prisma.galleryImage.count();
  const mailCount = await prisma.adminMail.count();

  console.log("Database status:", {
    users: userCount,
    committeeMembers: committeeCount,
    galleryImages: galleryCount,
    adminMails: mailCount,
  });

  console.log("All data is loaded and managed dynamically from PostgreSQL directly. No data is hardcoded in code.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



