import { z } from "zod";

/** Indian mobile number: optional +91, then a 10-digit number starting 6-9. */
export const phoneRegex = /^(\+91)?[6-9]\d{9}$/;

/**
 * The one phone rule for the whole API.
 *
 * Every form in the portal that takes a phone number shows (or suggests) the
 * readable spaced format "+91 98765 43210", so whitespace is stripped before
 * the shape is checked. This lives here rather than being redeclared per
 * schema because the three copies had drifted: the profile endpoint stripped
 * whitespace while signup and add-member did not, so the exact string the UI
 * suggests was accepted on one screen of the registration dossier and
 * rejected on another.
 */
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, ""))
  .pipe(z.string().regex(phoneRegex, "Invalid Indian mobile number"));
