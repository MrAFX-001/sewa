/**
 * Problem-statement category catalogue.
 *
 * This is the source of truth the backend validates every team's category
 * and problem-statement choice against - see schemas/team.schema.ts and
 * services/problemStatement.service.ts.
 *
 * IMPORTANT: this must be kept in sync by hand with the frontend's own copy
 * of this list (frontend/src/components/ProblemStatementsPage.tsx —
 * NATIONAL_CATEGORY_LIST and COMMUNITY_CATEGORY_LIST). It is intentionally
 * NOT a database table: the categories are a small, static, per-season list
 * that changes at most once between challenge cycles, not per-request data.
 * If that stops being true - categories become admin-editable, change
 * mid-season, or need to be queried/reported on independently - promote
 * this to a real seeded table instead of hand-syncing two files.
 */

export type ProblemTheme = "NATIONAL" | "REGIONAL";

export interface ProblemCategoryDef {
  /** e.g. "NAT-001" or "REG-004". Matches the frontend's `code`/`idNumber` prefix. */
  code: string;
  theme: ProblemTheme;
  label: string;
  /**
   * Only NATIONAL categories have an official supplied problem statement.
   * REGIONAL categories are open-only - every regional team proposes and
   * solves its own problem, so there is nothing to put here.
   */
  psTitle?: string;
  psUrl?: string;
  psId?: string;
  openId?: string;
}

export const PROBLEM_CATEGORIES: ProblemCategoryDef[] = [
  // ── National Level ──────────────────────────────────────────────────
  {
    code: "NAT-001",
    theme: "NATIONAL",
    label: "Defence, Intelligence, Space & National Security",
    psTitle: "PS1 TITLE",
  },
  {
    code: "NAT-002",
    theme: "NATIONAL",
    label: "Disaster Management & Resilience",
    psTitle: "PS2 TITLE",
  },
  {
    code: "NAT-003",
    theme: "NATIONAL",
    label: "Manufacturing & Electronics, AI, Robotics & Autonomous Systems",
    psTitle: "PS3 TITLE",
  },
  {
    code: "NAT-004",
    theme: "NATIONAL",
    label: "Energy & Sustainable Technology & Environment",
    psTitle: "PS4 TITLE",
  },
  {
    code: "NAT-005",
    theme: "NATIONAL",
    label: "Advanced Engineering, Infrastructure, Future Mobility & Transportation",
    psTitle: "PS5 TITLE",
  },

  // ── Regional / Local Community Level ─────────────────────────────────
  { code: "REG-001", theme: "REGIONAL", label: "Village & Panchayat Development, Agriculture & Rural Economy" },
  { code: "REG-002", theme: "REGIONAL", label: "Education & Skill Development" },
  { code: "REG-003", theme: "REGIONAL", label: "Healthcare & Community Well-being" },
  { code: "REG-004", theme: "REGIONAL", label: "City & Urban Problems" },
  { code: "REG-005", theme: "REGIONAL", label: "Environment & Natural Resources" },
  { code: "REG-006", theme: "REGIONAL", label: "Sports (Khelo India)" },
  { code: "REG-007", theme: "REGIONAL", label: "Employment & Livelihood" },
  { code: "REG-008", theme: "REGIONAL", label: "Women & Child Safety and Development" },
  { code: "REG-009", theme: "REGIONAL", label: "Safety & Disaster Management" },
  { code: "REG-010", theme: "REGIONAL", label: "Transport, Energy & Tourism" },
  { code: "REG-011", theme: "REGIONAL", label: "Miscellaneous" },
];

const BY_CODE = new Map(PROBLEM_CATEGORIES.map((c) => [c.code, c]));

export function findProblemCategory(code: string): ProblemCategoryDef | undefined {
  return BY_CODE.get(code);
}

/** Human-readable theme label, matching the wording used elsewhere on the site. */
export function themeLabel(theme: ProblemTheme): string {
  return theme === "NATIONAL" ? "National Level Innovation" : "Local Community Level Innovation";
}
