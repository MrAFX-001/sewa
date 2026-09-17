-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'RESOURCE', 'MEMBER');

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "evaluated_at" TIMESTAMP(3),
ADD COLUMN     "evaluated_by" TEXT,
ADD COLUMN     "evaluator_notes" TEXT,
ADD COLUMN     "score" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_mails" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT,
    "target_audience" VARCHAR(50) NOT NULL DEFAULT 'ALL',
    "target_email" VARCHAR(255),
    "subject" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "folder" VARCHAR(50) NOT NULL DEFAULT 'Inbox',
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_mails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_members" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "designation" VARCHAR(150) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "affiliation" VARCHAR(200),
    "image_url" VARCHAR(500),
    "row_number" INTEGER NOT NULL DEFAULT 1,
    "row_title" VARCHAR(100),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "subtitle" VARCHAR(255),
    "image_url" VARCHAR(500) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_categories" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "theme" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "ps_title" VARCHAR(255),
    "ps_url" VARCHAR(500),
    "ps_id" VARCHAR(50),
    "open_id" VARCHAR(50),
    "badge_bg" VARCHAR(30) DEFAULT '#DBEAFE',
    "badge_text" VARCHAR(30) DEFAULT '#0284C7',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "problem_categories_code_key" ON "problem_categories"("code");

-- AddForeignKey
ALTER TABLE "admin_mails" ADD CONSTRAINT "admin_mails_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
