/*
  Warnings:

  - A unique constraint covering the columns `[leader_user_id]` on the table `teams` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "teams_leader_user_id_key" ON "teams"("leader_user_id");



