import { z } from "zod";
import { findProblemCategory } from "../config/problemCategories.js";
import { phoneSchema } from "./phone.js";

// Adjust MIN/MAX to SEWA 2026's actual team-size rules.
export const TEAM_MIN_MEMBERS = 2; // leader + at least 1 other
export const TEAM_MAX_MEMBERS = 6;

// `theme` and `problemStatement` are no longer accepted directly from the
// client (see problemStatement.service.ts) - the client instead sends its
// category + option-type choice, which the server resolves into both of
// those fields itself. This schema validates that choice is internally
// consistent; problemStatement.service.ts separately re-validates the
// category actually exists, since a schema can't safely import service-only
// concerns and a defense-in-depth check there costs nothing.
//
// Fields arrive as multipart/form-data (there's a file alongside them), so
// this schema treats everything as z.string() and coerces where needed -
// multer places every non-file field into req.body as a string regardless
// of what the client's UI type was.
const baseTeamFields = {
  name: z.string().trim().min(3).max(150),
  institute: z.string().trim().min(2).max(200),
  institutionAddress: z.string().trim().min(5).max(300),
  problemCategoryCode: z.string().trim().min(1).max(20),
  problemOptionType: z.enum(["ps", "open"]),
  // Required only when problemOptionType is "open" - enforced below via
  // superRefine, not by making this itself required, since Zod's object
  // shape can't express "required if sibling field equals X" declaratively.
  proposedProblemStatement: z.string().trim().min(10).max(500).optional(),
};

type ProblemSelectionFields = {
  problemCategoryCode: string;
  problemOptionType: "ps" | "open";
  proposedProblemStatement?: string;
};

function refineProblemSelection<T extends z.AnyZodObject>(
  schema: T,
): z.ZodEffects<T, z.output<T>, z.input<T>> {
  return schema.superRefine((raw, ctx) => {
    const data = raw as ProblemSelectionFields;
    const category = findProblemCategory(data.problemCategoryCode);

    if (!category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["problemCategoryCode"],
        message: "Unknown problem category.",
      });
      return; // Nothing further can be checked without a real category.
    }

    if (data.problemOptionType === "ps" && category.theme === "REGIONAL") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["problemOptionType"],
        message: "This category has no official problem statement - choose the open option.",
      });
    }

    if (data.problemOptionType === "open" && !data.proposedProblemStatement) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proposedProblemStatement"],
        message: "Describe the problem you're proposing to solve.",
      });
    }

    if (data.problemOptionType === "ps" && data.proposedProblemStatement) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proposedProblemStatement"],
        message: "Remove the proposed problem statement, or switch to the open option.",
      });
    }
  });
}

export const createTeamSchema = refineProblemSelection(
  z.object(baseTeamFields).strict(),
);

// Same fields; the ID card file itself is optional on update (only
// re-uploaded if the team wants to replace it) and is handled outside this
// schema entirely - see controllers/team.controller.ts, which reads
// req.file directly rather than through Zod.
export const updateTeamSchema = createTeamSchema;

export const addMemberSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email().max(254, "Email address must be 254 characters or fewer"),
    phone: phoneSchema.optional(),
  })
  .strict();

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;