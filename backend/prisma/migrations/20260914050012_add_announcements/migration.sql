-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "announcements_title_key" ON "announcements"("title");

-- CreateIndex
CREATE INDEX "announcements_published_at_idx" ON "announcements"("published_at" DESC);
