-- CreateEnum
CREATE TYPE "ProblemOptionType" AS ENUM ('ps', 'open');

-- CreateTable
CREATE TABLE "problem_statement_counters" (
    "category_code" VARCHAR(20) NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_statement_counters_pkey" PRIMARY KEY ("category_code")
);

-- AlterTable: add the new team columns with temporary defaults so this
-- applies cleanly against a database that already has team rows, then drop
-- the defaults so every column must be supplied explicitly going forward,
-- matching the Prisma schema (which declares none of these @default()).
--
-- NOTE for anyone running this against a DB with real existing team rows:
-- the temporary defaults below ('' / 'ps' / a placeholder path) are NOT
-- meaningful data - they exist purely so the NOT NULL constraint can be
-- added without failing on old rows. Any pre-existing teams will need their
-- institution_address, problem_category_code, problem_option_type,
-- problem_statement_id and id_card_* columns backfilled with real values
-- before those rows can be trusted. If this project has no real team
-- registrations yet, this note doesn't apply.
ALTER TABLE "teams"
  ADD COLUMN "institution_address"       VARCHAR(300) NOT NULL DEFAULT '',
  ADD COLUMN "problem_category_code"     VARCHAR(20)  NOT NULL DEFAULT '',
  ADD COLUMN "problem_option_type"       "ProblemOptionType" NOT NULL DEFAULT 'ps',
  ADD COLUMN "proposed_problem_statement" VARCHAR(500),
  ADD COLUMN "problem_statement_id"      VARCHAR(40)  NOT NULL DEFAULT '',
  ADD COLUMN "id_card_path"              VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN "id_card_mime_type"         VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN "id_card_original_name"     VARCHAR(255);

ALTER TABLE "teams"
  ALTER COLUMN "institution_address" DROP DEFAULT,
  ALTER COLUMN "problem_category_code" DROP DEFAULT,
  ALTER COLUMN "problem_option_type" DROP DEFAULT,
  ALTER COLUMN "problem_statement_id" DROP DEFAULT,
  ALTER COLUMN "id_card_path" DROP DEFAULT,
  ALTER COLUMN "id_card_mime_type" DROP DEFAULT;

-- CheckConstraint: a DB-level backstop so proposed_problem_statement can
-- never be inconsistent with problem_option_type even via a direct write
-- that bypasses the API/Zod layer entirely.
ALTER TABLE "teams" ADD CONSTRAINT "teams_proposed_statement_matches_option_type"
  CHECK (
    ("problem_option_type" = 'open' AND "proposed_problem_statement" IS NOT NULL)
    OR
    ("problem_option_type" = 'ps' AND "proposed_problem_statement" IS NULL)
  );
