import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_THEMES = [
  // ── National Level ──────────────────────────────────────────────────────────
  {
    code: "NAT-001",
    theme: "NATIONAL",
    label: "Defence, Intelligence, Space & National Security",
    psTitle: "PS1 TITLE",
    psId: "NAT-001-PS",
    openId: "NAT-001-OP",
    badgeBg: "#FDE8E8",
    badgeText: "#E03137",
    displayOrder: 1,
    active: true,
  },
  {
    code: "NAT-002",
    theme: "NATIONAL",
    label: "Disaster Management & Resilience",
    psTitle: "PS2 TITLE",
    psId: "NAT-002-PS",
    openId: "NAT-002-OP",
    badgeBg: "#DBEAFE",
    badgeText: "#0284C7",
    displayOrder: 2,
    active: true,
  },
  {
    code: "NAT-003",
    theme: "NATIONAL",
    label: "Manufacturing & Electronics, AI, Robotics & Autonomous Systems",
    psTitle: "PS3 TITLE",
    psId: "NAT-003-PS",
    openId: "NAT-003-OP",
    badgeBg: "#DCFCE7",
    badgeText: "#16A34A",
    displayOrder: 3,
    active: true,
  },
  {
    code: "NAT-004",
    theme: "NATIONAL",
    label: "Energy & Sustainable Technology & Environment",
    psTitle: "PS4 TITLE",
    psId: "NAT-004-PS",
    openId: "NAT-004-OP",
    badgeBg: "#FEF3C7",
    badgeText: "#D97706",
    displayOrder: 4,
    active: true,
  },
  {
    code: "NAT-005",
    theme: "NATIONAL",
    label: "Advanced Engineering, Infrastructure, Future Mobility & Transportation",
    psTitle: "PS5 TITLE",
    psId: "NAT-005-PS",
    openId: "NAT-005-OP",
    badgeBg: "#EDE9FE",
    badgeText: "#7C3AED",
    displayOrder: 5,
    active: true,
  },

  // ── Regional / Local Community Level ─────────────────────────────────────────
  {
    code: "REG-001",
    theme: "REGIONAL",
    label: "Village & Panchayat Development, Agriculture & Rural Economy",
    openId: "REG-001-OP",
    badgeBg: "#FDE8E8",
    badgeText: "#E03137",
    displayOrder: 1,
    active: true,
  },
  {
    code: "REG-002",
    theme: "REGIONAL",
    label: "Education & Skill Development",
    openId: "REG-002-OP",
    badgeBg: "#DBEAFE",
    badgeText: "#0284C7",
    displayOrder: 2,
    active: true,
  },
  {
    code: "REG-003",
    theme: "REGIONAL",
    label: "Healthcare & Community Well-being",
    openId: "REG-003-OP",
    badgeBg: "#DCFCE7",
    badgeText: "#16A34A",
    displayOrder: 3,
    active: true,
  },
  {
    code: "REG-004",
    theme: "REGIONAL",
    label: "City & Urban Problems",
    openId: "REG-004-OP",
    badgeBg: "#FEF3C7",
    badgeText: "#D97706",
    displayOrder: 4,
    active: true,
  },
  {
    code: "REG-005",
    theme: "REGIONAL",
    label: "Environment & Natural Resources",
    openId: "REG-005-OP",
    badgeBg: "#EDE9FE",
    badgeText: "#7C3AED",
    displayOrder: 5,
    active: true,
  },
  {
    code: "REG-006",
    theme: "REGIONAL",
    label: "Sports (Khelo India)",
    openId: "REG-006-OP",
    badgeBg: "#FDE8E8",
    badgeText: "#E03137",
    displayOrder: 6,
    active: true,
  },
  {
    code: "REG-007",
    theme: "REGIONAL",
    label: "Employment & Livelihood",
    openId: "REG-007-OP",
    badgeBg: "#DBEAFE",
    badgeText: "#0284C7",
    displayOrder: 7,
    active: true,
  },
  {
    code: "REG-008",
    theme: "REGIONAL",
    label: "Women & Child Safety and Development",
    openId: "REG-008-OP",
    badgeBg: "#DCFCE7",
    badgeText: "#16A34A",
    displayOrder: 8,
    active: true,
  },
  {
    code: "REG-009",
    theme: "REGIONAL",
    label: "Safety & Disaster Management",
    openId: "REG-009-OP",
    badgeBg: "#FEF3C7",
    badgeText: "#D97706",
    displayOrder: 9,
    active: true,
  },
  {
    code: "REG-010",
    theme: "REGIONAL",
    label: "Transport, Energy & Tourism",
    openId: "REG-010-OP",
    badgeBg: "#EDE9FE",
    badgeText: "#7C3AED",
    displayOrder: 10,
    active: true,
  },
  {
    code: "REG-011",
    theme: "REGIONAL",
    label: "Miscellaneous",
    openId: "REG-011-OP",
    badgeBg: "#FDE8E8",
    badgeText: "#E03137",
    displayOrder: 11,
    active: true,
  },
];

async function main() {
  console.log("Seeding problem categories / themes into PostgreSQL...");

  for (const item of SEED_THEMES) {
    await prisma.problemCategory.upsert({
      where: { code: item.code },
      update: {
        theme: item.theme,
        label: item.label,
        psTitle: item.psTitle || null,
        psId: item.psId || null,
        openId: item.openId || null,
        badgeBg: item.badgeBg,
        badgeText: item.badgeText,
        displayOrder: item.displayOrder,
        active: item.active,
      },
      create: {
        code: item.code,
        theme: item.theme,
        label: item.label,
        psTitle: item.psTitle || null,
        psId: item.psId || null,
        openId: item.openId || null,
        badgeBg: item.badgeBg,
        badgeText: item.badgeText,
        displayOrder: item.displayOrder,
        active: item.active,
      },
    });
  }

  const count = await prisma.problemCategory.count();
  console.log(`Successfully seeded ${count} problem categories!`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
