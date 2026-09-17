import { z } from "zod";
import { findProblemCategory } from "../config/problemCategories.js";
import { phoneSchema } from "./phone.js";

// Team / Organisation use 2-6 roster members. Individual entries use exactly 1.  
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
  participationType: z.enum(["Individual", "Team / Group", "Organisation"]).default("Team / Group"),
  participantCategory: z.enum([
    "School & Vocational",
    "Diploma & Higher Education",
    "Industry & Government",
  ]),
  participationLevel: z.enum(["National Level", "Local Community Level"]),
  institutionType: z.string().trim().max(80).optional(),
  affiliationPinCode: z.string().trim().regex(/^\d{6}$/, "Affiliation PIN code must be exactly 6 digits").optional(),
  affiliationCity: z.string().trim().max(100).optional(),
  affiliationState: z.string().trim().max(100).optional(),
  institutionEmail: z.string().trim().toLowerCase().email().max(255).optional(),
  institutionPhone: phoneSchema.optional(),
  classLevel: z.string().trim().max(50).optional(),
  degreeProgramme: z.string().trim().max(150).optional(),
  departmentBranch: z.string().trim().max(150).optional(),
  yearOfStudy: z.string().trim().max(60).optional(),
  coordinatorName: z.string().trim().max(150).optional(),
  coordinatorEmail: z.string().trim().toLowerCase().email().max(255).optional(),
  coordinatorPhone: phoneSchema.optional(),
  designationRole: z.string().trim().max(150).optional(),
  departmentDivision: z.string().trim().max(150).optional(),
  officialOrgEmail: z.string().trim().toLowerCase().email().max(255).optional(),
  orgContactPhone: phoneSchema.optional(),
  mentorName: z.string().trim().max(150).optional(),
  mentorDesignation: z.string().trim().max(150).optional(),
  mentorEmail: z.string().trim().toLowerCase().email().max(255).optional(),
  mentorPhone: phoneSchema.optional(),
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

type RegistrationDossierFields = {
  participantCategory: "School & Vocational" | "Diploma & Higher Education" | "Industry & Government";
  participationLevel: "National Level" | "Local Community Level";
  institutionType?: string;
  affiliationPinCode?: string;
  affiliationCity?: string;
  affiliationState?: string;
  institutionEmail?: string;
  institutionPhone?: string;
  classLevel?: string;
  degreeProgramme?: string;
  departmentBranch?: string;
  yearOfStudy?: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinatorPhone?: string;
  designationRole?: string;
  departmentDivision?: string;
  officialOrgEmail?: string;
  orgContactPhone?: string;
  mentorName?: string;
  mentorEmail?: string;
  mentorPhone?: string;
};

function refineProblemSelection<T extends z.AnyZodObject>(
  schema: T,
): z.ZodEffects<T, z.output<T>, z.input<T>> {
  return schema.superRefine((raw, ctx) => {
    const data = raw as ProblemSelectionFields & RegistrationDossierFields;

    if (!data.institutionType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["institutionType"], message: "Institution type is required." });
    }
    if (data.participantCategory === "School & Vocational" && !data.affiliationPinCode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["affiliationPinCode"], message: "School PIN / postal code is required." });
    }
    if (!data.affiliationCity) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["affiliationCity"], message: "Institution city or district is required." });
    }
    if (!data.affiliationState) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["affiliationState"], message: "Institution state or UT is required." });
    }

    if (data.participantCategory === "School & Vocational" && !data.classLevel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["classLevel"], message: "Class / level is required for school and vocational participants." });
    }

    if (data.participantCategory === "Diploma & Higher Education") {
      if (!data.degreeProgramme) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["degreeProgramme"], message: "Degree / programme is required." });
      if (!data.departmentBranch) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["departmentBranch"], message: "Department / branch is required." });
      if (!data.yearOfStudy) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["yearOfStudy"], message: "Year of study is required." });
      // The Event Registration handler treats coordinator name, email, and phone
      // as independently optional. Keep that same behavior here; each field is
      // format-validated only when supplied by the participant.
    }

    if (data.participantCategory === "Industry & Government") {
      if (!data.designationRole) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["designationRole"], message: "Applicant designation / role is required." });
      if (!data.officialOrgEmail) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["officialOrgEmail"], message: "Official organization email is required." });
    }

    if (data.mentorName) {
      if (data.mentorEmail === undefined || data.mentorEmail === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mentorEmail"], message: "Mentor email is required when mentor details are provided." });
      }
      if (data.mentorPhone === undefined || data.mentorPhone === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mentorPhone"], message: "Mentor phone is required when mentor details are provided." });
      }
    }

    // Participation type is persisted on the registration record and is used
    // by the client/backend roster flow to distinguish an individual entry
    // from a 2-6 person team or organisation-sponsored team.

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
export type UpdateMemberInput = AddMemberInput;
