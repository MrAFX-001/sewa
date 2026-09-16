/**
 * Single entry point for every call to the SEWA backend.
 *
 * Two things every request here depends on:
 *  - `credentials: "include"` - the session is an httpOnly cookie, so it is
 *    never readable from JS and must be sent explicitly on a cross-origin
 *    request. Omitting it silently produces a 401 on every authed call.
 *  - The backend's CORS is locked to a single `CLIENT_ORIGIN` with
 *    credentials enabled, so `VITE_API_URL` and the backend's
 *    `CLIENT_ORIGIN` must agree about the pair of origins in play.
 */

const API_URL = (import.meta.env["VITE_API_URL"] ?? "http://localhost:4000").replace(/\/$/, "");

/** A non-2xx response. `details` carries Zod's per-field errors when present. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** First field-level message, if the backend sent one - handy for forms. */
  get firstFieldError(): string | undefined {
    if (!this.details) return undefined;
    for (const messages of Object.values(this.details)) {
      if (messages?.length) return messages[0];
    }
    return undefined;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        // FormData bodies (team registration's ID card upload) must NOT get
        // an explicit Content-Type: the browser sets one itself, including
        // the multipart boundary, and setting it manually breaks parsing on
        // the server. JSON bodies still get it as before.
        ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    // fetch only rejects on network/CORS failure, never on HTTP status.
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error ?? "Something went wrong. Please try again.",
      body?.details,
    );
  }

  return body as T;
}

// `body` is omitted entirely rather than passed as `undefined`: under
// `exactOptionalPropertyTypes`, RequestInit.body is `BodyInit | null` and
// will not accept an explicit `undefined`.
const post = <T>(path: string, body?: unknown) =>
  request<T>(
    path,
    body === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(body) },
  );

/**
 * Builds the multipart/form-data body team create/update need: every field
 * as a string, plus the ID card file under the "idCard" key that the
 * backend's multer middleware expects (see backend upload.middleware.ts).
 * The file is optional here because it's optional on update - required-ness
 * is enforced server-side (and, separately, in the registration form's own
 * client-side validation before it ever calls this).
 */
function buildTeamFormData(
  fields: Record<string, string | undefined>,
  idCard: File | undefined,
): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(key, value);
  }
  if (idCard) form.append("idCard", idCard);
  return form;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  emailVerified?: boolean;
}

export type TeamStatus = "draft" | "submitted" | "under_review" | "shortlisted" | "rejected";

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: "leader" | "member";
}

export interface Team {
  id: string;
  name: string;
  institute: string;
  institutionAddress: string;
  /** Human-readable theme label, server-derived from problemCategoryCode. */
  theme: string;
  /** Server-derived: the official PS title, or the team's own proposed text. */
  problemStatement: string;
  problemCategoryCode: string;
  problemOptionType: "ps" | "open";
  proposedProblemStatement: string | null;
  /** e.g. "NAT-001-PS" or "NAT-001-OP-003" - see backend problemStatement.service.ts. */
  problemStatementId: string;
  idCardOriginalName: string | null;
  status: TeamStatus;
  submittedAt: string | null;
  members?: TeamMember[];
}

// ─── Candidate profile ("Personal Details" step) ───────────────────────────

export interface CandidateProfile {
  middleName?: string | null;
  category?: string | null;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  aadhaarNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  alternatePhone?: string | null;
  backupEmail?: string | null;
}

// Separate from CandidateProfile (the read shape, where the backend sends
// `null` for an absent optional field) - a PUT omits absent optional fields
// entirely, so those are typed `| undefined` here.
export interface UpsertProfileInput {
  firstName: string;
  middleName?: string | undefined;
  lastName: string;
  category?: string | undefined;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  aadhaarNumber: string;
  addressLine1: string;
  addressLine2?: string | undefined;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  alternatePhone?: string | undefined;
  backupEmail?: string | undefined;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const authApi = {
  signup: (input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | undefined;
    password: string;
  }) => post<{ message: string; email: string }>("/api/auth/signup", input),

  /** Resend the email-verification OTP. Always 200, even for unknown emails. */
  resendOtp: (email: string) => post<{ message: string }>("/api/auth/otp/send", { email }),

  /** On success the backend sets the session cookie - the user is signed in. */
  verifyOtp: (email: string, code: string, password: string) =>
    post<{ message: string; user: User }>("/api/auth/otp/verify", {
      email,
      code,
      password,
    }),

  signin: (email: string, password: string) =>
    post<{ user: User }>("/api/auth/signin", { email, password }),

  signout: () => post<{ message: string }>("/api/auth/signout"),

  me: () => request<{ user: User | null }>("/api/auth/me"),

  forgotPassword: (email: string) =>
    post<{ message: string }>("/api/auth/password/forgot", { email }),

  resetPassword: (input: { email: string; code: string; password: string }) =>
    post<{ message: string }>("/api/auth/password/reset", input),
};

// ─── Team registration ──────────────────────────────────────────────────────

/**
 * Fields the backend actually accepts for team create/update, since the
 * schema migration in team.schema.ts: theme and problemStatement are no
 * longer sent directly - the server derives both from category + option
 * type (see backend/src/services/problemStatement.service.ts). Sending the
 * old `theme`/`problemStatement` shape here would 400 with "Unrecognized
 * key(s)" against the backend's `.strict()` schema.
 */
export interface TeamProblemSelectionInput {
  name: string;
  institute: string;
  institutionAddress: string;
  problemCategoryCode: string;
  problemOptionType: "ps" | "open";
  /** Required by the backend when problemOptionType is "open"; omit for "ps". */
  proposedProblemStatement?: string;
}

export const teamApi = {
  /** idCard is required on create - the backend 400s without one. */
  create: (input: TeamProblemSelectionInput, idCard: File) =>
    request<{ team: Team }>("/api/register", {
      method: "POST",
      body: buildTeamFormData({ ...input }, idCard),
    }),

  /** Returns `{ team: null }` when the signed-in user hasn't created one. */
  getMine: () => request<{ team: Team | null }>("/api/register/me"),

  /**
   * Draft-only - 409s once the team has been submitted. idCard is optional:
   * omit it to leave the previously uploaded card as-is.
   */
  update: (teamId: string, input: TeamProblemSelectionInput, idCard?: File) =>
    request<{ team: Team }>(`/api/register/${teamId}`, {
      method: "PATCH",
      body: buildTeamFormData({ ...input }, idCard),
    }),

  addMember: (
    teamId: string,
    input: { firstName: string; lastName: string; email: string; phone?: string | undefined },
  ) => post<{ member: TeamMember }>(`/api/register/${teamId}/members`, input),

  removeMember: (teamId: string, memberId: string) =>
    request<void>(`/api/register/${teamId}/members/${memberId}`, { method: "DELETE" }),

  submit: (teamId: string) => post<{ team: Team }>(`/api/register/${teamId}/submit`),
};

// ─── Candidate profile ──────────────────────────────────────────────────────

export const profileApi = {
  /** `profile` is null until the applicant has saved Step 1 at least once. */
  getMine: () => request<{ user: User; profile: CandidateProfile | null }>("/api/profile"),

  upsert: (input: UpsertProfileInput) =>
    request<{ profile: CandidateProfile }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
};

// ─── Contact Us / Grievance form ─────────────────────────────────────────────

// Keep in sync with backend/src/schemas/contact.schema.ts's CONTACT_CATEGORIES.
export const CONTACT_CATEGORIES = [
  "General Enquiry",
  "Technical Support",
  "Registration & Eligibility",
  "Problem Statement / Track Query",
  "Grievance / Appeal",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export interface ContactMessageInput {
  category: ContactCategory;
  fullName: string;
  teamOrAffiliationId?: string | undefined;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export const contactApi = {
  submit: (input: ContactMessageInput) =>
    post<{ message: string }>("/api/contact", input),
};

// ─── Announcements ───────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  refNumber?: string | null;
  category: string;
  title: string;
  summary: string;
  detail?: string | null;
  publishedAt: string;
}

export const announcementsApi = {
  list: () => request<Announcement[]>("/api/announcements"),
};

