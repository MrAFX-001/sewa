/**
 * Problem-statement category catalogue - the registration form's picker and
 * the backend's validation (backend/src/config/problemCategories.ts) must
 * agree on exactly this list, since the form sends `problemCategoryCode`
 * and the backend rejects anything it doesn't recognise.
 *
 * IMPORTANT: kept in sync BY HAND with two other copies of this same list:
 *   - backend/src/config/problemCategories.ts (validates every submission)
 *   - components/ProblemStatementsPage.tsx (the public-facing PS listing)
 * All three are small, static, per-season data - promote to a single
 * shared source (e.g. fetched from the backend at build/runtime) if that
 * stops being true.
 */

export type ProblemTheme = "NATIONAL" | "REGIONAL";

export interface ProblemCategory {
  /** e.g. "NAT-001" or "REG-004". */
  code: string;
  theme: ProblemTheme;
  label: string;
  /** Only NATIONAL categories have one - REGIONAL is always "propose your own". */
  psTitle?: string;
}

export const PROBLEM_CATEGORIES: ProblemCategory[] = [
  // ── National Level ──────────────────────────────────────────────────
  { code: "NAT-001", theme: "NATIONAL", label: "Defence, Intelligence, Space & National Security", psTitle: "PS1 TITLE" },
  { code: "NAT-002", theme: "NATIONAL", label: "Disaster Management & Resilience", psTitle: "PS2 TITLE" },
  { code: "NAT-003", theme: "NATIONAL", label: "Manufacturing & Electronics, AI, Robotics & Autonomous Systems", psTitle: "PS3 TITLE" },
  { code: "NAT-004", theme: "NATIONAL", label: "Energy & Sustainable Technology & Environment", psTitle: "PS4 TITLE" },
  { code: "NAT-005", theme: "NATIONAL", label: "Advanced Engineering, Infrastructure, Future Mobility & Transportation", psTitle: "PS5 TITLE" },

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

export function findProblemCategory(code: string): ProblemCategory | undefined {
  return BY_CODE.get(code);
}

export function themeLabel(theme: ProblemTheme): string {
  return theme === "NATIONAL" ? "National Level Innovation" : "Local Community Level Innovation";
}

/** ID card constraints, mirrored from backend/src/middleware/upload.middleware.ts
 *  so the form can reject an obviously-bad file before ever hitting the network. */
export const ID_CARD_ACCEPT = ".pdf,.jpg,.jpeg,.png";
export const ID_CARD_ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);
export const ID_CARD_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
