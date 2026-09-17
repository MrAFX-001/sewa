ALTER TABLE "teams"
  ADD CONSTRAINT "teams_participation_type_check"
  CHECK ("participation_type" IN ('Individual', 'Team / Group', 'Organisation'));
