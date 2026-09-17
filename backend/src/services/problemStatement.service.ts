import type { Prisma } from "@prisma/client";
import { findProblemCategory, themeLabel, type ProblemCategoryDef } from "../config/problemCategories.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Resolves and validates a team's category + option-type choice into the
 * three server-derived fields the Team row actually stores. This is the one
 * place that turns "problemCategoryCode + problemOptionType [+ proposed
 * text]" into a trustworthy problemStatementId / theme / problemStatement -
 * every caller (create, update) must go through this rather than deriving
 * these fields itself, so the rules can't drift between the two call sites.
 *
 * Must be called inside the same $transaction as the Team write when
 * optionType is "open": assigning the sequence number and creating the row
 * that uses it need to succeed or fail together, or a failed team creation
 * would burn a sequence number for nothing (harmless - gaps are fine - but
 * avoidable) and, worse, a retried request could reuse a number if the
 * assignment succeeded outside the transaction but the write didn't.
 */
export async function resolveProblemSelection(
  tx: Prisma.TransactionClient,
  input: {
    problemCategoryCode: string;
    problemOptionType: "ps" | "open";
    proposedProblemStatement?: string;
  },
): Promise<{
  theme: string;
  problemStatement: string;
  problemStatementId: string;
}> {
  let category: ProblemCategoryDef | null = null;
  const dbCat = await tx.problemCategory.findUnique({
    where: { code: input.problemCategoryCode },
  });

  if (dbCat && dbCat.active) {
    category = {
      code: dbCat.code,
      theme: dbCat.theme as "NATIONAL" | "REGIONAL",
      label: dbCat.label,
      psTitle: dbCat.psTitle || undefined,
      psUrl: dbCat.psUrl || undefined,
      psId: dbCat.psId || undefined,
      openId: dbCat.openId || undefined,
    };
  } else if (!dbCat) {
    category = findProblemCategory(input.problemCategoryCode) || null;
  }

  if (!category) {
    throw new AppError(400, `Unknown problem category "${input.problemCategoryCode}".`);
  }

  if (input.problemOptionType === "ps") {
    return resolveOfficialPs(category);
  }

  return resolveOpenProposal(tx, category, input.proposedProblemStatement);
}

function resolveOfficialPs(category: ProblemCategoryDef) {
  // Regional categories have no official PS at all - this should already be
  // rejected by the Zod schema before it reaches here, but the service layer
  // re-checks rather than trusting that the only caller is well-behaved.
  if (!category.psTitle) {
    throw new AppError(
      400,
      `Category "${category.code}" has no official problem statement; choose the open option instead.`,
    );
  }

  return {
    theme: themeLabel(category.theme),
    problemStatement: category.psTitle,
    problemStatementId: `${category.code}-PS`,
  };
}

async function resolveOpenProposal(
  tx: Prisma.TransactionClient,
  category: ProblemCategoryDef,
  proposedProblemStatement: string | undefined,
) {
  // Also re-checked here: the Zod schema requires this to be non-empty
  // whenever optionType is "open", but a missing value at this point would
  // otherwise silently consume a sequence number for a team with no actual
  // proposal on record.
  if (!proposedProblemStatement) {
    throw new AppError(400, "A proposed problem statement is required for the open option.");
  }

  const seq = await nextSequence(tx, category.code);
  const problemStatementId = `${category.code}-OP-${String(seq).padStart(3, "0")}`;

  return {
    theme: themeLabel(category.theme),
    problemStatement: proposedProblemStatement,
    problemStatementId,
  };
}

/**
 * Atomically assigns the next sequence number for a category's open-proposal
 * IDs, via a single upsert (Postgres INSERT ... ON CONFLICT DO UPDATE under
 * the hood) rather than a separate read-then-branch. That matters: a
 * find-then-create-or-update sequence has a real race window the very first
 * time a category is ever used - two concurrent requests could both see "no
 * counter row yet" and both attempt to create one, and only one would win.
 * A single upsert has no such window; Postgres serialises it as one atomic
 * statement. The caller MUST run this inside the same transaction as the
 * Team write (see doc comment above) so the sequence assignment and the row
 * that consumes it succeed or fail together.
 */
async function nextSequence(tx: Prisma.TransactionClient, categoryCode: string): Promise<number> {
  const counter = await tx.problemStatementCounter.upsert({
    where: { categoryCode },
    create: { categoryCode, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return counter.lastSeq;
}
