import { z } from "zod";
import { phoneSchema } from "./phone.js";

// Kept as free text validated against a fixed list, not a DB enum \u2014 same
// rationale as team.schema's theme/problemStatement: categories here are
// expected to be tuned before/between events and a DB enum would need a
// migration each time.
export const CONTACT_CATEGORIES = [
  "General Enquiry",
  "Technical Support",
  "Registration & Eligibility",
  "Problem Statement / Track Query",
  "Grievance / Appeal",
] as const;

export const createContactMessageSchema = z
  .object({
    category: z.enum(CONTACT_CATEGORIES, {
      errorMap: () => ({ message: "Please select a valid query category" }),
    }),
    fullName: z.string().trim().min(1).max(200),
    // Optional free text: a team UUID or a college roll number, neither
    // checked against the teams table \u2014 see schema.prisma's note on
    // ContactMessage for why this form intentionally doesn't require login.
    teamOrAffiliationId: z.string().trim().max(100).optional(),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: phoneSchema,
    subject: z.string().trim().min(3).max(200),
    message: z.string().trim().min(10).max(5000),
  })
  .strict();

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
