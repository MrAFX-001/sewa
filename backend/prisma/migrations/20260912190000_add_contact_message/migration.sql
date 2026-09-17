-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('open', 'resolved');

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "team_or_affiliation_id" VARCHAR(100),
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'open',
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_messages_status_created_at_idx" ON "contact_messages"("status", "created_at");
