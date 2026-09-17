-- Persist the Event Registration dossier requirement that every participant
-- has their own Student / Institution ID document.
ALTER TABLE "team_members"
  ADD COLUMN "id_card_path" VARCHAR(500),
  ADD COLUMN "id_card_mime_type" VARCHAR(100),
  ADD COLUMN "id_card_original_name" VARCHAR(255);


-- Existing registrations already stored the leader's document on teams.
-- Backfill that document onto the leader member row so pre-migration drafts
-- remain valid under the new per-participant requirement.
UPDATE "team_members" AS tm
SET
  "id_card_path" = t."id_card_path",
  "id_card_mime_type" = t."id_card_mime_type",
  "id_card_original_name" = t."id_card_original_name"
FROM "teams" AS t
WHERE tm."team_id" = t."id"
  AND tm."role" = 'leader'
  AND t."id_card_path" IS NOT NULL;
