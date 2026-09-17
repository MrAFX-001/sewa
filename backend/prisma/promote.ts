import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const roleArg = (process.argv[3] || "SUPER_ADMIN").toUpperCase() as UserRole;

  if (!email) {
    console.error("Usage: npx tsx prisma/promote.ts <user-email> [SUPER_ADMIN|ADMIN|RESOURCE|MEMBER]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: roleArg },
  });

  console.log(`Successfully updated ${updated.email} to role: ${updated.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
